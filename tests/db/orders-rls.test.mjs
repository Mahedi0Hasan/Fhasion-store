/**
 * Database tests: RLS, order placement, stock, coupons, webhooks, tracking.
 * Runs against a throwaway Postgres with the Supabase shim:
 *   TEST_PG_HOST=/tmp TEST_PG_PORT=54329 node --test tests/db
 * (see README › Testing). Never point this at production.
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import pg from "pg";

const cfg = { host: process.env.TEST_PG_HOST ?? "/tmp", port: Number(process.env.TEST_PG_PORT ?? 54329), user: "postgres" };
const DB = "demo_test";
const root = new URL("../../", import.meta.url).pathname;
const sqlFile = (p) => readFileSync(root + p, "utf8");

async function client() { const c = new pg.Client({ ...cfg, database: DB }); await c.connect(); return c; }
async function as(role, fn, sub) {
  const c = await client();
  try {
    await c.query("begin");
    await c.query(`set local role ${role}`);
    if (sub) await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub, role })]);
    return await fn(c);
  } finally { await c.query("rollback").catch(() => {}); await c.end(); }
}
async function service(fn) { // committed, like the real server
  const c = await client();
  try { await c.query("set role service_role"); return await fn(c); } finally { await c.end(); }
}
const order = (over = {}) => ({
  idempotency_key: crypto.randomUUID(),
  payment_method: "cod",
  shipping_zone_id: "dhaka",
  customer: { name: "Rahim Uddin", email: "Rahim@Example.com", phone: "+8801712345678", country: "BD", address_line1: "House 12, Road 5", city: "Dhaka" },
  lines: [{ product: "p4", size: "M", qty: 2 }],
  ...over,
});
const place = (c, o) => c.query("select public.place_order($1::jsonb) r", [JSON.stringify(o)]).then((r) => r.rows[0].r);
const stock = async (c, sku) => (await c.query("select i.quantity from inventory i join product_variants v on v.id=i.variant_id where v.sku=$1", [sku])).rows[0].quantity;

before(async () => {
  const admin = new pg.Client({ ...cfg, database: "postgres" });
  await admin.connect();
  await admin.query(`drop database if exists ${DB} with (force)`);
  await admin.query(`create database ${DB}`);
  await admin.end();
  const c = await client();
  await c.query(sqlFile("supabase/tests/00_supabase_shim.sql"));
  for (const f of readdirSync(root + "supabase/migrations").sort()) await c.query(sqlFile("supabase/migrations/" + f));
  await c.query(sqlFile("supabase/seed.sql"));
  await c.end();
});

// ───────────── RLS ─────────────
test("anon reads the active catalogue", () => as("anon", async (c) => {
  assert.equal((await c.query("select count(*)::int n from products")).rows[0].n, 8);
  assert.ok((await c.query("select count(*)::int n from inventory")).rows[0].n > 0);
}));

test("anon cannot see orders, coupons, payments or subscribers", () => as("anon", async (c) => {
  for (const t of ["orders", "order_items", "coupons", "payments", "payment_events", "newsletter_subscribers"]) {
    assert.equal((await c.query(`select count(*)::int n from ${t}`)).rows[0].n, 0, t);
  }
}));

test("anon cannot write catalogue or orders", () => as("anon", async (c) => {
  const r = await c.query("update products set price_bdt = 1 returning id");
  assert.equal(r.rowCount, 0, "RLS hides every row from anon updates");
  await assert.rejects(c.query("insert into coupons (code, kind, value) values ('HACK','fixed',99999)"), /row-level security/);
}));

test("anon and signed-in customers cannot call order functions", async () => {
  for (const role of ["anon", "authenticated"]) {
    await as(role, async (c) => {
      await assert.rejects(c.query("select public.place_order('{}'::jsonb)"), /permission denied/);
    }, role === "authenticated" ? crypto.randomUUID() : undefined);
    await as(role, async (c) => {
      await assert.rejects(c.query("select public.track_order('x','y')"), /permission denied/);
    }, role === "authenticated" ? crypto.randomUUID() : undefined);
  }
});

test("signed-in user without a role cannot read orders or escalate", async () => {
  const uid = crypto.randomUUID();
  await service(async (c) => { await c.query("reset role"); await c.query("insert into auth.users (id, email) values ($1, $2)", [uid, `u${uid.slice(0,6)}@x.com`]); });
  await as("authenticated", async (c) => {
    assert.equal((await c.query("select count(*)::int n from orders")).rows[0].n, 0);
    const r = await c.query("update profiles set role = 'admin' where id = $1 returning id", [uid]);
    assert.equal(r.rowCount, 0, "self-promotion must be blocked");
  }, uid);
});

test("staff can read orders", async () => {
  const uid = crypto.randomUUID();
  await service(async (c) => {
    await c.query("reset role");
    await c.query("insert into auth.users (id, email) values ($1, $2)", [uid, `s${uid.slice(0,6)}@x.com`]);
    await c.query("update profiles set role = 'staff' where id = $1", [uid]);
    await c.query("set role service_role");
    await place(c, order());
  });
  await as("authenticated", async (c) => {
    assert.ok((await c.query("select count(*)::int n from orders")).rows[0].n >= 1);
    // staff (not admin) cannot change shipping zones
    const r = await c.query("update shipping_zones set fee_bdt = 0 returning id");
    assert.equal(r.rowCount, 0);
  }, uid);
});

// ───────────── orders ─────────────
test("COD order: server-side totals, stock decrement, events", () => service(async (c) => {
  const before = await stock(c, "DM-P4-M");
  const r = await place(c, order({ lines: [{ product: "p4", size: "M", qty: 2 }, { product: "p3", size: "37", qty: 1 }] }));
  assert.match(r.order_number, /^DM-\d{6}-[0-9A-F]{6}$/);
  const o = (await c.query("select * from orders where id = $1", [r.order_id])).rows[0];
  // 2 × 5,900 + 6,900 (sale) = 18,700; Dhaka free over 5,000
  assert.equal(o.subtotal_bdt, 18700);
  assert.equal(o.shipping_bdt, 0);
  assert.equal(o.total_bdt, 18700);
  assert.equal(o.email, "rahim@example.com");
  assert.equal(await stock(c, "DM-P4-M"), before - 2);
  assert.equal((await c.query("select count(*)::int n from order_items where order_id=$1", [r.order_id])).rows[0].n, 2);
  assert.equal((await c.query("select status from payments where order_id=$1", [r.order_id])).rows[0].status, "pending");
}));

test("client-supplied prices and totals are ignored", () => service(async (c) => {
  const r = await place(c, order({ total_bdt: 1, lines: [{ product: "p4", size: "L", qty: 1, price: 1 }] }));
  assert.equal(r.total_bdt, 5900); // DB price; ≥ ৳5,000 inside Dhaka ⇒ free delivery
}));

test("shipping fee applies under the free threshold", () => service(async (c) => {
  const r = await place(c, order({ shipping_zone_id: "outside-dhaka", lines: [{ product: "p4", size: "XL", qty: 1 }] }));
  assert.equal(r.total_bdt, 5900 + 150);
}));

test("coupon applied in DB with cap, usage counted", () => service(async (c) => {
  const used = (await c.query("select used_count from coupons where code='WELCOME10'")).rows[0].used_count;
  const r = await place(c, order({ coupon_code: "welcome10", lines: [{ product: "p5", size: "M", qty: 1 }] }));
  const o = (await c.query("select * from orders where id=$1", [r.order_id])).rows[0];
  assert.equal(o.discount_bdt, 2000); // 10% of 22,500 capped at 2,000
  assert.equal(o.total_bdt, 22500 - 2000);
  assert.equal((await c.query("select used_count from coupons where code='WELCOME10'")).rows[0].used_count, used + 1);
}));

test("invalid coupon rejects the whole order and keeps stock", () => service(async (c) => {
  const s = await stock(c, "DM-P4-S");
  await assert.rejects(place(c, order({ coupon_code: "NOPE", lines: [{ product: "p4", size: "S", qty: 1 }] })), /COUPON:/);
  assert.equal(await stock(c, "DM-P4-S"), s);
}));

test("rejects: out of stock, sold-out size, unknown item, bad qty, COD abroad, zone mismatch", () => service(async (c) => {
  await assert.rejects(place(c, order({ lines: [{ product: "p1", size: "L", qty: 1 }] })), /OUT_OF_STOCK/);
  await assert.rejects(place(c, order({ lines: [{ product: "p1", size: "XS", qty: 9 }] })), /OUT_OF_STOCK/);
  await assert.rejects(place(c, order({ lines: [{ product: "nope", size: "M", qty: 1 }] })), /UNKNOWN_ITEM/);
  await assert.rejects(place(c, order({ lines: [{ product: "p4", size: "M", qty: 11 }] })), /INVALID_QTY|OUT_OF_STOCK/);
  await assert.rejects(place(c, order({ shipping_zone_id: "international", customer: { ...order().customer, country: "GB", phone: "+447700900123" } })), /COD_BD_ONLY/);
  await assert.rejects(place(c, order({ shipping_zone_id: "international" })), /INVALID_ZONE/);
  await assert.rejects(place(c, order({ lines: [] })), /EMPTY_CART/);
}));

test("idempotency: a retried submit returns the same order", () => service(async (c) => {
  const o = order({ lines: [{ product: "p4", size: "XXL", qty: 1 }] });
  const s = await stock(c, "DM-P4-XXL");
  const a = await place(c, o);
  const b = await place(c, o);
  assert.equal(a.order_number, b.order_number);
  assert.equal(b.duplicate, true);
  assert.equal(await stock(c, "DM-P4-XXL"), s - 1);
}));

test("concurrency: two buyers, one unit left — exactly one wins", async () => {
  // p5 XS has 1 unit in the seed
  const [a, b] = await Promise.allSettled([
    service((c) => place(c, order({ lines: [{ product: "p5", size: "XS", qty: 1 }] }))),
    service((c) => place(c, order({ lines: [{ product: "p5", size: "XS", qty: 1 }] }))),
  ]);
  const ok = [a, b].filter((x) => x.status === "fulfilled").length;
  assert.equal(ok, 1);
  await service(async (c) => assert.equal(await stock(c, "DM-P5-XS"), 0));
});

// ───────────── tracking ─────────────
test("tracking needs the right phone and hides address/email", () => service(async (c) => {
  const r = await place(c, order({ lines: [{ product: "p6", size: "M", qty: 1 }] }));
  const ok = (await c.query("select public.track_order($1,$2) t", [r.order_number.toLowerCase(), "+8801712345678"])).rows[0].t;
  assert.equal(ok.order_number, r.order_number);
  assert.equal(ok.items[0].name, "Wide-Leg Wool Trouser");
  assert.ok(!("email" in ok) && !("address_line1" in ok));
  const bad = (await c.query("select public.track_order($1,$2) t", [r.order_number, "+8801700000000"])).rows[0].t;
  assert.equal(bad, null);
}));

// ───────────── payments ─────────────
async function stripeOrder(c, lines = [{ product: "p2", size: "M", qty: 1 }]) {
  const r = await place(c, order({ payment_method: "stripe", shipping_zone_id: "international", customer: { ...order().customer, country: "GB", phone: "+447700900123" }, lines }));
  const ref = "cs_test_" + r.order_number;
  await c.query("update payments set provider_ref=$1 where order_id=$2", [ref, r.order_id]);
  return { ...r, ref };
}
const event = (c, id, ref, outcome, amount) =>
  c.query("select public.apply_payment_event('stripe',$1,'{}'::jsonb,$2,$3,$4) r", [id, ref, outcome, amount]).then((x) => x.rows[0].r);

test("webhook: paid → confirmed; duplicate event ignored", () => service(async (c) => {
  const o = await stripeOrder(c);
  assert.equal(o.total_bdt, 16800 + 2500);
  assert.equal(await event(c, "evt_1" + o.ref, o.ref, "paid", o.total_bdt), "paid");
  assert.equal(await event(c, "evt_1" + o.ref, o.ref, "paid", o.total_bdt), "duplicate");
  const row = (await c.query("select status, payment_status from orders where id=$1", [o.order_id])).rows[0];
  assert.deepEqual(row, { status: "confirmed", payment_status: "paid" });
}));

test("webhook: amount mismatch is not marked paid", () => service(async (c) => {
  const o = await stripeOrder(c, [{ product: "p2", size: "S", qty: 1 }]);
  assert.equal(await event(c, "evt_mm" + o.ref, o.ref, "paid", 100), "amount_mismatch");
  assert.equal((await c.query("select payment_status from orders where id=$1", [o.order_id])).rows[0].payment_status, "pending");
}));

test("webhook: expired session cancels and restocks", () => service(async (c) => {
  const s = await stock(c, "DM-P2-L");
  const o = await stripeOrder(c, [{ product: "p2", size: "L", qty: 2 }]);
  assert.equal(await stock(c, "DM-P2-L"), s - 2);
  assert.equal(await event(c, "evt_ex" + o.ref, o.ref, "expired", null), "expired");
  assert.equal(await stock(c, "DM-P2-L"), s);
  assert.equal((await c.query("select status from orders where id=$1", [o.order_id])).rows[0].status, "cancelled");
}));

test("release_unpaid_orders frees stock from abandoned online payments", () => service(async (c) => {
  const s = await stock(c, "DM-P2-XL");
  const o = await stripeOrder(c, [{ product: "p2", size: "XL", qty: 1 }]);
  await c.query("reset role");
  await c.query("update orders set created_at = now() - interval '2 hours' where id=$1", [o.order_id]);
  await c.query("set role service_role");
  assert.ok((await c.query("select public.release_unpaid_orders() n")).rows[0].n >= 1);
  assert.equal(await stock(c, "DM-P2-XL"), s);
}));

// ───────────── admin (Phase 6) ─────────────
async function makeUser(role) {
  const uid = crypto.randomUUID();
  await service(async (c) => {
    await c.query("reset role");
    await c.query("insert into auth.users (id, email) values ($1, $2)", [uid, `${role ?? "none"}-${uid.slice(0, 8)}@x.com`]);
    if (role) await c.query("update profiles set role = $1 where id = $2", [role, uid]);
  });
  return uid;
}
/** Expect a failure without poisoning the surrounding transaction. */
async function rejects(c, fn, re) {
  await c.query("savepoint expect");
  await assert.rejects(fn(), re);
  await c.query("rollback to savepoint expect");
}
const upd = (c, id, status, tracking = null) =>
  c.query("select (public.staff_update_order($1, $2::order_status, null, 'Steadfast', $3)).status s", [id, status, tracking]).then((r) => r.rows[0].s);

test("admin fns: anon blocked, no-role user forbidden and sees zero", async () => {
  const placed = await service((c) => place(c, order({ lines: [{ product: "p8", size: "S", qty: 1 }] })));
  await as("anon", async (c) => { await assert.rejects(c.query("select public.staff_dashboard(7)"), /permission denied/); });
  const nobody = await makeUser(null);
  await as("authenticated", async (c) => {
    await rejects(c, () => upd(c, placed.order_id, "confirmed"), /FORBIDDEN/);
    const d = (await c.query("select public.staff_dashboard(7) d")).rows[0].d;
    assert.equal(d.orders, 0, "RLS hides orders from non-staff");
    assert.equal((await c.query("select count(*)::int n from staff_customers")).rows[0].n, 0);
    await rejects(c, () => c.query("insert into products (slug,name,category_id,gender,colour,colour_hex,price_bdt) select 'x','X',id,'men','Red','#ff0000',100 from categories limit 1"), /row-level security/);
  }, nobody);
});

test("staff: status flow, tracking required, bad transitions, COD paid on delivery", async () => {
  const staff = await makeUser("staff");
  const placed = await service((c) => place(c, order({ lines: [{ product: "p8", size: "L", qty: 1 }] })));
  await as("authenticated", async (c) => {
    assert.equal(await upd(c, placed.order_id, "confirmed"), "confirmed");
    await rejects(c, () => upd(c, placed.order_id, "shipped"), /TRACKING_REQUIRED/);
    await rejects(c, () => upd(c, placed.order_id, "delivered"), /BAD_TRANSITION/);
    assert.equal(await upd(c, placed.order_id, "shipped", "SF123"), "shipped");
    assert.equal(await upd(c, placed.order_id, "delivered"), "delivered");
    const o = (await c.query("select payment_status, tracking_number, courier from orders where id=$1", [placed.order_id])).rows[0];
    assert.deepEqual(o, { payment_status: "paid", tracking_number: "SF123", courier: "Steadfast" });
    const d = (await c.query("select public.staff_dashboard(7) d")).rows[0].d;
    assert.ok(d.orders >= 1 && d.revenue_bdt > 0);
  }, staff);
});

test("staff cancel restocks; staff can't change delivery fees, admin can", async () => {
  const staff = await makeUser("staff");
  const admin = await makeUser("admin");
  const s = await service((c) => stock(c, "DM-P8-XL"));
  const placed = await service((c) => place(c, order({ lines: [{ product: "p8", size: "XL", qty: 1 }] })));
  await as("authenticated", async (c) => {
    assert.equal(await upd(c, placed.order_id, "cancelled"), "cancelled");
    assert.equal(await stock(c, "DM-P8-XL"), s);
    assert.equal((await c.query("update shipping_zones set fee_bdt = 1 returning id")).rowCount, 0);
  }, staff);
  await as("authenticated", async (c) => {
    assert.equal((await c.query("update shipping_zones set fee_bdt = 90 where id='dhaka' returning id")).rowCount, 1);
  }, admin);
});

// ───────────── store settings / USD rate ─────────────
test("usd_rate: public can read, only admin can change, absurd values refused", async () => {
  await as("anon", async (c) => {
    assert.equal((await c.query("select (value->>'bdt_per_usd')::int r from store_settings where key='usd_rate'")).rows[0].r, 122);
    assert.equal((await c.query("update store_settings set value='{\"bdt_per_usd\":1}' returning key")).rowCount, 0);
  });
  const staff = await makeUser("staff");
  await as("authenticated", async (c) => {
    assert.equal((await c.query("update store_settings set value='{\"bdt_per_usd\":130}' where key='usd_rate' returning key")).rowCount, 0);
  }, staff);
  const admin = await makeUser("admin");
  await as("authenticated", async (c) => {
    assert.equal((await c.query("update store_settings set value='{\"bdt_per_usd\":125}' where key='usd_rate' returning key")).rowCount, 1);
    await rejects(c, () => c.query("update store_settings set value='{\"bdt_per_usd\":5}' where key='usd_rate'"), /usd_rate_sane/);
  }, admin);
});

test("contact_messages: anon can't read or write; staff can read", async () => {
  await service(async (c) => { await c.query("insert into contact_messages (name,email,topic,message) values ('Test','t@x.co','other','hello there, testing')"); });
  await as("anon", async (c) => {
    assert.equal((await c.query("select count(*)::int n from contact_messages")).rows[0].n, 0);
    await rejects(c, () => c.query("insert into contact_messages (name,email,topic,message) values ('X','x@x.co','other','sneaky direct insert')"), /row-level security/);
  });
  const staff = await makeUser("staff");
  await as("authenticated", async (c) => { assert.ok((await c.query("select count(*)::int n from contact_messages")).rows[0].n >= 1); }, staff);
});

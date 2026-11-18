import Link from "next/link";
import { userClient } from "@/lib/supabase/server";
import { Card, PageHead } from "@/components/admin/ui";
import { ProductForm } from "../product-form";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  const db = await userClient();
  const { data: categories } = await db.from("categories").select("id,name").order("sort");
  return (
    <>
      <Link href="/admin/products" className="text-sm text-stone hover:text-ink">← Products</Link>
      <PageHead title="New product" sub="Create it first, then add sizes, stock and photos." />
      <Card className="max-w-3xl">
        <ProductForm
          categories={categories ?? []}
          values={{ name: "", slug: "", category_id: "", gender: "women", colour: "", colour_hex: "#d8c3a5", price_bdt: "", sale_price_bdt: "", description: "", details: [], is_active: false, is_new: true, is_bestseller: false }}
        />
      </Card>
    </>
  );
}

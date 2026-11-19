"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, LayoutDashboard, Mail, Package, Settings, ShoppingBag, Tag, Tags, Users, ExternalLink } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingBag },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/inventory", label: "Inventory", Icon: Boxes },
  { href: "/admin/categories", label: "Categories", Icon: Tags },
  { href: "/admin/coupons", label: "Coupons", Icon: Tag },
  { href: "/admin/customers", label: "Customers", Icon: Users },
  { href: "/admin/messages", label: "Messages", Icon: Mail },
  { href: "/admin/reports", label: "Reports", Icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", Icon: Settings, adminOnly: true },
];

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="overflow-x-auto px-3 pb-3 md:pb-0">
      <ul className="flex gap-1 md:flex-col">
        {ITEMS.filter((i) => !i.adminOnly || isAdmin).map(({ href, label, Icon }) => {
          const on = href === "/admin" ? path === href : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={`flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${on ? "bg-ink text-ivory" : "text-ink hover:bg-sand"}`}
              >
                <Icon className="size-4" strokeWidth={1.5} /> {label}
              </Link>
            </li>
          );
        })}
        <li className="md:mt-4">
          <Link href="/" target="_blank" className="flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2 text-sm text-stone hover:bg-sand">
            <ExternalLink className="size-4" strokeWidth={1.5} /> View store
          </Link>
        </li>
      </ul>
    </nav>
  );
}

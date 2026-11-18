import { userClient } from "@/lib/supabase/server";
import { Card, PageHead } from "@/components/admin/ui";
import { CategoryForm } from "../manage-forms";

export const metadata = { title: "Categories" };

export default async function Categories() {
  const db = await userClient();
  const { data } = await db.from("categories").select("id,name,slug,sort,is_active,products(count)").order("sort");
  return (
    <>
      <PageHead title="Categories" sub="Shown as filters in the shop. Hidden categories disappear from the storefront." />
      <Card title="Add a category" className="mb-6 max-w-3xl"><CategoryForm /></Card>
      <Card title={`${data?.length ?? 0} categories`} className="max-w-3xl">
        <div className="space-y-2">
          {(data ?? []).map((c) => (
            <div key={c.id}>
              <CategoryForm c={c} />
              <p className="mt-0.5 pl-1 text-[0.7rem] text-stone">{(c.products as unknown as { count: number }[])[0]?.count ?? 0} products</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

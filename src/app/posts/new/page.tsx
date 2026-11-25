import { requireRole, companyWhere } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibleCompanies } from "@/lib/queries";
import { PostForm } from "@/components/PostForm";

export default async function NewPost() {
  const user = await requireRole("EDITOR");
  const [companies, campaigns] = await Promise.all([
    visibleCompanies(user),
    db.campaign.findMany({ where: companyWhere(user), orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nuevo post</h1>
      <PostForm companies={companies} campaigns={campaigns} />
    </div>
  );
}

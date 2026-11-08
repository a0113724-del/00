import { requireUser } from "@/lib/session";
import { db } from "@/lib/data";
import { LIMITS } from "@/lib/types";
import { Analyzer } from "@/components/Analyzer";
import { Banner } from "@/components/ui/primitives";

export const metadata = { title: "المحلل · سبيكة AI" };

export default async function AnalyzePage() {
  const user = await requireUser();
  const limit = LIMITS[user.tier];
  const used = await db.usageToday(user.id);
  return (
    <>
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">محلل الشارت</h1>
        <p className="text-sm text-muted">ارفع صورة شارت الذهب واختار نوع الصفقة.</p>
      </section>
      <Analyzer remaining={Math.max(0, limit - used)} limit={limit} />
      <Banner>التحليل تعليمي وليس نصيحة مالية. التداول بي مخاطرة، والقرار قرارك.</Banner>
    </>
  );
}

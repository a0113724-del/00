import Link from "next/link";
import { ImagePlus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/data";
import { Card, EmptyState } from "@/components/ui/primitives";
import { TradeSetupCard } from "@/components/TradeSetupCard";
import { effectiveStatus, toCard } from "@/lib/view";

export const metadata = { title: "تحليلاتي · سبيكة AI" };

export default async function AnalysesPage() {
  const user = await requireUser();
  const list = (await db.listSetups(user.id)).map(effectiveStatus);
  return (
    <>
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">تحليلاتي</h1>
        <p className="text-sm text-muted">كل تحليل محفوظ هنا ويا حالته.</p>
      </section>
      {list.length === 0 ? (
        <Card><EmptyState icon={<ImagePlus className="size-8" />} title="ماكو تحليلات بعد" hint="ارفع أول صورة شارت وشوف التحليل."
          action={<Link href="/analyze" className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-semibold text-on-accent">ابدأ التحليل</Link>} /></Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((s) => (
            <li key={s.id}><Link href={`/analyses/${s.id}`} className="block rounded-lg"><TradeSetupCard s={toCard(s)} /></Link></li>
          ))}
        </ul>
      )}
    </>
  );
}

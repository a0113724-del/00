import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/data";
import { Banner, Card } from "@/components/ui/primitives";
import { TradeSetupCard } from "@/components/TradeSetupCard";
import { effectiveStatus, toCard } from "@/lib/view";

export default async function AnalysisDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const raw = await db.getSetup(user.id, id);
  if (!raw) notFound();
  const s = effectiveStatus(raw);
  const img = `/api/${s.imagePath.replace(/\\/g, "/")}`;
  return (
    <>
      <Link href="/analyses" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ArrowRight aria-hidden className="size-4" />تحليلاتي</Link>
      <h1 className="text-xl font-bold">تفاصيل التحليل</h1>
      {s.mock && <Banner tone="warning">وضع تجريبي: هذا تحليل وهمي لعرض الشكل فقط.</Banner>}
      {s.warnings.filter((w) => !s.mock || !w.includes("تجريبي")).map((w) => <Banner key={w} tone="warning">{w}</Banner>)}
      <TradeSetupCard s={toCard(s)} />
      <Card className="flex flex-col gap-2">
        <h2 className="text-md font-bold">الصورة اللي رفعتها</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="صورة الشارت اللي انحلل" className="max-h-96 w-full rounded-md bg-surface-2 object-contain" />
        <dl className="grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
          <div><dt>الفريم بالصورة</dt><dd className="num text-text">{s.timeframeSeen || "—"}</dd></div>
          <div><dt>السعر بالصورة</dt><dd className="num text-text">{s.priceSeen?.toFixed(2) ?? "—"}</dd></div>
          <div><dt>صالحة لحد</dt><dd className="num text-text">{new Intl.DateTimeFormat("ar-IQ", { timeZone: "Asia/Baghdad", dateStyle: "short", timeStyle: "short", numberingSystem: "latn" }).format(new Date(s.validUntil))}</dd></div>
          <div><dt>المحرك</dt><dd className="num text-text">{s.provider}</dd></div>
        </dl>
        {s.note && <p className="text-sm"><span className="text-muted">ملاحظتك: </span>{s.note}</p>}
      </Card>
      <Banner>التحليل تعليمي وليس نصيحة مالية.</Banner>
    </>
  );
}

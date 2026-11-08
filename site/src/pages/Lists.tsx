import { useEffect, useState } from "react";
import { ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { Banner, Card, EmptyState, StatTile } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { TradeSetupCard } from "@/components/TradeSetupCard";
import { effectiveStatus, toCard } from "@/lib/view";
import type { StoredSetup } from "@/lib/types";
import { deleteSetup, getImage, getSetup, listSetups, usageToday } from "../lib/store";
import { settings } from "../lib/settings";
import { A, go } from "../router";

function useSetups() {
  const [list, setList] = useState<StoredSetup[] | null>(null);
  useEffect(() => { listSetups().then((l) => setList(l.map(effectiveStatus))).catch(() => setList([])); }, []);
  return list;
}
const Skeleton = () => <div className="h-40 animate-pulse rounded-lg bg-surface" aria-label="جاري التحميل" />;

export function Home() {
  const list = useSetups();
  const name = settings.getName();
  const last = list?.[0];
  return (
    <>
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">{name ? `هلا ${name}` : "هلا بيك"}</h1>
        <p className="text-sm text-muted">حلّل شارت ذهب، أو تصفح مكتبة الاستراتيجيات.</p>
      </section>
      <A to="/analyze" className="rounded-lg">
        <Card variant="highlight" className="flex items-center gap-4 hover:shadow-glow">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-accent text-on-accent"><ImagePlus aria-hidden className="size-6" /></span>
          <span className="flex flex-col"><span className="text-md font-bold">حلّل شارت ذهب</span><span className="text-sm text-on-accent-soft">ارفع صورة، اختار سريعة لو طويلة، وخذ خطة كاملة</span></span>
        </Card>
      </A>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="تحليلات اليوم" value={String(usageToday())} />
        <StatTile label="كل التحليلات" value={list ? String(list.length) : undefined} />
        <StatTile label="منها صفقات" value={list ? String(list.filter((s) => s.direction !== "none").length) : undefined} />
      </div>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">آخر تحليل</h2>
          {last && <A to="/analyses" className="text-sm text-accent hover:underline">كل التحليلات</A>}
        </div>
        {!list ? <Skeleton /> : last ? <A to={`/a/${last.id}`} className="block rounded-lg"><TradeSetupCard s={toCard(last)} /></A>
          : <Card><EmptyState icon={<ImagePlus className="size-8" />} title="ماكو تحليلات بعد" hint="أول تحليل ياخذ أقل من دقيقة." /></Card>}
      </section>
    </>
  );
}

export function Analyses() {
  const list = useSetups();
  return (
    <>
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">تحليلاتي</h1>
        <p className="text-sm text-muted">محفوظة على جهازك بس.</p>
      </section>
      {!list ? <><Skeleton /><Skeleton /></> : list.length === 0 ? (
        <Card><EmptyState icon={<ImagePlus className="size-8" />} title="ماكو تحليلات بعد" hint="ارفع أول صورة شارت."
          action={<A to="/analyze" className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-semibold text-on-accent">ابدأ التحليل</A>} /></Card>
      ) : (
        <ul className="flex flex-col gap-3">{list.map((s) => <li key={s.id}><A to={`/a/${s.id}`} className="block rounded-lg"><TradeSetupCard s={toCard(s)} /></A></li>)}</ul>
      )}
    </>
  );
}

export function Detail({ id }: { id: string }) {
  const [s, setS] = useState<StoredSetup | null | undefined>(undefined);
  const [img, setImg] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    getSetup(id).then((x) => setS(x ? effectiveStatus(x) : null));
    getImage(id).then((b) => { if (b) { url = URL.createObjectURL(b); setImg(url); } });
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [id]);
  if (s === undefined) return <Skeleton />;
  if (s === null) return <Card><EmptyState icon={<ImagePlus className="size-8" />} title="التحليل مو موجود" hint="يمكن انمسح من هالجهاز." /></Card>;
  return (
    <>
      <A to="/analyses" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ArrowRight aria-hidden className="size-4" />تحليلاتي</A>
      <h1 className="text-xl font-bold">تفاصيل التحليل</h1>
      {s.warnings.map((w) => <Banner key={w} tone="warning">{w}</Banner>)}
      <TradeSetupCard s={toCard(s)} />
      {!!s.strategies?.some((x) => x.note) && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-md font-bold">ليش هاي الاستراتيجيات؟</h2>
          <ul className="flex flex-col gap-1.5 text-sm">{s.strategies.filter((x) => x.note).map((x) => <li key={x.id} className="text-muted">• {x.note}</li>)}</ul>
        </Card>
      )}
      <Card className="flex flex-col gap-2">
        <h2 className="text-md font-bold">الصورة اللي رفعتها</h2>
        {img ? <img src={img} alt="صورة الشارت اللي انحلل" className="max-h-96 w-full rounded-md bg-surface-2 object-contain" /> : <div className="h-40 animate-pulse rounded-md bg-surface-2" />}
        <dl className="grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
          <div><dt>الفريم بالصورة</dt><dd className="num text-text">{s.timeframeSeen || "—"}</dd></div>
          <div><dt>السعر بالصورة</dt><dd className="num text-text">{s.priceSeen?.toFixed(2) ?? "—"}</dd></div>
          <div><dt>الموديل</dt><dd className="num text-text">{s.model}</dd></div>
          <div><dt>نسخة التعليمات</dt><dd className="num text-text">{s.promptVersion}</dd></div>
        </dl>
      </Card>
      <Button variant="secondary" icon={<Trash2 aria-hidden className="size-4" />} onClick={async () => { if (confirm("تمسح هذا التحليل من جهازك؟")) { await deleteSetup(id); go("/analyses"); } }}>امسح التحليل</Button>
    </>
  );
}

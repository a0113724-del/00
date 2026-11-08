import Link from "next/link";
import { ImagePlus, Radio, BookOpen } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/data";
import { LIMITS } from "@/lib/types";
import { Card, EmptyState, StatTile } from "@/components/ui/primitives";
import { TradeSetupCard } from "@/components/TradeSetupCard";
import { effectiveStatus, toCard } from "@/lib/view";

export default async function Home() {
  const user = await requireUser();
  const [setups, used] = await Promise.all([db.listSetups(user.id), db.usageToday(user.id)]);
  const all = setups.map(effectiveStatus);
  const last = all[0];
  const trades = all.filter((s) => s.direction !== "none").length;

  return (
    <>
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">هلا {user.displayName}</h1>
        <p className="text-sm text-muted">شنو ناوي اليوم؟ حلّل شارت، تابع الإشارات، أو كمّل درسك.</p>
      </section>

      <Link href="/analyze" className="rounded-lg focus-visible:outline-2">
        <Card variant="highlight" className="flex items-center gap-4 hover:shadow-glow">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-accent text-on-accent"><ImagePlus aria-hidden className="size-6" /></span>
          <span className="flex flex-col">
            <span className="text-md font-bold">حلّل شارت ذهب</span>
            <span className="text-sm text-on-accent-soft">ارفع صورة، اختار سريعة لو طويلة، وخذ خطة كاملة</span>
          </span>
        </Card>
      </Link>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="تحليلات اليوم" value={`${used}/${LIMITS[user.tier]}`} />
        <StatTile label="كل التحليلات" value={String(all.length)} />
        <StatTile label="منها صفقات" value={String(trades)} />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">آخر تحليل</h2>
          {last && <Link href="/analyses" className="text-sm text-accent hover:underline">كل التحليلات</Link>}
        </div>
        {last ? <Link href={`/analyses/${last.id}`} className="rounded-lg"><TradeSetupCard s={toCard(last)} /></Link>
          : <Card><EmptyState icon={<ImagePlus className="size-8" />} title="ماكو تحليلات بعد" hint="أول تحليل ياخذ أقل من دقيقة." /></Card>}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/signals"><Card variant="interactive" className="flex items-center gap-3"><Radio aria-hidden className="size-5 text-accent" /><span className="text-sm font-semibold">الإشارات</span></Card></Link>
        <Link href="/learn"><Card variant="interactive" className="flex items-center gap-3"><BookOpen aria-hidden className="size-5 text-accent" /><span className="text-sm font-semibold">التعلم</span></Card></Link>
      </div>
    </>
  );
}

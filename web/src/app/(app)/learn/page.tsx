import { STRATEGIES } from "@/lib/ai/strategies";
import { Badge, Banner, Card } from "@/components/ui/primitives";

export const metadata = { title: "مكتبة الاستراتيجيات · سبيكة AI" };
const FAMILIES: Record<string, string> = { price_action: "حركة السعر", patterns: "النماذج الفنية", smc: "السيولة والمؤسسات (SMC)", indicators: "المؤشرات", sessions: "الجلسات والصناديق", structure: "هيكل السوق" };

export default function LearnPage() {
  return (
    <>
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">مكتبة الاستراتيجيات</h1>
        <p className="text-sm text-muted">{STRATEGIES.length} استراتيجية يفحصها محلل سبيكة بكل صورة. الدروس والاختبارات توصل بالمرحلة الرابعة.</p>
      </section>
      <Banner>الاستراتيجية اللي مكتوب جنبها &quot;مختبرة&quot; جربناها على 7 سنين من بيانات الذهب. الباقي معروفة بالتحليل الفني، ونسبة نجاحها على الذهب نقيسها من تحليلات التطبيق نفسه.</Banner>
      {Object.entries(FAMILIES).map(([fid, fname]) => (
        <section key={fid} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{fname}</h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {STRATEGIES.filter((s) => s.family === fid).map((s) => (
              <li key={s.id}>
                <Card className="flex h-full flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{s.name_ar}</h3>
                    <span className="num text-xs text-muted">{s.name_en}</span>
                    {s.rules.includes("مختبرة") && <Badge tone="success">مختبرة</Badge>}
                  </div>
                  <p className="text-sm text-muted">{s.rules}</p>
                  <div className="flex gap-1.5">{s.styles.map((st) => <Badge key={st} tone="accent">{st === "scalp" ? "سريعة" : "طويلة"}</Badge>)}</div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

"use client";
import { useState } from "react";
import { BarChart3, BookOpen, Home, ImagePlus, Mic, Radio, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, Banner, Card, EmptyState, Input, ProgressBar, Segmented, StatTile, Switch } from "@/components/ui/primitives";
import { TradeSetupCard, type Setup } from "@/components/TradeSetupCard";

const now = new Date("2026-11-08T08:35:00Z").toISOString();
const samples: Setup[] = [
  { direction: "buy", style: "scalp", source: "ai", confidence: "medium", entryLow: 4070.5, entryHigh: 4072.0, sl: 4062.0, tp1: 4085.0, tp2: 4095.0,
    invalidation: "إغلاق شمعة 15 دقيقة تحت 4060", rationale: "السعر رجع لمنطقة دعم بعد كسر قمة الصبح، والشموع الأخيرة بيها رفض واضح للهبوط.", status: "active", createdAt: now, pnlR: 0.8 },
  { direction: "sell", style: "swing", source: "orb-a", confidence: "high", entryLow: 4101.0, entryHigh: 4101.0, sl: 4113.0, tp1: 4077.0, tp2: 4060.0, status: "tp1", createdAt: now, pnlR: 2.0 },
  { direction: "buy", style: "scalp", source: "ai", confidence: "low", entryLow: 4050.0, entryHigh: 4052.0, sl: 4044.0, tp1: 4062.0, status: "expired", createdAt: now },
  { direction: "none", style: "swing", source: "ai", rationale: "الصورة ما بيها أرقام واضحة على محور السعر، والسوق متذبذب بين 4060 و4080. ارفع صورة أوضح أو انتظر كسر واضح.", status: "no_trade", createdAt: now },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  const [mode, setMode] = useState<"scalp" | "swing" | "trend">("scalp");
  const [on, setOn] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  return (
    <div data-theme={theme} className="min-h-dvh bg-bg text-text">
      <main className="mx-auto flex max-w-[1120px] flex-col gap-10 p-6 pb-28">
        <header className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-md bg-accent text-on-accent shadow-glow"><Sparkles aria-hidden className="size-5" /></span>
            <div>
              <h1 className="text-xl font-bold">سبيكة AI — نظام التصميم</h1>
              <p className="text-sm text-muted">صفحة فحص المكونات (لا تُنشر)</p>
            </div>
          </div>
          <div className="ms-auto">
            <Segmented label="الثيم" value={theme} onChange={setTheme} options={[{ value: "dark", label: "داكن" }, { value: "light", label: "فاتح" }]} />
          </div>
        </header>

        <Section title="الألوان">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {["bg", "surface", "surface-2", "border", "border-input", "text", "muted", "accent", "accent-soft", "success", "danger", "warning"].map((c) => (
              <div key={c} className="flex flex-col gap-1">
                <div className="h-12 rounded-md border border-border" style={{ background: `var(--sb-color-${c === "muted" ? "text-muted" : c})` }} />
                <span className="num text-xs text-muted">{c}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="الخطوط">
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-bold">ذهبك أوضح</p>
            <p className="text-xl font-semibold">تحليل الشارت بثواني</p>
            <p className="text-lg">العنوان المتوسط</p>
            <p className="text-md">النص الأساسي للتطبيق، مقروء ومريح على الموبايل.</p>
            <p className="text-sm text-muted">نص ثانوي وملاحظات</p>
            <p className="num text-xl font-semibold">4,072.35</p>
          </div>
        </Section>

        <Section title="الأزرار">
          <div className="flex flex-wrap gap-2">
            <Button>حلّل الشارت</Button>
            <Button variant="secondary">إلغاء</Button>
            <Button variant="ghost">المزيد</Button>
            <Button variant="buy">شراء</Button>
            <Button variant="sell">بيع</Button>
            <Button loading>جاري التحليل</Button>
            <Button disabled>معطّل</Button>
            <Button size="sm" variant="secondary" icon={<ImagePlus aria-hidden className="size-4" />}>ارفع صورة</Button>
            <button aria-label="تسجيل صوتي" className="grid size-11 place-items-center rounded-md bg-surface-2 hover:bg-border"><Mic aria-hidden className="size-5" /></button>
          </div>
        </Section>

        <Section title="الإدخال والاختيار">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="البريد الإلكتروني" placeholder="name@example.com" type="email" hint="نرسلك رابط دخول، بدون كلمة سر" />
            <Input label="رقم التحويل" defaultValue="ZC-88" error="الرقم قصير، تأكد منه" />
          </div>
          <Segmented label="نوع الصفقة" value={mode} onChange={setMode}
            options={[{ value: "scalp", label: "سريعة" }, { value: "swing", label: "طويلة" }, { value: "trend", label: "ترند" }]} />
          <Card className="max-w-sm"><Switch checked={on} onChange={setOn} label="إشعارات الإشارات" /></Card>
          <div className="flex flex-wrap gap-2">
            <Badge>عادي</Badge><Badge tone="accent">سريعة</Badge><Badge tone="success">الهدف الأول</Badge>
            <Badge tone="danger">ضرب الستوب</Badge><Badge tone="warning">بانتظار الدخول</Badge><Badge tone="info">مفعّلة</Badge>
          </div>
        </Section>

        <Section title="رفع الصورة">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border-input bg-surface p-8 text-center hover:border-accent">
            <ImagePlus aria-hidden className="size-8 text-accent" />
            <span className="font-semibold">اسحب صورة الشارت هنا أو اضغط للاختيار</span>
            <span className="text-xs text-muted">PNG أو JPG أو WEBP، أقصى حجم 5 ميگا. خلي أرقام السعر واضحة بالصورة.</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" />
          </label>
        </Section>

        <Section title="بطاقة الصفقة">
          <div className="grid gap-3 md:grid-cols-2">{samples.map((s, i) => <TradeSetupCard key={i} s={s} />)}</div>
        </Section>

        <Section title="الإحصائيات والتقدم">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="نسبة النجاح (7 أيام)" value="58%" delta="4%" positive />
            <StatTile label="مجموع النتائج" value="+6.4R" delta="1.2R" positive />
            <StatTile label="صفقات مغلقة" value="23" />
            <StatTile label="جاري التحميل" />
          </div>
          <Card className="flex flex-col gap-2"><span className="text-sm">أساسيات الذهب — 4 من 10 دروس</span><ProgressBar value={40} label="تقدم الكورس" /></Card>
        </Section>

        <Section title="التنبيهات والحالات الفارغة">
          <Banner>هذا التحليل تعليمي وليس نصيحة مالية. التداول بي مخاطرة، والقرار قرارك.</Banner>
          <Banner tone="warning">سعر الصورة يختلف عن السعر الحالي بأكثر من 0.6%. يمكن الصورة قديمة.</Banner>
          <Banner tone="error">ما گدرنا نحلل الصورة. جرب مرة ثانية.</Banner>
          <Card><EmptyState icon={<BarChart3 className="size-8" />} title="ماكو تحليلات بعد" hint="ارفع أول صورة شارت وشوف التحليل بثواني." action={<Button size="sm">ابدأ التحليل</Button>} /></Card>
        </Section>
      </main>

      <nav aria-label="التنقل الرئيسي" className="fixed inset-x-0 bottom-0 mx-auto flex h-16 max-w-[480px] items-center justify-around border-t border-border bg-surface">
        {[{ i: Home, t: "الرئيسية" }, { i: Sparkles, t: "المحلل", a: true }, { i: Radio, t: "الإشارات" }, { i: BookOpen, t: "التعلم" }, { i: User, t: "حسابي" }].map(({ i: I, t, a }) => (
          <a key={t} href="#" aria-current={a ? "page" : undefined} className={`flex flex-col items-center gap-0.5 text-xs ${a ? "text-accent font-semibold" : "text-muted"}`}>
            <I aria-hidden className="size-5" />{t}
          </a>
        ))}
      </nav>
    </div>
  );
}

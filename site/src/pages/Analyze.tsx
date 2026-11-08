import { useEffect, useRef, useState } from "react";
import { ImagePlus, KeyRound, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Banner, Card, Segmented } from "@/components/ui/primitives";
import { TradeSetupCard } from "@/components/TradeSetupCard";
import { cn } from "@/components/ui/cn";
import { STRATEGIES, strategyName } from "@/lib/ai/strategies";
import { toCard } from "@/lib/view";
import type { StoredSetup, Style } from "@/lib/types";
import { analyze, AnalyzeError } from "../lib/analyze";
import { bumpUsage, saveSetup } from "../lib/store";
import { settings } from "../lib/settings";
import { A } from "../router";

const MAX = 10 * 1024 * 1024;
const OK = ["image/png", "image/jpeg", "image/webp"];
const FAMILIES: Record<string, string> = { price_action: "حركة السعر", patterns: "النماذج الفنية", smc: "السيولة والمؤسسات (SMC)", indicators: "المؤشرات", sessions: "الجلسات والصناديق", structure: "هيكل السوق" };
const STEPS = ["نجهز الصورة…", "نقرأ الشارت ومحور السعر…", "نفحص 25 استراتيجية…", "نحدد الدخول والستوب والأهداف…", "نفحص المستويات…"];

export default function Analyze() {
  const hasKey = !!settings.getKey();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<Style>("scalp");
  const [strategy, setStrategy] = useState("auto");
  const [note, setNote] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<{ msg: string; key?: boolean } | null>(null);
  const [result, setResult] = useState<StoredSetup | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1800);
    return () => clearInterval(t);
  }, [busy]);
  useEffect(() => { if (result) resultRef.current?.focus(); }, [result]);

  function pick(f?: File | null) {
    setError(null); setResult(null);
    if (!f) return;
    if (!OK.includes(f.type)) return setError({ msg: "الصيغة لازم تكون PNG أو JPG أو WEBP." });
    if (f.size > MAX) return setError({ msg: "الصورة أكبر من 10 ميگا." });
    if (preview) URL.revokeObjectURL(preview);
    setFile(f); setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!file) return;
    setBusy(true); setStep(0); setError(null);
    try {
      const { setup, blob } = await analyze(file, style, note.trim() || undefined, strategy === "auto" ? undefined : strategy);
      await saveSetup(setup, blob); bumpUsage(); setResult(setup);
    } catch (e) {
      const ae = e instanceof AnalyzeError ? e : null;
      setError({ msg: ae?.message ?? "صار خطأ غير متوقع. جرب مرة ثانية.", key: ae?.kind === "nokey" || ae?.kind === "auth" });
    } finally { setBusy(false); }
  }
  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); setNote(""); };

  return (
    <>
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">محلل الشارت</h1>
        <p className="text-sm text-muted">ارفع صورة شارت الذهب واختار نوع الصفقة.</p>
      </section>

      {!hasKey && (
        <Card variant="highlight" className="flex items-center gap-3">
          <KeyRound aria-hidden className="size-6 shrink-0 text-accent" />
          <p className="flex-1 text-sm">حتى يشتغل التحليل، أضف مفتاح Gemini مرة وحدة. ينحفظ على جهازك بس.</p>
          <A to="/account" className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-semibold text-on-accent">أضف المفتاح</A>
        </Card>
      )}

      {!result && (
        <div className="flex flex-col gap-5">
          {!file ? (
            <div role="button" tabIndex={0} aria-label="اختيار صورة الشارت"
              onClick={() => input.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
              className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed bg-surface p-8 text-center transition-colors", drag ? "border-accent bg-accent-soft" : "border-border-input hover:border-accent")}>
              <ImagePlus aria-hidden className="size-9 text-accent" />
              <span className="font-semibold">اضغط لاختيار صورة الشارت أو اسحبها هنا</span>
              <span className="text-xs text-muted">PNG أو JPG أو WEBP. خلي أرقام السعر والفريم واضحة.</span>
            </div>
          ) : (
            <Card className="flex flex-col gap-3">
              <img src={preview!} alt="معاينة صورة الشارت المرفوعة" className="max-h-80 w-full rounded-md bg-surface-2 object-contain" />
              <div className="flex items-center justify-between gap-2 text-xs text-muted">
                <span className="truncate" dir="ltr">{file.name}</span>
                <Button size="sm" variant="ghost" onClick={reset} disabled={busy} icon={<X aria-hidden className="size-4" />}>غيّر الصورة</Button>
              </div>
            </Card>
          )}
          <input ref={input} type="file" accept={OK.join(",")} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pick(e.target.files?.[0])} />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">نوع الصفقة</span>
            <Segmented label="نوع الصفقة" value={style}
              onChange={(v) => { setStyle(v); if (strategy !== "auto" && !STRATEGIES.find((x) => x.id === strategy)?.styles.includes(v)) setStrategy("auto"); }}
              options={[{ value: "scalp", label: "سريعة" }, { value: "swing", label: "طويلة" }]} />
            <p className="text-xs text-muted">{style === "scalp" ? "سريعة: من دقائق لساعات، ستوب قريب." : "طويلة: من يوم لأيام، ستوب أبعد وأهداف أكبر."}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="strategy" className="text-sm font-medium">الاستراتيجية</label>
            <select id="strategy" value={strategy} onChange={(e) => setStrategy(e.target.value)} className="h-11 rounded-md border border-border-input bg-surface px-3 text-md text-text">
              <option value="auto">تلقائي: يفحص كل الاستراتيجيات ويختار الأقوى</option>
              {Object.entries(FAMILIES).map(([fid, fname]) => {
                const list = STRATEGIES.filter((x) => x.family === fid && x.styles.includes(style));
                return list.length ? <optgroup key={fid} label={fname}>{list.map((x) => <option key={x.id} value={x.id}>{x.name_ar}</option>)}</optgroup> : null;
              })}
            </select>
            <p className="text-xs text-muted">{strategy === "auto" ? "ينصح بيه: التحليل يعتمد على أكثر من سبب متوافق." : `يحلل على ${strategyName(strategy)} بس.`}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="note" className="text-sm font-medium">ملاحظة (اختياري)</label>
            <textarea id="note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="مثلاً: الفريم 15 دقيقة، أفكر بشراء"
              className="rounded-md border border-border-input bg-surface p-3 text-md text-text placeholder:text-muted" />
          </div>

          {error && (
            <div className="flex flex-col gap-2">
              <Banner tone="error">{error.msg}</Banner>
              {error.key && <A to="/account" className="text-sm text-accent underline">روح لصفحة حسابي وأضف المفتاح</A>}
            </div>
          )}
          {busy && <p role="status" className="text-sm text-muted">{STEPS[step]}</p>}
          <Button size="lg" full disabled={!file} loading={busy} onClick={submit}>{busy ? "جاري التحليل" : "حلّل الشارت"}</Button>
        </div>
      )}

      {result && (
        <div ref={resultRef} tabIndex={-1} className="flex flex-col gap-3 outline-none" aria-live="polite">
          <h2 className="text-lg font-bold">نتيجة التحليل</h2>
          {result.warnings.map((w) => <Banner key={w} tone="warning">{w}</Banner>)}
          <TradeSetupCard s={toCard(result)} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={reset} icon={<RotateCcw aria-hidden className="size-4" />}>حلّل صورة ثانية</Button>
            <A to={`/a/${result.id}`} className="inline-flex h-11 items-center justify-center rounded-md bg-accent text-sm font-semibold text-on-accent hover:bg-accent-hover">تفاصيل التحليل</A>
          </div>
        </div>
      )}
      <Banner>التحليل تعليمي وليس نصيحة مالية. التداول بي مخاطرة، والقرار قرارك.</Banner>
    </>
  );
}

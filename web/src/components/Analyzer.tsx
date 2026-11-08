"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, RotateCcw, X } from "lucide-react";
import { Button } from "./ui/Button";
import { Banner, Card, Segmented } from "./ui/primitives";
import { TradeSetupCard } from "./TradeSetupCard";
import { cn } from "./ui/cn";
import type { StoredSetup, Style } from "@/lib/types";
import { toCard } from "@/lib/view";

const MAX = 5 * 1024 * 1024;
const OK = ["image/png", "image/jpeg", "image/webp"];
const STEPS = ["نرفع الصورة…", "نقرأ الشارت ومحور السعر…", "نحدد الدخول والستوب والأهداف…", "نفحص المستويات…"];

export function Analyzer({ remaining: initialRemaining, limit }: { remaining: number; limit: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<Style>("scalp");
  const [note, setNote] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StoredSetup | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const input = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1800);
    return () => clearInterval(t);
  }, [busy]);
  useEffect(() => { if (result) resultRef.current?.focus(); }, [result]);

  function pick(f: File | undefined | null) {
    setError(null); setResult(null);
    if (!f) return;
    if (!OK.includes(f.type)) return setError("الصيغة لازم تكون PNG أو JPG أو WEBP.");
    if (f.size > MAX) return setError("الصورة أكبر من 5 ميگا. صغّرها أو قص الشارت بس.");
    if (preview) URL.revokeObjectURL(preview);
    setFile(f); setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!file) return;
    setBusy(true); setStep(0); setError(null); setResult(null);
    const fd = new FormData();
    fd.set("image", file); fd.set("style", style); if (note.trim()) fd.set("note", note.trim());
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j?.error?.message ?? "صار خطأ. جرب مرة ثانية."); if (j?.error?.code === "limit") setRemaining(0); return; }
      setResult(j.setup); setRemaining(j.remaining);
    } catch {
      setError("انقطع الاتصال. تأكد من الإنترنت وجرب مرة ثانية.");
    } finally { setBusy(false); }
  }

  function reset() { setFile(null); setPreview(null); setResult(null); setError(null); setNote(""); }

  const out = remaining <= 0;

  return (
    <div className="flex flex-col gap-5">
      {!result && (
        <>
          {!file ? (
            <div
              role="button" tabIndex={0}
              aria-label="اختيار صورة الشارت"
              onClick={() => input.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
              className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed bg-surface p-8 text-center transition-colors",
                drag ? "border-accent bg-accent-soft" : "border-border-input hover:border-accent")}
            >
              <ImagePlus aria-hidden className="size-9 text-accent" />
              <span className="font-semibold">اسحب صورة الشارت هنا أو اضغط للاختيار</span>
              <span className="text-xs text-muted">PNG أو JPG أو WEBP، أقصى حجم 5 ميگا. خلي أرقام السعر والفريم واضحة.</span>
            </div>
          ) : (
            <Card className="flex flex-col gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview!} alt="معاينة صورة الشارت المرفوعة" className="max-h-80 w-full rounded-md object-contain bg-surface-2" />
              <div className="flex items-center justify-between gap-2 text-xs text-muted">
                <span className="truncate" dir="ltr">{file.name}</span>
                <Button size="sm" variant="ghost" onClick={reset} disabled={busy} icon={<X aria-hidden className="size-4" />}>غيّر الصورة</Button>
              </div>
            </Card>
          )}
          <input ref={input} type="file" accept={OK.join(",")} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pick(e.target.files?.[0])} />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold" id="style-label">نوع الصفقة</span>
            <Segmented label="نوع الصفقة" value={style} onChange={setStyle}
              options={[{ value: "scalp", label: "سريعة" }, { value: "swing", label: "طويلة" }]} />
            <p className="text-xs text-muted">{style === "scalp" ? "سريعة: من دقائق لساعات، ستوب قريب." : "طويلة: من يوم لأيام، ستوب أبعد وأهداف أكبر."}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="note" className="text-sm font-medium">ملاحظة (اختياري)</label>
            <textarea id="note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="مثلاً: الفريم 15 دقيقة، أفكر بشراء"
              className="rounded-md border border-border-input bg-surface p-3 text-md text-text placeholder:text-muted" />
          </div>

          {error && <Banner tone="error">{error}</Banner>}
          {busy && <p role="status" className="text-sm text-muted">{STEPS[step]}</p>}

          <Button size="lg" full disabled={!file || out} loading={busy} onClick={submit}>
            {busy ? "جاري التحليل" : "حلّل الشارت"}
          </Button>
          <p className="text-center text-xs text-muted">{out ? `خلصت تحليلاتك اليوم (${limit}).` : `باقي إلك اليوم ${remaining} من ${limit} تحليلات.`}</p>
        </>
      )}

      {result && (
        <div ref={resultRef} tabIndex={-1} className="flex flex-col gap-3 outline-none" aria-live="polite">
          <h2 className="text-lg font-bold">نتيجة التحليل</h2>
          {result.mock && <Banner tone="warning">وضع تجريبي: هذا تحليل وهمي لعرض الشكل فقط، مو مبني على الصورة.</Banner>}
          {result.warnings.filter((w) => !result.mock || !w.includes("تجريبي")).map((w) => <Banner key={w} tone="warning">{w}</Banner>)}
          <TradeSetupCard s={toCard(result)} />
          {result.direction !== "none" && <Banner>نتابع هالصفقة على سعر الذهب الحقيقي ونحسب نتيجتها تلقائياً.</Banner>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={reset} icon={<RotateCcw aria-hidden className="size-4" />}>حلّل صورة ثانية</Button>
            <Link href={`/analyses/${result.id}`} className="inline-flex h-11 items-center justify-center rounded-md bg-accent text-sm font-semibold text-on-accent hover:bg-accent-hover">تفاصيل التحليل</Link>
          </div>
        </div>
      )}
    </div>
  );
}

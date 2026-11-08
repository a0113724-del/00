"use client";
import { useId, useRef } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "./cn";

/* ---------- Card ---------- */
export function Card({ variant = "default", className, ...rest }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "raised" | "interactive" | "highlight" }) {
  const v = {
    default: "bg-surface border border-border",
    raised: "bg-surface shadow-md",
    interactive: "bg-surface border border-border hover:border-border-input cursor-pointer",
    highlight: "bg-accent-soft border border-accent/40",
  }[variant];
  return <div className={cn("rounded-lg p-4", v, className)} {...rest} />;
}

/* ---------- Input ---------- */
export function Input({ label, error, hint, className, id, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const auto = useId(); const iid = id ?? auto; const did = `${iid}-d`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={iid} className="text-sm font-medium">{label}</label>
      <input
        id={iid}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? did : undefined}
        className={cn(
          "h-11 rounded-md bg-surface px-3 text-md text-text placeholder:text-muted border",
          error ? "border-danger" : "border-border-input",
          "disabled:opacity-50", className,
        )}
        {...rest}
      />
      {(error || hint) && <p id={did} className={cn("text-xs", error ? "text-danger" : "text-muted")}>{error ?? hint}</p>}
    </div>
  );
}

/* ---------- Badge ---------- */
type Tone = "neutral" | "accent" | "success" | "danger" | "warning" | "info";
export function Badge({ tone = "neutral", className, ...rest }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const t: Record<Tone, string> = {
    neutral: "bg-surface-2 text-muted",
    accent: "bg-accent-soft text-on-accent-soft",
    success: "bg-success-soft text-on-success-soft",
    danger: "bg-danger-soft text-on-danger-soft",
    warning: "bg-surface-2 text-warning",
    info: "bg-surface-2 text-info",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-semibold", t[tone], className)} {...rest} />;
}

/* ---------- SegmentedControl (radiogroup, RTL-aware arrows) ---------- */
export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const rtl = document.documentElement.dir === "rtl";
    const next = e.key === (rtl ? "ArrowLeft" : "ArrowRight") ? 1 : e.key === (rtl ? "ArrowRight" : "ArrowLeft") ? -1 : 0;
    if (!next) return;
    e.preventDefault();
    const j = (i + next + options.length) % options.length;
    onChange(options[j].value); refs.current[j]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit self-start rounded-md bg-surface-2 p-1 gap-1">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn("h-9 min-w-20 rounded-sm px-3 text-sm font-semibold transition-colors", on ? "bg-accent text-on-accent" : "text-muted hover:text-text")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Banner ---------- */
export function Banner({ tone = "info", children }: { tone?: "info" | "warning" | "error" | "success"; children: React.ReactNode }) {
  const Icon = { info: Info, warning: AlertTriangle, error: XCircle, success: CheckCircle2 }[tone];
  const c = { info: "text-info", warning: "text-warning", error: "text-danger", success: "text-success" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className="flex items-start gap-2 rounded-md bg-surface-2 p-3 text-sm">
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", c)} />
      <div className="text-muted">{children}</div>
    </div>
  );
}

/* ---------- StatTile ---------- */
export function StatTile({ label, value, delta, positive }: { label: string; value?: string; delta?: string; positive?: boolean }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      {value === undefined ? <span className="h-9 w-24 animate-pulse rounded-sm bg-surface-2" aria-label="جاري التحميل" />
        : <span className="num text-xl font-semibold text-text">{value}</span>}
      {delta && <span className={cn("num text-xs font-semibold", positive ? "text-success" : "text-danger")}>{positive ? "▲" : "▼"} {delta}</span>}
    </Card>
  );
}

/* ---------- ProgressBar ---------- */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className="h-2 w-full rounded-pill bg-surface-2">
      <div className="h-2 rounded-pill bg-accent transition-[width]" style={{ width: `${value}%` }} />
    </div>
  );
}

/* ---------- EmptyState ---------- */
export function EmptyState({ icon, title, hint, action }: { icon: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="text-muted" aria-hidden>{icon}</div>
      <p className="text-md font-semibold">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex h-11 w-full items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className={cn("relative h-6 w-11 rounded-pill transition-colors", checked ? "bg-accent" : "bg-surface-2 border border-border-input")}>
        <span className={cn("absolute top-0.5 size-5 rounded-pill bg-text transition-[inset-inline-start]", checked ? "start-[22px] bg-on-accent" : "start-0.5")} />
      </span>
    </button>
  );
}

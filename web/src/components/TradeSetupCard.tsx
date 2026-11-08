import { ArrowDownRight, ArrowUpRight, Ban, Clock } from "lucide-react";
import { Badge } from "./ui/primitives";
import { cn } from "./ui/cn";

export type SetupStatus = "pending" | "active" | "tp1" | "tp2" | "tp3" | "sl" | "be" | "expired" | "cancelled" | "no_trade";
export interface Setup {
  direction: "buy" | "sell" | "none";
  style: "scalp" | "swing";
  source: "ai" | "orb-a" | "orb-b";
  confidence?: "low" | "medium" | "high";
  entryLow?: number; entryHigh?: number; sl?: number; tp1?: number; tp2?: number;
  invalidation?: string; rationale?: string;
  status: SetupStatus;
  createdAt: string; // ISO
  pnlR?: number;
  strategies?: { name: string; primary?: boolean }[];
  confluence?: number;
}

const statusLabel: Record<SetupStatus, { t: string; tone: "neutral" | "accent" | "success" | "danger" | "warning" | "info" }> = {
  pending: { t: "بانتظار الدخول", tone: "warning" },
  active: { t: "مفعّلة", tone: "info" },
  tp1: { t: "الهدف الأول", tone: "success" },
  tp2: { t: "الهدف الثاني", tone: "success" },
  tp3: { t: "الهدف الثالث", tone: "success" },
  sl: { t: "ضرب الستوب", tone: "danger" },
  be: { t: "خرجت على الدخول", tone: "neutral" },
  expired: { t: "انتهت بدون دخول", tone: "neutral" },
  cancelled: { t: "ملغاة", tone: "neutral" },
  no_trade: { t: "ماكو صفقة", tone: "neutral" },
};
const sourceLabel = { ai: "محلل سبيكة", "orb-a": "إشارة ORB · أوروبا", "orb-b": "إشارة ORB · 02:30" };
const fmt = (n?: number) => (n === undefined ? "—" : n.toFixed(2));

export function TradeSetupCard({ s }: { s: Setup }) {
  const buy = s.direction === "buy", none = s.direction === "none";
  const dead = s.status === "expired" || s.status === "cancelled";
  const rr = !none && s.entryLow && s.sl && s.tp1
    ? Math.abs(s.tp1 - (buy ? s.entryHigh! : s.entryLow)) / Math.abs((buy ? s.entryHigh! : s.entryLow) - s.sl) : undefined;
  const st = statusLabel[s.status];
  const time = new Intl.DateTimeFormat("ar-IQ", { timeZone: "Asia/Baghdad", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", numberingSystem: "latn" }).format(new Date(s.createdAt));

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <header className="flex flex-wrap items-center gap-2">
        {none ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-1 text-sm font-bold text-muted"><Ban aria-hidden className="size-4" />ماكو صفقة واضحة</span>
        ) : (
          <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-bold", buy ? "bg-success text-on-success" : "bg-danger text-on-danger")}>
            {buy ? <ArrowUpRight aria-hidden className="size-4" /> : <ArrowDownRight aria-hidden className="size-4" />}
            {buy ? "شراء" : "بيع"} <span className="num">XAUUSD</span>
          </span>
        )}
        <Badge tone="accent">{s.style === "scalp" ? "سريعة" : "طويلة"}</Badge>
        {s.confidence && (
          <span className="inline-flex items-center gap-1 text-xs text-muted" aria-label={`الثقة: ${s.confidence}`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("h-3 w-1 rounded-pill", i < { low: 1, medium: 2, high: 3 }[s.confidence!] ? "bg-accent" : "bg-surface-2")} />
            ))}
            ثقة {{ low: "منخفضة", medium: "متوسطة", high: "عالية" }[s.confidence]}
          </span>
        )}
        <span className="ms-auto" aria-live="polite"><Badge tone={st.tone}>{st.t}</Badge></span>
      </header>

      {!none && (
        <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4", dead && "opacity-60 line-through")}>
          <div><dt className="text-xs text-muted">الدخول</dt><dd className="num whitespace-nowrap font-semibold">{s.entryLow === s.entryHigh ? fmt(s.entryLow) : `${fmt(s.entryLow)}–${fmt(s.entryHigh)}`}</dd></div>
          <div><dt className="text-xs text-muted">الستوب</dt><dd className="num font-semibold text-danger">{fmt(s.sl)}</dd></div>
          <div><dt className="text-xs text-muted">الهدف 1</dt><dd className="num font-semibold text-success">{fmt(s.tp1)}</dd></div>
          <div><dt className="text-xs text-muted">الهدف 2</dt><dd className="num font-semibold text-success">{fmt(s.tp2)}</dd></div>
        </dl>
      )}

      {!!s.strategies?.length && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>الاستراتيجيات المتحققة</span>
            {s.confluence !== undefined && <span>التوافق <span className="num font-semibold text-text">{s.confluence}%</span></span>}
          </div>
          {s.confluence !== undefined && (
            <div role="meter" aria-label="درجة توافق الأسباب" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.confluence} className="h-1.5 rounded-pill bg-surface-2">
              <div className={cn("h-1.5 rounded-pill", s.confluence >= 60 ? "bg-success" : s.confluence >= 40 ? "bg-accent" : "bg-warning")} style={{ width: `${s.confluence}%` }} />
            </div>
          )}
          <ul className="flex flex-wrap gap-1.5">
            {s.strategies.map((x) => (
              <li key={x.name}><Badge tone={x.primary ? "accent" : "neutral"}>{x.primary ? "★ " : ""}{x.name}</Badge></li>
            ))}
          </ul>
        </div>
      )}

      {s.invalidation && <p className="text-sm"><span className="text-muted">تلغى الفكرة: </span>{s.invalidation}</p>}
      {s.rationale && <p className="text-sm leading-sm text-muted">{s.rationale}</p>}

      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><Clock aria-hidden className="size-3.5" />{time}</span>
        <span>{sourceLabel[s.source]}</span>
        {rr && <span>العائد/المخاطرة <span className="num">1:{rr.toFixed(1)}</span></span>}
        {s.pnlR !== undefined && <span className={cn("num font-semibold", s.pnlR >= 0 ? "text-success" : "text-danger")}>{s.pnlR >= 0 ? "+" : ""}{s.pnlR.toFixed(2)}R</span>}
        <span className="w-full">تحليل تعليمي وليس نصيحة مالية.</span>
      </footer>
    </article>
  );
}

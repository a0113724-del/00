import crypto from "crypto";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/session";
import { db } from "@/lib/data";
import { analyzeChart } from "@/lib/ai/analyze";
import { ProviderError } from "@/lib/ai/providers";
import { LIMITS, type StoredSetup, type Style } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX = 5 * 1024 * 1024;
const err = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status });

/** Checks magic bytes so a renamed file can't pass as an image. */
function sniff(b: Buffer): string | null {
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return err(401, "unauthenticated", "سجّل دخول أول.");

  let form: FormData;
  try { form = await req.formData(); } catch { return err(400, "bad_form", "الطلب غير صالح."); }
  const file = form.get("image");
  const style = form.get("style") as Style;
  const note = (form.get("note") as string | null)?.slice(0, 300) || undefined;
  if (!(file instanceof File)) return err(400, "no_image", "اختار صورة الشارت.");
  if (style !== "scalp" && style !== "swing") return err(400, "bad_style", "اختار نوع الصفقة.");
  if (file.size > MAX) return err(413, "too_large", "الصورة أكبر من 5 ميگا.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime || !TYPES[mime]) return err(415, "bad_type", "الصيغة لازم تكون PNG أو JPG أو WEBP.");

  const limit = LIMITS[user.tier];
  if (!(await db.tryConsumeAnalysis(user.id, limit))) {
    return err(429, "limit", `خلصت تحليلاتك اليوم (${limit}). ترجع تتجدد باچر، أو رقّي اشتراكك.`);
  }

  try {
    const imagePath = await db.saveChart(user.id, bytes, TYPES[mime]);
    const out = await analyzeChart(bytes, mime, style, note);
    const s = out.setup;
    const now = new Date();
    const setup: StoredSetup = {
      id: crypto.randomUUID(), userId: user.id, source: "ai", style,
      direction: s.direction,
      entryLow: s.entry_low ?? undefined, entryHigh: s.entry_high ?? undefined, sl: s.sl ?? undefined, tp1: s.tp1 ?? undefined, tp2: s.tp2 ?? undefined,
      invalidation: s.invalidation || undefined, confidence: s.confidence, rationale: s.rationale_ar,
      timeframeSeen: s.timeframe_seen, priceSeen: s.price_seen ?? undefined,
      status: s.direction === "none" ? "no_trade" : "pending",
      validUntil: new Date(now.getTime() + (style === "scalp" ? 4 : 120) * 3600_000).toISOString(),
      createdAt: now.toISOString(), imagePath,
      provider: out.provider, model: out.model, promptVersion: out.promptVersion, mock: out.mock,
      warnings: [...out.warnings, ...(out.fallbackReason ? ["ما گدرنا نوصل لخدمة الذكاء الاصطناعي، فهذا تحليل تجريبي وهمي."] : [])],
      note,
    };
    await db.insertSetup(setup);
    return NextResponse.json({ setup, remaining: Math.max(0, limit - (await db.usageToday(user.id))) });
  } catch (e) {
    await db.refundAnalysis(user.id);
    if (e instanceof ProviderError) {
      const msg = { network: "ما گدرنا نوصل لخدمة التحليل. جرب بعد شوية.", quota: "خدمة التحليل مشغولة هسه. جرب بعد دقيقة.", auth: "إعدادات خدمة التحليل ناقصة. بلّغ الدعم.", bad_output: "التحليل رجع بشكل غلط. جرب مرة ثانية.", other: "صار خطأ بالتحليل. جرب مرة ثانية." }[e.kind];
      console.error("[analyze]", e.kind, e.message);
      return err(502, `ai_${e.kind}`, msg);
    }
    console.error("[analyze]", e);
    return err(500, "server", "صار خطأ غير متوقع. جرب مرة ثانية.");
  }
}

import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Banner, Card, Input } from "@/components/ui/primitives";
import { MODELS, settings } from "../lib/settings";
import { testKey } from "../lib/analyze";

export default function Account() {
  const [name, setName] = useState(settings.getName());
  const [key, setKey] = useState(settings.getKey());
  const [model, setModel] = useState(settings.getModel());
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setMsg(null);
    settings.setName(name);
    if (!key.trim()) { settings.setKey(""); setMsg({ tone: "success", t: "انحفظ. ما أكو مفتاح، فالتحليل ما راح يشتغل." }); return; }
    if (!/^AIza[0-9A-Za-z_-]{20,}$/.test(key.trim())) { setMsg({ tone: "error", t: "شكل المفتاح غلط. مفتاح Gemini يبدي بـ AIza." }); return; }
    setBusy(true);
    const problem = await testKey(key.trim(), model);
    setBusy(false);
    settings.setKey(key); settings.setModel(model);
    setMsg(problem ? { tone: "error", t: `انحفظ، بس: ${problem}` } : { tone: "success", t: "المفتاح شغال وانحفظ على جهازك." });
  }

  return (
    <>
      <h1 className="text-xl font-bold">حسابي</h1>
      <Card className="flex flex-col gap-4">
        <Input label="اسمك" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="مثلاً: علي" />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input label="مفتاح Gemini API" value={key} onChange={(e) => setKey(e.target.value)} type={show ? "text" : "password"} dir="ltr" autoComplete="off" spellCheck={false} placeholder="AIza…"
                hint="ينحفظ على هذا الجهاز بس، وما يترفع لأي مكان غير Google وقت التحليل." />
            </div>
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "إخفاء المفتاح" : "إظهار المفتاح"} className="mb-6 grid size-11 place-items-center rounded-md bg-surface-2">
              {show ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="model" className="text-sm font-medium">الموديل</label>
          <select id="model" value={model} onChange={(e) => setModel(e.target.value)} dir="ltr" className="h-11 rounded-md border border-border-input bg-surface px-3 text-md text-text">
            {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <p className="text-xs text-muted">flash سريع ومجاني بحدود يومية. pro أدق بس حدوده أقل.</p>
        </div>
        {msg && <Banner tone={msg.tone}>{msg.t}</Banner>}
        <Button onClick={save} loading={busy} icon={<CheckCircle2 aria-hidden className="size-4" />}>احفظ وجرّب المفتاح</Button>
      </Card>
      <Card className="flex items-start gap-3">
        <KeyRound aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
        <div className="flex flex-col gap-1 text-sm">
          <p className="font-semibold">شلون تجيب مفتاح مجاني؟</p>
          <p className="text-muted">افتح aistudio.google.com، ثم Get API key، ثم Create API key، وانسخه هنا. هاي النسخة لاستخدامك الشخصي. لا تنشر مفتاحك.</p>
        </div>
      </Card>
    </>
  );
}

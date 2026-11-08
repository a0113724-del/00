import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "تسجيل الدخول · سبيكة AI" };

export default async function LoginPage() {
  if (await getUser()) redirect("/");
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-14 place-items-center rounded-lg bg-accent text-on-accent shadow-glow"><Sparkles aria-hidden className="size-7" /></span>
        <h1 className="text-xl font-bold">سبيكة AI</h1>
        <p className="text-sm text-muted">ارفع شارت الذهب، واختار سريعة لو طويلة، وخذ خطة صفقة واضحة بثواني. وكل تحليل نتابعه على السعر الحقيقي.</p>
      </div>
      <LoginForm />
      <p className="text-center text-xs text-muted">بالدخول توافق إن التحليلات تعليمية وليست نصيحة مالية.</p>
    </main>
  );
}

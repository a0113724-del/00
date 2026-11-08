"use client";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, Input } from "@/components/ui/primitives";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <Card className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4" noValidate>
        <Input label="البريد الإلكتروني" name="email" type="email" autoComplete="email" inputMode="email" dir="ltr" placeholder="name@example.com" required error={state.error} hint="بالنسخة التجريبية تدخل مباشرة. بعدين نرسلك رابط دخول." />
        <Button type="submit" loading={pending} full icon={<Mail aria-hidden className="size-4" />}>دخول</Button>
      </form>
    </Card>
  );
}

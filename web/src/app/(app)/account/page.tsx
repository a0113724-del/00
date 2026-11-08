import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/data";
import { LIMITS } from "@/lib/types";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { logout } from "@/app/login/actions";

export const metadata = { title: "حسابي · سبيكة AI" };
const tierName = { free: "مجاني", pro: "برو", elite: "إيليت" } as const;

export default async function AccountPage() {
  const user = await requireUser();
  const used = await db.usageToday(user.id);
  return (
    <>
      <h1 className="text-xl font-bold">حسابي</h1>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.displayName}</p>
            <p className="truncate text-sm text-muted" dir="ltr">{user.email}</p>
          </div>
          <Badge tone="accent">{tierName[user.tier]}</Badge>
        </div>
        <p className="text-sm text-muted">تحليلات اليوم: <span className="num text-text">{used}/{LIMITS[user.tier]}</span></p>
      </Card>
      <form action={logout}>
        <Button type="submit" variant="secondary" full icon={<LogOut aria-hidden className="size-4" />}>تسجيل خروج</Button>
      </form>
    </>
  );
}

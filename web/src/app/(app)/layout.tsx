import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/session";
import { TabBar } from "@/components/TabBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="min-h-dvh bg-bg pb-24">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[720px] items-center gap-2 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-8 place-items-center rounded-md bg-accent text-on-accent"><Sparkles aria-hidden className="size-4" /></span>
            سبيكة AI
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-6">{children}</main>
      <TabBar />
    </div>
  );
}

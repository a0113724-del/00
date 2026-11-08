"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Radio, Sparkles, User } from "lucide-react";
import { cn } from "./ui/cn";

const items = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/analyze", label: "المحلل", icon: Sparkles },
  { href: "/signals", label: "الإشارات", icon: Radio },
  { href: "/learn", label: "التعلم", icon: BookOpen },
  { href: "/account", label: "حسابي", icon: User },
];

export function TabBar() {
  const path = usePathname();
  const isActive = (h: string) => (h === "/" ? path === "/" : path.startsWith(h) || (h === "/analyze" && path.startsWith("/analyses")));
  return (
    <nav aria-label="التنقل الرئيسي" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex h-16 max-w-[480px] items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const on = isActive(href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} aria-current={on ? "page" : undefined}
                className={cn("flex h-full flex-col items-center justify-center gap-0.5 text-xs", on ? "font-semibold text-accent" : "text-muted hover:text-text")}>
                <Icon aria-hidden className="size-5" />{label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

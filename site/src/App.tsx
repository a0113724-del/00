import { BookOpen, Home as HomeIcon, ListChecks, Sparkles, User } from "lucide-react";
import { cn } from "@/components/ui/cn";
import LearnPage from "@/app/(app)/learn/page";
import { A, useRoute } from "./router";
import Analyze from "./pages/Analyze";
import Account from "./pages/Account";
import { Analyses, Detail, Home } from "./pages/Lists";

const tabs = [
  { to: "/", label: "الرئيسية", icon: HomeIcon },
  { to: "/analyze", label: "المحلل", icon: Sparkles },
  { to: "/analyses", label: "تحليلاتي", icon: ListChecks },
  { to: "/learn", label: "الاستراتيجيات", icon: BookOpen },
  { to: "/account", label: "حسابي", icon: User },
];

export default function App() {
  const route = useRoute();
  const page = route === "/" ? <Home />
    : route === "/analyze" ? <Analyze />
    : route === "/analyses" ? <Analyses />
    : route.startsWith("/a/") ? <Detail id={route.slice(3)} />
    : route === "/learn" ? <LearnPage />
    : route === "/account" ? <Account />
    : <Home />;
  const active = (to: string) => (to === "/" ? route === "/" : route.startsWith(to) || (to === "/analyses" && route.startsWith("/a/")));

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[720px] items-center gap-2 px-4">
          <A to="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-8 place-items-center rounded-md bg-accent text-on-accent"><Sparkles aria-hidden className="size-4" /></span>
            سبيكة AI
          </A>
          <span className="ms-auto rounded-pill bg-surface-2 px-2 py-0.5 text-xs text-muted">نسخة تجريبية</span>
        </div>
      </header>
      <main className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-6">{page}</main>
      <nav aria-label="التنقل الرئيسي" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex h-16 max-w-[480px] items-stretch justify-around">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <A to={to} aria-current={active(to) ? "page" : undefined}
                className={cn("flex h-full flex-col items-center justify-center gap-0.5 text-xs", active(to) ? "font-semibold text-accent" : "text-muted hover:text-text")}>
                <Icon aria-hidden className="size-5" />{label}
              </A>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

import { Card, EmptyState } from "./ui/primitives";

export function ComingSoon({ title, hint, icon }: { title: string; hint: string; icon: React.ReactNode }) {
  return (
    <>
      <h1 className="text-xl font-bold">{title}</h1>
      <Card><EmptyState icon={icon} title="قريباً" hint={hint} /></Card>
    </>
  );
}

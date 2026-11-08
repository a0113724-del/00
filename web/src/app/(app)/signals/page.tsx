import { Radio } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "الإشارات · سبيكة AI" };
export default function SignalsPage() {
  return <ComingSoon title="الإشارات" icon={<Radio className="size-8" />} hint="إشارات مباشرة من استراتيجية ORB المختبرة، ويا سجل نتائج كامل. توصل بالمرحلة الثالثة." />;
}

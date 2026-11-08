import { BookOpen } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "التعلم · سبيكة AI" };
export default function LearnPage() {
  return <ComingSoon title="التعلم" icon={<BookOpen className="size-8" />} hint="دروس بالترتيب، وبعد كل درس اختبار يفتح الدرس الجاي. توصل بالمرحلة الرابعة." />;
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سبيكة AI",
  description: "محلل ذهب بالذكاء الاصطناعي — تحليل تعليمي وليس نصيحة مالية",
};

export const viewport: Viewport = { themeColor: "#0B0D10", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}

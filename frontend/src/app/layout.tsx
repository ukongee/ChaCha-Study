import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "차차스터디 | 충남대 AI 학습 도우미",
  description: "PPT/PDF 강의자료를 올리면 AI가 요약, 퀴즈, 플래시카드, 마인드맵을 만들어드립니다.",
};

export const viewport: Viewport = {
  themeColor: "#1A3FAA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-[#F0F4FF] text-[#0F1729] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

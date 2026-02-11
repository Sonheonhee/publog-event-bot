import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Premium Quant Dashboard | AI 주식 분석",
    description: "AI 기반 자가 진화형 퀀트 분석 엔진과 프리미엄 대시보드",
    keywords: "주식, 퀀트, AI, 분석, 대시보드, 한국투자증권",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className="animated-gradient min-h-screen">
                {children}
            </body>
        </html>
    );
}

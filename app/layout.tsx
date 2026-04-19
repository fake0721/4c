import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "智能日志分析与运维辅助决策系统",
  description: "面向日志异常识别、风险评估与修复建议生成的智能运维分析平台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

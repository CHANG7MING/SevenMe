import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHANG7AN — Researching and building",
  description: "AI 产品、Skills、摄影与文章。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem("chang7an-theme");
                var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                document.documentElement.dataset.theme = saved === "dark" || saved === "light"
                  ? saved
                  : systemDark ? "dark" : "light";
              } catch (error) {
                document.documentElement.dataset.theme = "light";
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

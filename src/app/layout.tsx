import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PWASplashScreen } from "@/components/pwa-splash";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "临时邮箱服务",
  description: "安全、快速的临时邮箱服务，支持智能分类和多邮箱管理",
  manifest: "/manifest.json",
  keywords: ["临时邮箱", "一次性邮箱", "邮件服务", "隐私保护"],
  authors: [{ name: "TempMail Team" }],
  creator: "TempMail",
  publisher: "TempMail",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  themeColor: "#3b82f6",
  colorScheme: "light dark",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "临时邮箱"
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://tempmail.local",
    title: "临时邮箱服务",
    description: "安全、快速的临时邮箱服务，支持智能分类和多邮箱管理",
    siteName: "临时邮箱",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "临时邮箱服务"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "临时邮箱服务",
    description: "安全、快速的临时邮箱服务，支持智能分类和多邮箱管理",
    images: ["/og-image.png"]
  },
  icons: {
    icon: [
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="临时邮箱" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="临时邮箱" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PWASplashScreen />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

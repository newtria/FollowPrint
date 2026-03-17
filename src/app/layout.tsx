import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Followprint — Your Social Fingerprint",
  description:
    "Analyze your Instagram data privately. See pending requests, non-mutual followers, activity insights, and more. 100% client-side.",
  keywords: [
    "instagram",
    "followers",
    "analytics",
    "unfollowers",
    "인스타그램",
    "팔로워",
    "맞팔",
    "분석",
  ],
  openGraph: {
    title: "Followprint — Your Social Fingerprint",
    description:
      "See who ignored your follow request, who's not following back, your activity insights — 100% private.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Followprint",
    description: "Analyze your Instagram data privately. 100% client-side.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('fp-theme');if(!t)t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}

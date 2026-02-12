import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "LED Smart Queue",
  description: "LED Smart Queue System by Nuttakit Champhuchana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning={true}>
      <body
        suppressHydrationWarning={true}
        className={`${kanit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}


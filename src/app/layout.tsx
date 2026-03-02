import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import "./globals.css";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fira-sans",
});

export const metadata: Metadata = {
  title: { default: "DinnerList", template: "%s | DinnerList" },
  description: "Event RSVP Management Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={firaSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

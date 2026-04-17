import type { Metadata } from "next";
import { Noto_Sans_Ethiopic, Plus_Jakarta_Sans } from "next/font/google";
import { AdminUiControls } from "@/components/admin-ui-controls";
import { BackNavButton } from "@/components/back-nav-button";
import { GlobalSiteFooter } from "@/components/global-site-footer";
import { PageTransition } from "@/components/page-transition";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const ethiopicFont = Noto_Sans_Ethiopic({
  variable: "--font-ethiopic",
  subsets: ["ethiopic", "latin"],
});

export const metadata: Metadata = {
  title: "Durame Stadium Zuria Kalehiywet Church Portal",
  description:
    "Dynamic church portal system with super admin and department dashboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${ethiopicFont.variable} h-full antialiased`}
      data-theme="light"
    >
      <body className="min-h-full flex flex-col">
        <PageTransition>{children}</PageTransition>
        <GlobalSiteFooter />
        <AdminUiControls />
        <BackNavButton />
      </body>
    </html>
  );
}

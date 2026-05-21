import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import SiteFooter from "@/components/site-footer";

const NEXT_PUBLIC_APP_NAME = `${process.env.NEXT_PUBLIC_APP_NAME || "Fabinex"}`;
const NEXT_PUBLIC_APP_DESCRIPTION = `${process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Fabinex app"}`; 

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: NEXT_PUBLIC_APP_NAME || "Fabinex",
  description: NEXT_PUBLIC_APP_DESCRIPTION || "Fabinex app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <Providers>
          {children}
          <SiteFooter />
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}

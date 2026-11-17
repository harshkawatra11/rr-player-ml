import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getMeta } from "@/lib/data";
import { COPY } from "@/lib/copy";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: COPY.siteTitle,
  description: COPY.siteDescription,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = getMeta();
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>
          <Shell hash={meta.meta.hash} generated={meta.meta.generated}>
            {children}
          </Shell>
        </TooltipProvider>
      </body>
    </html>
  );
}

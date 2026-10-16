import { Caveat_Brush, Nunito } from "next/font/google";
import "./globals.css";

const display = Caveat_Brush({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "Milktyeay | Roasted jasmine milk tea",
  description: "Pre-order roasted jasmine milk tea by the bottle.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#4a2a1a" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}

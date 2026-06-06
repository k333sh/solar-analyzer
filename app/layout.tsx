import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "SOLAR ANALYZER",
  description: "Solar Intelligence"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        {children}
      </body>
    </html>
  );
}

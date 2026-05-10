import type { Metadata } from "next"
import "./globals.css"
import { Nav } from "@/components/Nav"

export const metadata: Metadata = {
  title: "FinPal — AI Personal Finance",
  description:
    "AI-powered personal finance manager with grounded, tool-using chatbot for affordability, risk, forecasting, and savings advice.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </body>
    </html>
  )
}

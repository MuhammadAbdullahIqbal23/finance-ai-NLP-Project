"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/forecast", label: "Forecast" },
  { href: "/chat", label: "FinPal Chat" },
]

export function Nav() {
  const path = usePathname()
  return (
    <header className="border-b border-default sticky top-0 z-30 backdrop-blur-md bg-[rgba(11,13,18,0.85)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-primary">●</span>
          <span>FinPal</span>
          <span className="text-xs text-muted ml-1">AI Finance</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {items.map((it) => {
            const active = path === it.href || (it.href !== "/" && path.startsWith(it.href))
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  active ? "bg-card text-primary" : "text-muted hover:text-white hover:bg-card",
                )}
              >
                {it.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

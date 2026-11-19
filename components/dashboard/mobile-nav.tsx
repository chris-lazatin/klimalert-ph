"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogOut, Menu, Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { NAV_BY_ROLE, ROLE_LABEL } from "@/lib/roles"
import type { AuthRole } from "@/lib/api"

const BADGE_TONE: Record<"amber" | "emerald" | "zinc", string> = {
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  zinc: "bg-zinc-800 text-zinc-300 border-zinc-700",
}

export function MobileNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const role: AuthRole = user?.role ?? "citizen"
  const sections = NAV_BY_ROLE[role]

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close the drawer whenever the page changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock page scroll and allow Esc to close while the drawer is open
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const settingsActive = pathname.startsWith("/dashboard/settings")

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="h-9 w-9 -ml-2 flex items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-900 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[60]">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <aside className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] flex flex-col border-r border-zinc-800 bg-zinc-950 shadow-2xl">
              <div className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-900 shrink-0">
                <Image
                  src="/logo.png"
                  alt="KlimAlert PH"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold tracking-tight text-zinc-100 leading-none">
                    KlimAlert<span className="text-emerald-400"> PH</span>
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-medium truncate">
                    {ROLE_LABEL[role]} workspace
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                {sections.map((section) => (
                  <div key={section.label} className="space-y-0.5">
                    <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-zinc-600 font-semibold">
                      {section.label}
                    </p>
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const active =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href))
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                            active
                              ? "bg-zinc-900 text-zinc-100"
                              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60",
                          )}
                        >
                          {active && (
                            <span
                              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-emerald-400"
                              aria-hidden
                            />
                          )}
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              active ? "text-emerald-400" : "text-zinc-500",
                            )}
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border",
                                BADGE_TONE[item.badgeTone ?? "zinc"],
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </nav>

              <div className="px-3 pb-4 space-y-0.5 border-t border-zinc-900 pt-3 shrink-0">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    settingsActive
                      ? "bg-zinc-900 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60",
                  )}
                >
                  <Settings
                    className={cn("h-4 w-4", settingsActive ? "text-emerald-400" : "text-zinc-500")}
                  />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-zinc-500" />
                  Sign out
                </button>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </div>
  )
}
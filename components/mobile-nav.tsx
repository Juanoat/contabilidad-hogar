"use client"

import { cn } from "@/lib/utils"
import type { ModuleType } from "./expense-app"
import { LayoutDashboard, Wallet, BarChart3, Plus, Menu } from "lucide-react"

interface MobileNavProps {
  activeModule: ModuleType
  setActiveModule: (module: ModuleType) => void
  onFabClick: () => void
  onMenuClick: () => void
}

const mobileNavItems = [
  { id: "dashboard" as ModuleType, label: "Resumen", icon: LayoutDashboard },
  { id: "income" as ModuleType, label: "Ingresos", icon: Wallet },
  { id: "charts" as ModuleType, label: "Gráficos", icon: BarChart3 },
]

export function MobileNav({ activeModule, setActiveModule, onFabClick, onMenuClick }: MobileNavProps) {
  return (
    <>
      <button
        onClick={onFabClick}
        className="fixed bottom-24 right-4 lg:hidden z-40 w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center fab-shadow transition-all duration-200 active:scale-95"
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 lg:hidden glass-strong z-30 border-t border-border/30">
        <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
          <button
            onClick={onMenuClick}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground/70"
          >
            <div className="p-1.5 rounded-lg">
              <Menu size={20} strokeWidth={1.75} />
            </div>
            <span className="text-[10px] font-medium tracking-wide">Más</span>
          </button>

          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70",
                )}
              >
                <div className={cn("p-1.5 rounded-lg transition-all duration-200", isActive ? "bg-foreground/10" : "")}>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={cn("transition-all duration-200", isActive ? "text-foreground" : "")}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wide transition-all",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  )
}

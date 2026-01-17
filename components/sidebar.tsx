"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import type { ModuleType } from "./expense-app"
import { CONFIG } from "@/lib/constants"
import { useApp } from "@/contexts/AppContext"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Upload,
  TrendingDown,
  Wallet,
  Search,
  Calendar,
  BarChart3,
  Calculator,
  Trash2,
  X,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react"

interface AppStateCompat {
  month: number
  year: number
  exchangeRate: number
}

interface NavItem {
  id: ModuleType
  label: string
  icon: React.ReactNode
  section: "principal" | "gestion" | "herramientas"
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Resumen", icon: <LayoutDashboard size={18} />, section: "principal" },
  { id: "import", label: "Importar", icon: <Upload size={18} />, section: "principal" },
  { id: "debt", label: "Deudas", icon: <TrendingDown size={18} />, section: "principal" },
  { id: "income", label: "Ingresos", icon: <Wallet size={18} />, section: "gestion" },
  { id: "explorer", label: "Explorador", icon: <Search size={18} />, section: "gestion" },
  { id: "calendar", label: "Calendario", icon: <Calendar size={18} />, section: "gestion" },
  { id: "charts", label: "Gráficos", icon: <BarChart3 size={18} />, section: "herramientas" },
  { id: "calculator", label: "Calculadora", icon: <Calculator size={18} />, section: "herramientas" },
]

interface SidebarProps {
  activeModule: ModuleType
  setActiveModule: (module: ModuleType) => void
  appState: AppStateCompat
  setAppState: (state: AppStateCompat) => void
  isOpen: boolean
  onClose: () => void
  variant?: "side" | "top"
}

export function Sidebar({
  activeModule,
  setActiveModule,
  appState,
  setAppState,
  isOpen,
  onClose,
  variant = "side",
}: SidebarProps) {
  const { clearAllData } = useApp()
  const { data: session } = useSession()

  const handleModuleClick = (id: ModuleType) => {
    setActiveModule(id)
    onClose()
  }

  const handleClearAllData = () => {
    if (confirm("¿Estás seguro de que querés borrar TODOS los datos? Esta acción no se puede deshacer.")) {
      clearAllData()
      onClose()
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  if (variant === "top") {
    return (
      <div className="glass-strong rounded-b-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <Wallet className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground tracking-tight">Contabilidad</h1>
              <p className="text-xs text-muted-foreground">Hogar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Grid */}
        <div className="p-4 space-y-4">
          {/* Todas las opciones en grid */}
          <div className="grid grid-cols-4 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleModuleClick(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200",
                  activeModule === item.id
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    activeModule === item.id ? "bg-foreground text-background" : "bg-muted/40",
                  )}
                >
                  {item.icon}
                </div>
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Period and Delete in row */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
            <div className="flex-1 flex items-center gap-2">
              <select
                value={appState.month}
                onChange={(e) => setAppState({ ...appState, month: Number.parseInt(e.target.value) })}
                className="flex-1 bg-muted/30 border border-border/40 rounded-xl px-2 py-2 text-xs text-foreground font-medium focus:outline-none transition-all cursor-pointer"
              >
                {CONFIG.MESES.map((month, idx) => (
                  <option key={idx} value={idx}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={appState.year}
                onChange={(e) => setAppState({ ...appState, year: Number.parseInt(e.target.value) })}
                className="w-20 bg-muted/30 border border-border/40 rounded-xl px-2 py-2 text-xs text-foreground font-medium focus:outline-none transition-all cursor-pointer"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleClearAllData}
              className="p-2 rounded-xl bg-destructive/10 hover:bg-destructive/15 text-destructive transition-all border border-destructive/20"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Pull indicator */}
        <div className="flex justify-center pb-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    )
  }

  // Variante side (desktop) - código original
  const renderSection = (title: string, section: NavItem["section"]) => {
    const items = navItems.filter((item) => item.section === section)
    return (
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-3">
          {title}
        </p>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleModuleClick(item.id)}
            className={cn(
              "group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200",
              activeModule === item.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
                activeModule === item.id ? "bg-background/20" : "bg-muted/40 group-hover:bg-muted/60",
              )}
            >
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {activeModule === item.id && <ChevronDown size={14} className="rotate-[-90deg]" />}
          </button>
        ))}
      </div>
    )
  }

  return (
    <aside className={cn("relative w-72 flex flex-col", "glass-strong rounded-[32px] m-4 h-[calc(100vh-32px)]")}>
      {/* Header */}
      <div className="p-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-foreground flex items-center justify-center">
            <Wallet className="w-5 h-5 text-background" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground tracking-tight text-lg">Contabilidad</h1>
            <p className="text-xs text-muted-foreground">Hogar</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {renderSection("Principal", "principal")}
        {renderSection("Gestión", "gestion")}
        {renderSection("Herramientas", "herramientas")}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/30 space-y-4">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Período</p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={appState.month}
              onChange={(e) => setAppState({ ...appState, month: Number.parseInt(e.target.value) })}
              className="bg-muted/30 border border-border/40 rounded-xl px-3 py-2.5 text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all cursor-pointer"
            >
              {CONFIG.MESES.map((month, idx) => (
                <option key={idx} value={idx}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={appState.year}
              onChange={(e) => setAppState({ ...appState, year: Number.parseInt(e.target.value) })}
              className="bg-muted/30 border border-border/40 rounded-xl px-3 py-2.5 text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all cursor-pointer"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleClearAllData}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-destructive/10 hover:bg-destructive/15 text-destructive text-sm font-medium transition-all duration-200 border border-destructive/20"
        >
          <Trash2 size={16} />
          <span>Borrar Datos</span>
        </button>

        {/* User info and logout */}
        <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
          {session?.user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session.user.name || session.user.email}
                </p>
                {session.user.name && (
                  <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                )}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm font-medium transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

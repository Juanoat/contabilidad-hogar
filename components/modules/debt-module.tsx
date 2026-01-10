"use client"

import { useState, useEffect, useMemo } from "react"
import {
  TrendingDown, CreditCard, Calendar, ChevronDown, Sparkles,
  ShoppingBag, Building2, Wallet, ArrowRight, PartyPopper,
  ChevronRight, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/AppContext"
import { CONFIG } from "@/lib/constants"
import { formatCurrency } from "@/lib/parsers"

interface DebtModuleProps {
  appState: {
    month: number
    year: number
    exchangeRate: number
  }
}

interface DebtItem {
  descripcion: string
  entidad: string
  medio_pago: string
  responsable: string
  cuotas: number
  cuota_actual: number
  monto_ars: number
  monto_usd?: number
  cuotasRestantes: number
  montoMensual: number
  montoRestante: number
}

interface MonthProjection {
  month: number
  label: string
  shortLabel: string
  monthlyTotal: number
  activeItems: number
  lastPaymentItems: DebtItem[]
  releaseAmount: number
  releaseMonth: string
}

interface GroupedDebt {
  name: string
  items: DebtItem[]
  totalMonthly: number
  totalPending: number
  maxCuotas: number
}

interface ModalData {
  type: 'month' | 'entity' | 'method'
  title: string
  subtitle: string
  items: DebtItem[]
  releaseInfo?: {
    amount: number
    month: string
  }
}

export function DebtModule({ appState }: DebtModuleProps) {
  const { getMonthExpenses } = useApp()
  const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'methods'>('overview')
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [modalData, setModalData] = useState<ModalData | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Get all expenses with cuotas > 1
  const debtItems: DebtItem[] = useMemo(() => {
    const expenses = getMonthExpenses(appState.month, appState.year)
    return expenses
      .filter(exp => exp.cuotas > 1)
      .map(exp => {
        const cuotasRestantes = exp.cuotas - exp.cuota_actual
        const montoMensual = exp.monto_ars || (exp.monto_usd ? exp.monto_usd * appState.exchangeRate : 0)
        return {
          descripcion: exp.descripcion,
          entidad: exp.entidad || 'Sin entidad',
          medio_pago: exp.medio_pago || 'Sin medio',
          responsable: exp.responsable || 'Compartido',
          cuotas: exp.cuotas,
          cuota_actual: exp.cuota_actual,
          monto_ars: exp.monto_ars || 0,
          monto_usd: exp.monto_usd,
          cuotasRestantes,
          montoMensual,
          montoRestante: montoMensual * cuotasRestantes
        }
      })
  }, [getMonthExpenses, appState.month, appState.year, appState.exchangeRate])

  // Calculate stats
  const stats = useMemo(() => {
    let totalPending = 0
    let totalMonthly = 0
    let maxCuotas = 0

    debtItems.forEach(item => {
      totalPending += item.montoRestante
      totalMonthly += item.montoMensual
      if (item.cuotasRestantes > maxCuotas) {
        maxCuotas = item.cuotasRestantes
      }
    })

    // Freedom date - mes siguiente a la última cuota
    let freedomDate: Date | null = null
    if (maxCuotas > 0) {
      freedomDate = new Date(appState.year, appState.month + maxCuotas + 1, 1)
    }

    return {
      count: debtItems.length,
      totalPending,
      totalMonthly,
      maxCuotas,
      freedomDate,
      monthsUntilFreedom: maxCuotas + 1
    }
  }, [debtItems, appState.month, appState.year])

  // Calculate payment projection
  const projection: MonthProjection[] = useMemo(() => {
    if (stats.maxCuotas === 0) return []

    const result: MonthProjection[] = []

    for (let month = 1; month <= stats.maxCuotas; month++) {
      let monthlyTotal = 0
      let activeItems = 0
      const lastPaymentItems: DebtItem[] = []

      debtItems.forEach(item => {
        if (item.cuotasRestantes >= month) {
          monthlyTotal += item.montoMensual
          activeItems++
        }
        if (item.cuotasRestantes === month) {
          lastPaymentItems.push(item)
        }
      })

      const projectedDate = new Date(appState.year, appState.month + month, 1)
      const monthName = CONFIG.MESES[projectedDate.getMonth()]
      const year = projectedDate.getFullYear()

      const releaseDate = new Date(appState.year, appState.month + month + 1, 1)
      const releaseMonthName = CONFIG.MESES[releaseDate.getMonth()]
      const releaseYear = releaseDate.getFullYear()

      const releaseAmount = lastPaymentItems.reduce((acc, item) => acc + item.montoMensual, 0)

      result.push({
        month,
        label: `${monthName} ${year}`,
        shortLabel: `${monthName.substring(0, 3)} '${year.toString().slice(-2)}`,
        monthlyTotal,
        activeItems,
        lastPaymentItems,
        releaseAmount,
        releaseMonth: `${releaseMonthName} ${releaseYear}`
      })
    }

    return result
  }, [debtItems, stats.maxCuotas, appState.month, appState.year])

  // Upcoming releases (months where cuotas end)
  const upcomingReleases = useMemo(() => {
    return projection.filter(p => p.lastPaymentItems.length > 0).slice(0, 4)
  }, [projection])

  // Group by entity
  const byEntity: GroupedDebt[] = useMemo(() => {
    const groups: Record<string, GroupedDebt> = {}

    debtItems.forEach(item => {
      if (!groups[item.entidad]) {
        groups[item.entidad] = {
          name: item.entidad,
          items: [],
          totalMonthly: 0,
          totalPending: 0,
          maxCuotas: 0
        }
      }
      groups[item.entidad].items.push(item)
      groups[item.entidad].totalMonthly += item.montoMensual
      groups[item.entidad].totalPending += item.montoRestante
      if (item.cuotasRestantes > groups[item.entidad].maxCuotas) {
        groups[item.entidad].maxCuotas = item.cuotasRestantes
      }
    })

    return Object.values(groups).sort((a, b) => b.totalPending - a.totalPending)
  }, [debtItems])

  // Group by payment method
  const byMethod: GroupedDebt[] = useMemo(() => {
    const groups: Record<string, GroupedDebt> = {}

    debtItems.forEach(item => {
      if (!groups[item.medio_pago]) {
        groups[item.medio_pago] = {
          name: item.medio_pago,
          items: [],
          totalMonthly: 0,
          totalPending: 0,
          maxCuotas: 0
        }
      }
      groups[item.medio_pago].items.push(item)
      groups[item.medio_pago].totalMonthly += item.montoMensual
      groups[item.medio_pago].totalPending += item.montoRestante
      if (item.cuotasRestantes > groups[item.medio_pago].maxCuotas) {
        groups[item.medio_pago].maxCuotas = item.cuotasRestantes
      }
    })

    return Object.values(groups).sort((a, b) => b.totalPending - a.totalPending)
  }, [debtItems])

  const hasData = debtItems.length > 0

  // Open month detail modal
  const openMonthDetail = (monthNum: number) => {
    const monthData = projection.find(p => p.month === monthNum)
    if (!monthData) return

    const activeInMonth = debtItems.filter(item => item.cuotasRestantes >= monthNum)
    const hasRelease = monthData.lastPaymentItems.length > 0

    setModalData({
      type: 'month',
      title: hasRelease ? `Libre en ${monthData.releaseMonth}` : monthData.label,
      subtitle: hasRelease
        ? `Última cuota en ${monthData.label} • ${monthData.lastPaymentItems.length} cuotas terminan`
        : `${monthData.activeItems} cuotas activas • ${formatCurrency(monthData.monthlyTotal, 'ARS')} a pagar`,
      items: activeInMonth,
      releaseInfo: hasRelease ? {
        amount: monthData.releaseAmount,
        month: monthData.releaseMonth
      } : undefined
    })
  }

  // Open entity/method detail modal
  const openGroupDetail = (group: GroupedDebt, type: 'entity' | 'method') => {
    setModalData({
      type,
      title: group.name,
      subtitle: `${group.items.length} cuotas pendientes • ${formatCurrency(group.totalPending, 'ARS')} total`,
      items: group.items
    })
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Análisis de Deuda</h1>
          <Sparkles className="w-5 h-5 text-accent animate-pulse" />
        </div>
        <p className="text-muted-foreground">Visualizá y gestioná tus compromisos financieros</p>
      </header>

      {!hasData ? (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Sin gastos en cuotas</h3>
          <p className="text-sm text-muted-foreground">
            No tenés gastos en cuotas para {CONFIG.MESES[appState.month]} {appState.year}
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              icon={<TrendingDown className="w-5 h-5" />}
              iconBg="bg-destructive/20"
              iconColor="text-destructive"
              label="Deuda Total"
              value={formatCurrency(stats.totalPending, 'ARS')}
              subtitle={`${stats.count} cuotas activas`}
              delay={0}
              isLoaded={isLoaded}
            />
            <KPICard
              icon={<CreditCard className="w-5 h-5" />}
              iconBg="bg-accent/20"
              iconColor="text-accent"
              label="Pago Mensual"
              value={formatCurrency(stats.totalMonthly, 'ARS')}
              subtitle="compromiso fijo"
              delay={100}
              isLoaded={isLoaded}
            />
            <KPICard
              icon={<Calendar className="w-5 h-5" />}
              iconBg="bg-chart-2/20"
              iconColor="text-chart-2"
              label="Libre de Deudas"
              value={stats.freedomDate
                ? `${CONFIG.MESES[stats.freedomDate.getMonth()].substring(0, 3)} ${stats.freedomDate.getFullYear()}`
                : "¡Sin deudas!"
              }
              subtitle={stats.monthsUntilFreedom > 0 ? `en ${stats.monthsUntilFreedom} meses` : ""}
              delay={200}
              isLoaded={isLoaded}
              highlight
            />
            <KPICard
              icon={<Wallet className="w-5 h-5" />}
              iconBg="bg-chart-3/20"
              iconColor="text-chart-3"
              label="Máx. Cuotas"
              value={`${stats.maxCuotas}`}
              subtitle="cuotas restantes"
              delay={300}
              isLoaded={isLoaded}
            />
          </div>

          {/* Upcoming Releases */}
          {upcomingReleases.length > 0 && (
            <div className={cn(
              "transition-all duration-500",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: "400ms" }}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Próximas Liberaciones
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {upcomingReleases.map((release, idx) => (
                  <button
                    key={release.month}
                    onClick={() => openMonthDetail(release.month)}
                    className={cn(
                      "glass rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.02]",
                      idx === 0 && "ring-2 ring-chart-2/50",
                      selectedMonth === release.month && "ring-2 ring-accent"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Libre en {release.releaseMonth}
                      </span>
                      <span className="text-xs bg-chart-2/20 text-chart-2 px-2 py-0.5 rounded-full font-medium">
                        {release.lastPaymentItems.length} {release.lastPaymentItems.length === 1 ? 'cuota' : 'cuotas'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PartyPopper className="w-4 h-4 text-chart-2" />
                      <span className="font-semibold text-foreground">
                        {formatCurrency(release.releaseAmount, 'ARS')}/mes
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Última cuota en {release.label}
                    </p>
                    {release.lastPaymentItems.slice(0, 2).map((item, i) => (
                      <p key={i} className="text-xs text-muted-foreground truncate">
                        • {item.descripcion}
                      </p>
                    ))}
                    {release.lastPaymentItems.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{release.lastPaymentItems.length - 2} más
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projection Chart */}
          {projection.length > 0 && (
            <div className={cn(
              "glass rounded-3xl p-5 transition-all duration-500",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: "500ms" }}>
              <h2 className="text-sm font-semibold text-foreground mb-4">Evolución de Pagos Mensuales</h2>
              <ProjectionChart projection={projection} selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
            </div>
          )}

          {/* Tabs */}
          <div className={cn(
            "transition-all duration-500",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )} style={{ transitionDelay: "600ms" }}>
            <div className="flex gap-2 mb-4">
              <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                Timeline
              </TabButton>
              <TabButton active={activeTab === 'entities'} onClick={() => setActiveTab('entities')}>
                <Building2 className="w-4 h-4" /> Por Entidad
              </TabButton>
              <TabButton active={activeTab === 'methods'} onClick={() => setActiveTab('methods')}>
                <CreditCard className="w-4 h-4" /> Por Tarjeta
              </TabButton>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <TimelineTable projection={projection} selectedMonth={selectedMonth} onRowClick={openMonthDetail} />
            )}
            {activeTab === 'entities' && (
              <GroupedList groups={byEntity} type="entity" exchangeRate={appState.exchangeRate} onItemClick={(g) => openGroupDetail(g, 'entity')} />
            )}
            {activeTab === 'methods' && (
              <GroupedList groups={byMethod} type="method" exchangeRate={appState.exchangeRate} onItemClick={(g) => openGroupDetail(g, 'method')} />
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {modalData && (
        <DetailModal
          data={modalData}
          onClose={() => setModalData(null)}
        />
      )}
    </div>
  )
}

// KPI Card Component
function KPICard({
  icon, iconBg, iconColor, label, value, subtitle, delay, isLoaded, highlight
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  value: string
  subtitle: string
  delay: number
  isLoaded: boolean
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-4 transition-all duration-500",
        highlight && "ring-1 ring-chart-2/30",
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-lg font-bold font-mono", highlight ? "text-chart-2" : "text-foreground")}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

// Tab Button
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
        active
          ? "bg-foreground text-background"
          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
      )}
    >
      {children}
    </button>
  )
}

// Projection Chart
function ProjectionChart({
  projection, selectedMonth, onSelectMonth
}: {
  projection: MonthProjection[]
  selectedMonth: number | null
  onSelectMonth: (month: number | null) => void
}) {
  const maxAmount = Math.max(...projection.map(p => p.monthlyTotal))

  return (
    <div className="relative">
      <div className="flex items-end gap-1 h-32">
        {projection.map((month, idx) => {
          const height = maxAmount > 0 ? (month.monthlyTotal / maxAmount) * 100 : 0
          const hasRelease = month.lastPaymentItems.length > 0
          const isSelected = selectedMonth === month.month

          return (
            <button
              key={month.month}
              onClick={() => onSelectMonth(isSelected ? null : month.month)}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              <div className="w-full flex flex-col items-center justify-end h-24">
                <div
                  className={cn(
                    "w-full max-w-8 rounded-t-lg transition-all duration-300",
                    hasRelease
                      ? "bg-gradient-to-t from-chart-2 to-chart-2/60"
                      : "bg-gradient-to-t from-accent to-accent/60",
                    isSelected && "ring-2 ring-foreground",
                    "group-hover:opacity-80"
                  )}
                  style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                />
              </div>
              <span className={cn(
                "text-[10px] text-muted-foreground whitespace-nowrap",
                isSelected && "text-foreground font-medium"
              )}>
                {month.shortLabel}
              </span>
              {hasRelease && (
                <span className="text-[9px] text-chart-2 font-medium">
                  -{month.lastPaymentItems.length}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-accent" />
          <span className="text-xs text-muted-foreground">Pago mensual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-chart-2" />
          <span className="text-xs text-muted-foreground">Cuotas terminan</span>
        </div>
      </div>
    </div>
  )
}

// Timeline Table
function TimelineTable({ projection, selectedMonth, onRowClick }: { projection: MonthProjection[]; selectedMonth: number | null; onRowClick: (month: number) => void }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Mes</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Cuotas</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Pago</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Terminan</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Se Liberan</th>
            </tr>
          </thead>
          <tbody>
            {projection.map((month, idx) => {
              const hasRelease = month.lastPaymentItems.length > 0
              const isSelected = selectedMonth === month.month

              return (
                <tr
                  key={month.month}
                  onClick={() => onRowClick(month.month)}
                  className={cn(
                    "border-b border-border/20 transition-colors cursor-pointer hover:bg-muted/30",
                    idx === 0 && "bg-accent/5",
                    hasRelease && "bg-chart-2/5",
                    isSelected && "bg-foreground/5"
                  )}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{month.label}</span>
                      {idx === 0 && (
                        <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-medium">
                          Próximo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono text-foreground">{month.activeItems}</td>
                  <td className="p-3 text-right font-mono text-foreground">
                    {formatCurrency(month.monthlyTotal, 'ARS')}
                  </td>
                  <td className={cn("p-3 text-right font-mono", hasRelease ? "text-chart-2 font-medium" : "text-muted-foreground")}>
                    {hasRelease ? month.lastPaymentItems.length : '-'}
                  </td>
                  <td className={cn("p-3 text-right font-mono", hasRelease ? "text-chart-2 font-medium" : "text-muted-foreground")}>
                    {hasRelease ? formatCurrency(month.releaseAmount, 'ARS') : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Grouped List (by entity or payment method)
function GroupedList({ groups, type, exchangeRate, onItemClick }: { groups: GroupedDebt[]; type: 'entity' | 'method'; exchangeRate: number; onItemClick?: (group: GroupedDebt) => void }) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const maxTotal = Math.max(...groups.map(g => g.totalPending))

  const getIcon = (name: string) => {
    if (type === 'entity') {
      const icons: Record<string, string> = {
        'Galicia Mas': '💳', 'Galicia': '🏦', 'Patagonia': '🏔️',
        'Ciudad': '🏙️', 'Macro': '🏛️', 'Hipotecario': '🏠', 'Amex directa': '💎'
      }
      return icons[name] || '🏦'
    }
    return type === 'method' ? '💳' : '📦'
  }

  return (
    <div className="space-y-3">
      {groups.map(group => {
        const isExpanded = expandedGroup === group.name
        const percentage = maxTotal > 0 ? (group.totalPending / maxTotal) * 100 : 0

        return (
          <div key={group.name} className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedGroup(isExpanded ? null : group.name)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getIcon(group.name)}</span>
                <div className="text-left">
                  <p className="font-semibold text-foreground">{group.name}</p>
                  <p className="text-xs text-muted-foreground">{group.items.length} cuotas</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="font-mono font-medium text-foreground">{formatCurrency(group.totalPending, 'ARS')}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(group.totalMonthly, 'ARS')}/mes</p>
                </div>
                {onItemClick && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onItemClick(group) }}
                    className="p-2 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors"
                    title="Ver detalles"
                  >
                    <ChevronRight className="w-4 h-4 text-accent" />
                  </button>
                )}
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </div>
            </button>

            {/* Progress bar */}
            <div className="px-4 pb-3">
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-border/30 p-4 space-y-2">
                {group.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.cuotasRestantes} cuotas restantes • {item.responsable}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-foreground">{formatCurrency(item.montoRestante, 'ARS')}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.montoMensual, 'ARS')}/mes</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Detail Modal
function DetailModal({ data, onClose }: { data: ModalData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg max-h-[85vh] glass rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">{data.title}</h3>
              <p className="text-sm text-muted-foreground">{data.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Release info banner */}
          {data.releaseInfo && (
            <div className="mt-3 p-3 rounded-xl bg-chart-2/10 border border-chart-2/20">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-chart-2" />
                <div>
                  <p className="text-sm font-semibold text-chart-2">
                    ¡Liberás {formatCurrency(data.releaseInfo.amount, 'ARS')}/mes!
                  </p>
                  <p className="text-xs text-chart-2/70">
                    A partir de {data.releaseInfo.month}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
          {data.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay items para mostrar
            </div>
          ) : (
            data.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-muted/20 border border-border/20 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{item.descripcion}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.entidad} • {item.medio_pago}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    item.cuotasRestantes <= 2 ? "bg-chart-2/20 text-chart-2" : "bg-muted/50 text-muted-foreground"
                  )}>
                    {item.cuota_actual}/{item.cuotas}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/20">
                  <div>
                    <p className="text-xs text-muted-foreground">Por mes</p>
                    <p className="font-mono font-medium text-foreground">
                      {formatCurrency(item.montoMensual, 'ARS')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Restante</p>
                    <p className="font-mono font-medium text-foreground">
                      {formatCurrency(item.montoRestante, 'ARS')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Cuotas</p>
                    <p className="font-mono font-medium text-foreground">
                      {item.cuotasRestantes} restantes
                    </p>
                  </div>
                </div>

                {/* Progress bar for cuotas */}
                <div className="pt-2">
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        item.cuotasRestantes <= 2 ? "bg-chart-2" : "bg-accent"
                      )}
                      style={{ width: `${(item.cuota_actual / item.cuotas) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    {Math.round((item.cuota_actual / item.cuotas) * 100)}% completado
                  </p>
                </div>

                {/* Responsable badge */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">
                    {item.responsable}
                  </span>
                  {item.monto_usd && (
                    <span className="text-xs text-muted-foreground">
                      (USD {item.monto_usd.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary footer */}
        <div className="sticky bottom-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total mensual</p>
              <p className="text-lg font-bold font-mono text-foreground">
                {formatCurrency(data.items.reduce((acc, item) => acc + item.montoMensual, 0), 'ARS')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total pendiente</p>
              <p className="text-lg font-bold font-mono text-destructive">
                {formatCurrency(data.items.reduce((acc, item) => acc + item.montoRestante, 0), 'ARS')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

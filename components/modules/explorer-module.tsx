"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, SlidersHorizontal, Download, Sparkles, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/AppContext"
import { CONFIG } from "@/lib/constants"
import { formatCurrency } from "@/lib/parsers"

interface ExplorerModuleProps {
  appState: {
    month: number
    year: number
    exchangeRate: number
  }
}

export function ExplorerModule({ appState }: ExplorerModuleProps) {
  const { state, getMonthExpenses } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMedioPago, setSelectedMedioPago] = useState("Todos")
  const [selectedResponsable, setSelectedResponsable] = useState("Todos")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Get all expenses across all months for exploration
  const allExpenses = useMemo(() => {
    const expenses: Array<{
      id: string
      descripcion: string
      fecha: string
      monto_ars: number
      monto_usd?: number
      medio_pago: string
      entidad: string
      responsable: string
      cuotas: number
      cuota_actual: number
      monthKey: string
    }> = []

    Object.entries(state.data).forEach(([monthKey, monthExpenses]) => {
      monthExpenses.forEach((exp, idx) => {
        expenses.push({
          id: `${monthKey}-${idx}`,
          descripcion: exp.descripcion,
          fecha: exp.fecha,
          monto_ars: exp.monto_ars,
          monto_usd: exp.monto_usd,
          medio_pago: exp.medio_pago,
          entidad: exp.entidad,
          responsable: exp.responsable,
          cuotas: exp.cuotas,
          cuota_actual: exp.cuota_actual,
          monthKey
        })
      })
    })

    // Sort by date descending
    return expenses.sort((a, b) => {
      const dateA = a.fecha.split('/').reverse().join('')
      const dateB = b.fecha.split('/').reverse().join('')
      return dateB.localeCompare(dateA)
    })
  }, [state.data])

  // Get unique values for filters
  const mediosPago = useMemo(() => {
    const medios = new Set(allExpenses.map(e => e.medio_pago).filter(Boolean))
    return ["Todos", ...Array.from(medios)]
  }, [allExpenses])

  const responsables = useMemo(() => {
    const resp = new Set(allExpenses.map(e => e.responsable).filter(Boolean))
    return ["Todos", ...Array.from(resp)]
  }, [allExpenses])

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((expense) => {
      const matchesSearch = expense.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMedio = selectedMedioPago === "Todos" || expense.medio_pago === selectedMedioPago
      const matchesResponsable = selectedResponsable === "Todos" || expense.responsable === selectedResponsable
      return matchesSearch && matchesMedio && matchesResponsable
    })
  }, [allExpenses, searchQuery, selectedMedioPago, selectedResponsable])

  const hasData = allExpenses.length > 0

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Explorador de Datos</h1>
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Buscá y filtrá todos tus gastos</p>
        </div>
        <Button variant="outline" className="gap-2 glass-subtle border-border/50 hover:bg-muted/30 bg-transparent">
          <Download size={16} />
          Exportar
        </Button>
      </header>

      {!hasData ? (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Sin datos</h3>
          <p className="text-sm text-muted-foreground">
            Importá un archivo Excel para ver tus gastos
          </p>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
          <div
            className={cn(
              "glass rounded-2xl p-4 transition-all duration-500",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar gastos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-muted/30 border-0 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedMedioPago}
                  onChange={(e) => setSelectedMedioPago(e.target.value)}
                  className="px-4 py-2 rounded-xl text-sm font-medium glass-subtle text-foreground bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {mediosPago.map((medio) => (
                    <option key={medio} value={medio}>{medio}</option>
                  ))}
                </select>

                <select
                  value={selectedResponsable}
                  onChange={(e) => setSelectedResponsable(e.target.value)}
                  className="px-4 py-2 rounded-xl text-sm font-medium glass-subtle text-foreground bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {responsables.map((resp) => (
                    <option key={resp} value={resp}>{resp}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div
            className={cn(
              "glass rounded-3xl overflow-hidden transition-all duration-500",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{filteredExpenses.length} resultados encontrados</p>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <SlidersHorizontal size={14} />
                Más filtros
              </Button>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="glass-subtle">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Medio
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Responsable
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredExpenses.slice(0, 100).map((expense, idx) => (
                    <tr
                      key={expense.id}
                      className={cn(
                        "hover:bg-muted/20 transition-all duration-300",
                        isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
                      )}
                      style={{ transitionDelay: `${300 + idx * 20}ms` }}
                    >
                      <td className="px-4 py-4 text-sm font-medium text-foreground">
                        {expense.descripcion}
                        {expense.cuotas > 1 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({expense.cuota_actual}/{expense.cuotas})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground font-mono">{expense.fecha}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium glass-subtle text-foreground">
                          {expense.medio_pago}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-right font-mono font-medium text-foreground">
                        {expense.monto_ars
                          ? formatCurrency(expense.monto_ars, 'ARS')
                          : expense.monto_usd
                            ? formatCurrency(expense.monto_usd, 'USD')
                            : '-'
                        }
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{expense.responsable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredExpenses.length > 100 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t border-border/30">
                  Mostrando 100 de {filteredExpenses.length} gastos
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

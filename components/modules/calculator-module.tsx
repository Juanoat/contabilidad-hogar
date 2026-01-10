"use client"

import { useState, useEffect } from "react"
import { Calculator, Percent, DollarSign, RefreshCcw, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type CalculatorType = "cuotas" | "interes" | "conversion"

export function CalculatorModule() {
  const [activeCalc, setActiveCalc] = useState<CalculatorType>("cuotas")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const [totalAmount, setTotalAmount] = useState(100000)
  const [cuotas, setCuotas] = useState(12)
  const [interestRate, setInterestRate] = useState(0)

  const [usdAmount, setUsdAmount] = useState(100)
  const [exchangeRate, setExchangeRate] = useState(1200)

  const cuotaAmount = (totalAmount * (1 + interestRate / 100)) / cuotas
  const arsAmount = usdAmount * exchangeRate

  const calculators = [
    { id: "cuotas" as CalculatorType, label: "Cuotas", icon: Calculator },
    { id: "interes" as CalculatorType, label: "Interés", icon: Percent },
    { id: "conversion" as CalculatorType, label: "Conversión", icon: DollarSign },
  ]

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Calculadora</h1>
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground">Herramientas de cálculo financiero</p>
      </header>

      {/* Calculator Type Selector */}
      <div className="flex gap-2">
        {calculators.map((calc) => {
          const Icon = calc.icon
          return (
            <button
              key={calc.id}
              onClick={() => setActiveCalc(calc.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                activeCalc === calc.id
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "glass text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={16} />
              {calc.label}
            </button>
          )
        })}
      </div>

      {/* Calculator Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeCalc === "cuotas" && (
          <>
            <div
              className={cn(
                "glass rounded-3xl p-6 space-y-6 transition-all duration-500",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              <h3 className="text-lg font-semibold text-foreground">Calculador de Cuotas</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Monto Total</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3.5 bg-muted/30 border-0 rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Cantidad de Cuotas</label>
                  <input
                    type="number"
                    value={cuotas}
                    onChange={(e) => setCuotas(Number(e.target.value))}
                    className="w-full px-4 py-3.5 bg-muted/30 border-0 rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Interés (%)</label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full px-4 py-3.5 bg-muted/30 border-0 rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div
              className={cn(
                "glass rounded-3xl p-6 glow-primary transition-all duration-500",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: "100ms" }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Resultado</h3>

              <div className="space-y-4">
                <div className="glass-subtle rounded-2xl p-5">
                  <p className="text-sm text-muted-foreground mb-2">Valor de cada cuota</p>
                  <p className="text-4xl font-bold font-mono text-primary">
                    $ {Math.round(cuotaAmount).toLocaleString("es-AR")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-subtle rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total a Pagar</p>
                    <p className="text-lg font-bold font-mono text-foreground">
                      $ {Math.round(totalAmount * (1 + interestRate / 100)).toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="glass-subtle rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Interés Total</p>
                    <p className="text-lg font-bold font-mono text-foreground">
                      $ {Math.round(totalAmount * (interestRate / 100)).toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeCalc === "conversion" && (
          <>
            <div
              className={cn(
                "glass rounded-3xl p-6 space-y-6 transition-all duration-500",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              <h3 className="text-lg font-semibold text-foreground">Conversión USD a ARS</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Monto en USD</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">US$</span>
                    <input
                      type="number"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(Number(e.target.value))}
                      className="w-full pl-14 pr-4 py-3.5 bg-muted/30 border-0 rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Tipo de Cambio</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3.5 bg-muted/30 border-0 rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "glass rounded-3xl p-6 glow-accent transition-all duration-500",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: "100ms" }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Resultado</h3>

              <div className="glass-subtle rounded-2xl p-5 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">US$ {usdAmount}</p>
                  <p className="text-xl font-bold font-mono text-foreground">Dólares</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center">
                  <RefreshCcw className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-sm text-muted-foreground mb-1">Equivalente</p>
                  <p className="text-xl font-bold font-mono text-accent">$ {arsAmount.toLocaleString("es-AR")}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeCalc === "interes" && (
          <div className="lg:col-span-2 glass rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Calculador de Interés</h3>
            <div className="h-40 flex items-center justify-center glass-subtle rounded-2xl">
              <p className="text-muted-foreground">Próximamente: Calculador de interés compuesto y simple</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

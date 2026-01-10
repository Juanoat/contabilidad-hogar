"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { X, DollarSign, CreditCard, Repeat, ShoppingBag } from "lucide-react"

interface QuickAddSheetProps {
  isOpen: boolean
  onClose: () => void
}

const expenseTypes = [
  { id: "variable", label: "Variable", icon: ShoppingBag, desc: "Gasto único" },
  { id: "reiterativo", label: "Fijo", icon: Repeat, desc: "Se repite mensual" },
  { id: "cuota", label: "Cuota", icon: CreditCard, desc: "Pago en cuotas" },
]

export function QuickAddSheet({ isOpen, onClose }: QuickAddSheetProps) {
  const [selectedType, setSelectedType] = useState("variable")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS")

  const handleSubmit = () => {
    // Handle form submission
    console.log({ selectedType, amount, description, currency })
    onClose()
    // Reset form
    setAmount("")
    setDescription("")
    setSelectedType("variable")
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 lg:hidden" onClick={onClose} />}

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 lg:hidden",
          "glass-strong rounded-t-[32px]",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-6 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Nuevo Gasto</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Type selector */}
          <div className="flex gap-2 mb-6">
            {expenseTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selectedType === type.id
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all duration-200",
                    isSelected
                      ? "bg-foreground text-background"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon size={20} strokeWidth={isSelected ? 2.5 : 1.75} />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              )
            })}
          </div>

          {/* Amount input */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Monto</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-muted/30 border border-border/50 rounded-2xl pl-11 pr-4 py-3.5 text-lg font-mono font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                />
              </div>
              <div className="flex bg-muted/30 rounded-2xl p-1 border border-border/50">
                <button
                  onClick={() => setCurrency("ARS")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    currency === "ARS"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  ARS
                </button>
                <button
                  onClick={() => setCurrency("USD")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    currency === "USD"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  USD
                </button>
              </div>
            </div>
          </div>

          {/* Description input */}
          <div className="mb-6">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Netflix, Supermercado..."
              className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!amount || !description}
            className={cn(
              "w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200",
              amount && description
                ? "bg-foreground text-background active:scale-[0.98]"
                : "bg-muted/50 text-muted-foreground cursor-not-allowed",
            )}
          >
            Agregar Gasto
          </button>
        </div>

        {/* Safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  )
}

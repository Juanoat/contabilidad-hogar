"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Trash2, Sparkles, Undo2, HelpCircle, Copy, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/AppContext"
import { CONFIG } from "@/lib/constants"
import { formatCurrency, getMonthKey } from "@/lib/parsers"
import { parseExcelFile, checkDuplicates, parsedRowToExpense, type ParsedRow } from "@/lib/excel"

interface ImportModuleProps {
  appState: {
    month: number
    year: number
    exchangeRate: number
  }
}

export function ImportModule({ appState }: ImportModuleProps) {
  const { state, getMonthExpenses, addExpenses, clearMonthData } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preview state
  const [previewData, setPreviewData] = useState<ParsedRow[]>([])
  const [duplicates, setDuplicates] = useState<ParsedRow[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Help modal state
  const [showHelp, setShowHelp] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  // Undo state
  const [lastImport, setLastImport] = useState<{
    count: number
    monthKey: string
    previousData: typeof state.data[string]
  } | null>(null)

  const monthKey = getMonthKey(appState.month, appState.year)
  const currentMonthData = useMemo(() => {
    return getMonthExpenses(appState.month, appState.year)
  }, [getMonthExpenses, appState.month, appState.year])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.name.endsWith(".xlsx") || droppedFile?.name.endsWith(".xls")) {
      setFile(droppedFile)
      setError(null)
    } else {
      setError("Solo se aceptan archivos .xlsx o .xls")
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const rows = await parseExcelFile(file)
      const existingExpenses = getMonthExpenses(appState.month, appState.year)
      const dups = checkDuplicates(rows, existingExpenses)

      setPreviewData(rows)
      setDuplicates(dups)
      setShowPreview(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error procesando el archivo")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = (includeDuplicates: boolean = true) => {
    const validRows = previewData.filter(row => {
      if (!row.validation.isValid) return false
      if (!includeDuplicates && row.isDuplicate) return false
      return true
    })

    if (validRows.length === 0) {
      setError("No hay filas válidas para importar")
      return
    }

    // Save for undo
    setLastImport({
      count: validRows.length,
      monthKey,
      previousData: [...currentMonthData]
    })

    // Convert and add expenses
    const expenses = validRows.map(parsedRowToExpense)
    addExpenses(expenses, monthKey)

    // Reset state
    setFile(null)
    setPreviewData([])
    setDuplicates([])
    setShowPreview(false)
  }

  const handleUndo = () => {
    if (!lastImport) return

    // Clear current month and restore previous data
    clearMonthData(lastImport.monthKey)
    if (lastImport.previousData.length > 0) {
      addExpenses(lastImport.previousData, lastImport.monthKey)
    }

    setLastImport(null)
  }

  const handleClearMonth = () => {
    if (currentMonthData.length === 0) return

    if (confirm(`¿Eliminar los ${currentMonthData.length} gastos de ${CONFIG.MESES[appState.month]} ${appState.year}?`)) {
      clearMonthData(monthKey)
      setLastImport(null)
    }
  }

  const cancelPreview = () => {
    setFile(null)
    setPreviewData([])
    setDuplicates([])
    setShowPreview(false)
    setError(null)
  }

  const validCount = previewData.filter(r => r.validation.isValid).length
  const invalidCount = previewData.filter(r => !r.validation.isValid).length

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Importar Datos</h1>
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelp(true)}
            className="gap-2 glass-subtle border-border/50 hover:bg-muted/30"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">Ayuda</span>
          </Button>
        </div>
        <p className="text-muted-foreground">Cargá archivos Excel con tus gastos. Se validarán automáticamente.</p>
      </header>

      {/* Drop Zone */}
      {!showPreview && (
        <div className="glass rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Cargar Archivo</h3>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300",
              "flex flex-col items-center justify-center text-center",
              isDragging ? "border-primary bg-primary/10 glow-primary" : "border-border/50 hover:border-primary/50",
              file && "border-primary bg-primary/10 glow-primary",
            )}
          >
            {file ? (
              <>
                <div className="w-20 h-20 rounded-2xl glass-subtle flex items-center justify-center mb-4 glow-primary">
                  <FileSpreadsheet className="w-10 h-10 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground mb-1">{file.name}</p>
                <p className="text-sm text-muted-foreground mb-6">{(file.size / 1024).toFixed(1)} KB</p>
                {error && (
                  <p className="text-sm text-destructive mb-4 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={cancelPreview}
                    className="gap-2 glass-subtle border-border/50 hover:bg-muted/30"
                  >
                    <X size={16} />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Procesar Archivo
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-2xl glass-subtle flex items-center justify-center mb-4">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground mb-1">Arrastrá tu archivo Excel aquí</p>
                <p className="text-sm text-muted-foreground mb-4">o hacé clic para seleccionar (.xlsx, .xls)</p>
                {error && (
                  <p className="text-sm text-destructive mb-4 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </p>
                )}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview Section */}
      {showPreview && previewData.length > 0 && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-border/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Vista Previa</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {file?.name} - {previewData.length} filas detectadas
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelPreview}
                className="gap-2 glass-subtle border-border/50"
              >
                <X size={14} />
                Cancelar
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-chart-2/20 text-chart-2">
                <Check size={12} />
                {validCount} válidas
              </span>
              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                  <AlertCircle size={12} />
                  {invalidCount} con errores
                </span>
              )}
              {duplicates.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle size={12} />
                  {duplicates.length} duplicados
                </span>
              )}
            </div>

            {/* Import Actions */}
            <div className="flex gap-3">
              {duplicates.length > 0 ? (
                <>
                  <Button
                    onClick={() => handleImport(false)}
                    variant="outline"
                    className="gap-2"
                  >
                    Importar sin duplicados ({validCount - duplicates.length})
                  </Button>
                  <Button
                    onClick={() => handleImport(true)}
                    className="gap-2 bg-primary text-primary-foreground"
                  >
                    Importar todo ({validCount})
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleImport(true)}
                  disabled={validCount === 0}
                  className="gap-2 bg-primary text-primary-foreground"
                >
                  <Check size={16} />
                  Importar {validCount} registros
                </Button>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="sticky top-0 glass-subtle">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cuotas
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    ARS
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    USD
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Medio
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {previewData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      "hover:bg-muted/20 transition-colors",
                      row.isDuplicate && "bg-yellow-500/5"
                    )}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{row.descripcion || "-"}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground font-mono">{row.fecha || "-"}</td>
                    <td className="px-4 py-4 text-sm text-right font-mono text-foreground">
                      {row.cuotas > 1 ? `${row.cuota_actual}/${row.cuotas}` : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-mono text-foreground">
                      {row.monto_ars ? formatCurrency(row.monto_ars, 'ARS') : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-mono text-foreground">
                      {row.monto_usd ? formatCurrency(row.monto_usd, 'USD') : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{row.medio_pago || "-"}</td>
                    <td className="px-4 py-4 text-center">
                      {row.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                          Duplicado
                        </span>
                      ) : row.validation.isValid ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-chart-2/20 text-chart-2">
                          <Check size={12} />
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                          <AlertCircle size={12} />
                          {row.validation.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Current Month Data */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border/30 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Datos de {CONFIG.MESES[appState.month]} {appState.year}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{currentMonthData.length} gastos cargados</p>
          </div>
          <div className="flex gap-2">
            {lastImport && lastImport.monthKey === monthKey && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="gap-2 glass-subtle border-border/50"
              >
                <Undo2 size={14} />
                Deshacer ({lastImport.count})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearMonth}
              disabled={currentMonthData.length === 0}
              className="gap-2 text-destructive hover:bg-destructive/10 glass-subtle border-destructive/30 bg-transparent"
            >
              <Trash2 size={14} />
              Limpiar Mes
            </Button>
          </div>
        </div>

        {currentMonthData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Sin datos</h4>
            <p className="text-sm text-muted-foreground">
              Importá un archivo Excel para ver tus gastos de {CONFIG.MESES[appState.month]}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="glass-subtle">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cuotas
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    ARS
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    USD
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Medio
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Entidad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {currentMonthData.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{row.descripcion}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground font-mono">{row.fecha}</td>
                    <td className="px-4 py-4 text-sm text-right font-mono text-foreground">
                      {row.cuotas > 1 ? `${row.cuota_actual}/${row.cuotas}` : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-mono text-foreground">
                      {row.monto_ars ? formatCurrency(row.monto_ars, 'ARS') : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-mono text-foreground">
                      {row.monto_usd ? formatCurrency(row.monto_usd, 'USD') : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{row.medio_pago}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{row.entidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentMonthData.length > 50 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t border-border/30">
                Mostrando 50 de {currentMonthData.length} gastos
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <HelpModal
          onClose={() => setShowHelp(false)}
          copiedPrompt={copiedPrompt}
          setCopiedPrompt={setCopiedPrompt}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HELP MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════

interface HelpModalProps {
  onClose: () => void
  copiedPrompt: boolean
  setCopiedPrompt: (value: boolean) => void
}

function HelpModal({ onClose, copiedPrompt, setCopiedPrompt }: HelpModalProps) {
  const promptFull = `Necesito que conviertas los siguientes gastos a formato Excel para mi app de contabilidad del hogar.

ESTRUCTURA REQUERIDA:
- descripcion (obligatorio): nombre del gasto
- fecha (obligatorio): formato DD/MM/YYYY
- monto_ars: monto en pesos (dejar vacío si es en USD)
- monto_usd: monto en dólares (dejar vacío si es en ARS)
- medio_pago: Mastercard | Visa | Amex | Efectivo
- entidad: Galicia Mas | Galicia | Patagonia | Ciudad | Macro | Hipotecario | Amex directa
- cuotas: número total de cuotas (1 si no es en cuotas)
- cuota_actual: número de cuota actual (1 si no es en cuotas)
- responsable: Persona 1 | Persona 2 | Compartido

REGLAS:
1. Si no especifico moneda, asumir ARS
2. Si no especifico cuotas, poner 1
3. Si no especifico responsable, poner "Compartido"
4. Si no especifico medio de pago, inferir de la entidad o poner "Efectivo"
5. Generar una tabla en formato CSV o Markdown que pueda copiar a Excel

MIS GASTOS:
[PEGAR TUS GASTOS AQUÍ]`

  const promptShort = `Convertí estos gastos a tabla Excel con columnas:
descripcion, fecha (DD/MM/YYYY), monto_ars, monto_usd, medio_pago (Mastercard/Visa/Amex/Efectivo), entidad (Galicia Mas/Galicia/Patagonia/Ciudad/Macro/Hipotecario), cuotas, cuota_actual, responsable (Persona 1/Persona 2/Compartido)

Gastos:
[TUS GASTOS AQUÍ]`

  const [activePrompt, setActivePrompt] = useState<'full' | 'short'>('full')

  const copyPrompt = async () => {
    const text = activePrompt === 'full' ? promptFull : promptShort
    await navigator.clipboard.writeText(text)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-strong rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Manual de Carga</h2>
              <p className="text-sm text-muted-foreground">Formato del archivo Excel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Estructura del Excel */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-primary" />
              Estructura del Excel
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-foreground">Columna</th>
                    <th className="text-center px-3 py-2 font-medium text-foreground">Req.</th>
                    <th className="text-left px-3 py-2 font-medium text-foreground">Descripción</th>
                    <th className="text-left px-3 py-2 font-medium text-foreground">Ejemplo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  <tr><td className="px-3 py-2 font-mono text-xs">descripcion</td><td className="px-3 py-2 text-center text-chart-2">✓</td><td className="px-3 py-2 text-muted-foreground">Nombre del gasto</td><td className="px-3 py-2 text-muted-foreground">Netflix</td></tr>
                  <tr><td className="px-3 py-2 font-mono text-xs">fecha</td><td className="px-3 py-2 text-center text-chart-2">✓</td><td className="px-3 py-2 text-muted-foreground">DD/MM/YYYY</td><td className="px-3 py-2 text-muted-foreground">15/01/2025</td></tr>
                  <tr><td className="px-3 py-2 font-mono text-xs">monto_ars</td><td className="px-3 py-2 text-center text-yellow-500">*</td><td className="px-3 py-2 text-muted-foreground">Monto en pesos</td><td className="px-3 py-2 text-muted-foreground">15000</td></tr>
                  <tr><td className="px-3 py-2 font-mono text-xs">monto_usd</td><td className="px-3 py-2 text-center text-yellow-500">*</td><td className="px-3 py-2 text-muted-foreground">Monto en dólares</td><td className="px-3 py-2 text-muted-foreground">50.00</td></tr>
                  <tr><td className="px-3 py-2 font-mono text-xs">medio_pago</td><td className="px-3 py-2 text-center text-muted-foreground">-</td><td className="px-3 py-2 text-muted-foreground">Tarjeta/forma de pago</td><td className="px-3 py-2 text-muted-foreground">Visa</td></tr>
                  <tr><td className="px-3 py-2 font-mono text-xs">entidad</td><td className="px-3 py-2 text-center text-muted-foreground">-</td><td className="px-3 py-2 text-muted-foreground">Banco emisor</td><td className="px-3 py-2 text-muted-foreground">Galicia</td></tr>
                  <tr><td className="px-3 py-2 font-mono text-xs">cuotas</td><td className="px-3 py-2 text-center text-muted-foreground">-</td><td className="px-3 py-2 text-muted-foreground">Total de cuotas</td><td className="px-3 py-2 text-muted-foreground">12</td></tr>
                  <tr><td className="px-3 py-2 font-mono text-xs">cuota_actual</td><td className="px-3 py-2 text-center text-muted-foreground">-</td><td className="px-3 py-2 text-muted-foreground">Cuota actual</td><td className="px-3 py-2 text-muted-foreground">3</td></tr>
                  <tr><td className="px-3 py-2 font-mono text-xs">responsable</td><td className="px-3 py-2 text-center text-muted-foreground">-</td><td className="px-3 py-2 text-muted-foreground">Quién pagó</td><td className="px-3 py-2 text-muted-foreground">Persona 1</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-chart-2">✓</span> = Obligatorio | <span className="text-yellow-500">*</span> = Al menos uno requerido
            </p>
          </section>

          {/* Valores Válidos */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Valores Válidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Medios de Pago */}
              <div className="glass-subtle rounded-xl p-4">
                <h4 className="font-medium text-foreground mb-2 text-sm">Medios de Pago</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><span className="text-foreground">Mastercard</span> <span className="text-xs">(mc, master)</span></li>
                  <li><span className="text-foreground">Visa</span></li>
                  <li><span className="text-foreground">Amex</span> <span className="text-xs">(american express)</span></li>
                  <li><span className="text-foreground">Efectivo</span> <span className="text-xs">(cash, débito)</span></li>
                </ul>
              </div>

              {/* Entidades */}
              <div className="glass-subtle rounded-xl p-4">
                <h4 className="font-medium text-foreground mb-2 text-sm">Entidades</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><span className="text-foreground">Galicia Mas</span></li>
                  <li><span className="text-foreground">Galicia</span> <span className="text-xs">(bbva)</span></li>
                  <li><span className="text-foreground">Patagonia</span></li>
                  <li><span className="text-foreground">Ciudad</span></li>
                  <li><span className="text-foreground">Macro</span></li>
                  <li><span className="text-foreground">Hipotecario</span></li>
                  <li><span className="text-foreground">Amex directa</span></li>
                </ul>
              </div>

              {/* Responsables */}
              <div className="glass-subtle rounded-xl p-4">
                <h4 className="font-medium text-foreground mb-2 text-sm">Responsables</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><span className="text-foreground">Persona 1</span> <span className="text-xs">(p1, 1)</span></li>
                  <li><span className="text-foreground">Persona 2</span> <span className="text-xs">(p2, 2)</span></li>
                  <li><span className="text-foreground">Compartido</span> <span className="text-xs">(ambos)</span></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prompt para IA */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Prompt para IA
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Copiá este prompt en ChatGPT o Claude junto con tus gastos para generar el Excel automáticamente.
            </p>

            {/* Prompt Tabs */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setActivePrompt('full')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activePrompt === 'full'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                Completo
              </button>
              <button
                onClick={() => setActivePrompt('short')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activePrompt === 'short'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                Rápido
              </button>
            </div>

            {/* Prompt Box */}
            <div className="relative">
              <pre className="glass-subtle rounded-xl p-4 text-xs text-muted-foreground whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                {activePrompt === 'full' ? promptFull : promptShort}
              </pre>
              <button
                onClick={copyPrompt}
                className={cn(
                  "absolute top-2 right-2 p-2 rounded-lg transition-all",
                  copiedPrompt
                    ? "bg-chart-2/20 text-chart-2"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {copiedPrompt ? <CheckCheck size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Cuotas:</strong> Para compras en cuotas, importá cada mes actualizando cuota_actual.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Montos:</strong> Solo números, sin símbolos ($, US$).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong className="text-foreground">Duplicados:</strong> El sistema detecta automáticamente gastos ya importados.</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 shrink-0">
          <Button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  )
}

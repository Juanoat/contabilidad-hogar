"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Trash2, Sparkles, Undo2 } from "lucide-react"
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
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Importar Datos</h1>
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
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
    </div>
  )
}

'use client';

// ═══════════════════════════════════════════════════════════════
// APP CONTEXT - Estado Global con Base de Datos
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppState, AppContextType, Expense, Income } from '@/lib/types';
import { getMonthKey, generateId } from '@/lib/parsers';

const AppContext = createContext<AppContextType | null>(null);

function getInitialState(): AppState {
  const now = new Date();
  return {
    currentMonth: now.getMonth() + 1,
    currentYear: now.getFullYear(),
    data: {},
    income: { base: [], overrides: {} },
    exchangeRate: 1200,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Cargar datos de la base de datos al montar
  useEffect(() => {
    async function loadFromDatabase() {
      try {
        // Inicializar DB (crea tablas si no existen)
        await fetch('/api/db/init');

        // Cargar gastos
        const expensesRes = await fetch('/api/expenses');
        const expensesData = await expensesRes.json();

        // Cargar ingresos
        const incomesRes = await fetch('/api/incomes');
        const incomesData = await incomesRes.json();

        // Cargar configuración
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();

        if (expensesData.success && incomesData.success && settingsData.success) {
          setState(prev => ({
            ...prev,
            data: expensesData.data || {},
            income: {
              base: incomesData.data || [],
              overrides: {},
            },
            exchangeRate: settingsData.data?.exchangeRate || 1200,
          }));
          console.log('✓ Datos cargados de la base de datos');
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        setDbError('Error conectando a la base de datos');
      } finally {
        setIsLoaded(true);
      }
    }

    loadFromDatabase();
  }, []);

  // === Setters básicos ===

  const setMonth = useCallback((month: number) => {
    setState((prev) => ({ ...prev, currentMonth: month }));
  }, []);

  const setYear = useCallback((year: number) => {
    setState((prev) => ({ ...prev, currentYear: year }));
  }, []);

  const setExchangeRate = useCallback(async (rate: number) => {
    setState((prev) => ({ ...prev, exchangeRate: rate }));
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchangeRate: rate }),
      });
    } catch (error) {
      console.error('Error guardando exchange rate:', error);
    }
  }, []);

  // === Manejo de Gastos ===

  const addExpenses = useCallback(async (expenses: Expense[], monthKey: string) => {
    // Actualizar estado local inmediatamente
    setState((prev) => {
      const newData = { ...prev.data };
      if (!newData[monthKey]) {
        newData[monthKey] = [];
      }
      newData[monthKey] = [...newData[monthKey], ...expenses];
      return { ...prev, data: newData };
    });

    // Guardar en base de datos
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses, monthKey }),
      });
    } catch (error) {
      console.error('Error guardando gastos:', error);
    }
  }, []);

  const deleteExpense = useCallback(async (monthKey: string, index: number) => {
    // Actualizar estado local
    setState((prev) => {
      const newData = { ...prev.data };
      if (newData[monthKey]) {
        newData[monthKey] = newData[monthKey].filter((_, i) => i !== index);
        if (newData[monthKey].length === 0) {
          delete newData[monthKey];
        }
      }
      return { ...prev, data: newData };
    });

    // Borrar de base de datos
    try {
      await fetch(`/api/expenses?monthKey=${monthKey}&index=${index}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error borrando gasto:', error);
    }
  }, []);

  const clearMonthData = useCallback(async (monthKey: string) => {
    setState((prev) => {
      const newData = { ...prev.data };
      delete newData[monthKey];
      return { ...prev, data: newData };
    });

    try {
      await fetch(`/api/expenses?monthKey=${monthKey}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error borrando mes:', error);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    setState(getInitialState());

    try {
      await Promise.all([
        fetch('/api/expenses?all=true', { method: 'DELETE' }),
        fetch('/api/incomes?all=true', { method: 'DELETE' }),
      ]);
    } catch (error) {
      console.error('Error borrando datos:', error);
    }
  }, []);

  // === Manejo de Ingresos ===

  const addIncome = useCallback(async (income: Omit<Income, 'id'>) => {
    const newIncome: Income = { ...income, id: generateId() };

    setState((prev) => ({
      ...prev,
      income: {
        ...prev.income,
        base: [...prev.income.base, newIncome],
      },
    }));

    try {
      await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncome),
      });
    } catch (error) {
      console.error('Error guardando ingreso:', error);
    }
  }, []);

  const updateIncome = useCallback(async (id: string, updates: Partial<Income>) => {
    setState((prev) => ({
      ...prev,
      income: {
        ...prev.income,
        base: prev.income.base.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      },
    }));

    try {
      await fetch('/api/incomes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
    } catch (error) {
      console.error('Error actualizando ingreso:', error);
    }
  }, []);

  const deleteIncome = useCallback(async (id: string) => {
    setState((prev) => ({
      ...prev,
      income: {
        ...prev.income,
        base: prev.income.base.filter((item) => item.id !== id),
      },
    }));

    try {
      await fetch(`/api/incomes?id=${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error borrando ingreso:', error);
    }
  }, []);

  const getIncomeForMonth = useCallback(
    (monthKey: string): Income[] => {
      if (state.income.overrides[monthKey]) {
        return state.income.overrides[monthKey];
      }
      return state.income.base.map((item) => ({ ...item }));
    },
    [state.income]
  );

  // === Utilidades ===

  const getCurrentMonthKey = useCallback((): string => {
    return getMonthKey(state.currentMonth, state.currentYear);
  }, [state.currentMonth, state.currentYear]);

  const getMonthExpenses = useCallback(
    (month: number, year: number): Expense[] => {
      const key = getMonthKey(month, year);
      return state.data[key] || [];
    },
    [state.data]
  );

  const contextValue: AppContextType = {
    state,
    setMonth,
    setYear,
    setExchangeRate,
    addExpenses,
    deleteExpense,
    clearMonthData,
    clearAllData,
    addIncome,
    updateIncome,
    deleteIncome,
    getIncomeForMonth,
    getMonthKey,
    getCurrentMonthKey,
    getMonthExpenses,
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Conectando a la base de datos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dbError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Error de Conexión</h2>
          <p className="text-muted-foreground">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
}

export default AppContext;

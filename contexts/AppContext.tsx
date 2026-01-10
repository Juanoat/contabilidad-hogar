'use client';

// ═══════════════════════════════════════════════════════════════
// APP CONTEXT - Estado Global de la Aplicación
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppState, AppContextType, Expense, Income } from '@/lib/types';
import {
  loadFullState,
  saveExpensesToStorage,
  saveIncomeToStorage,
  saveExchangeRate,
  clearAllStorage,
  getInitialState,
} from '@/lib/storage';
import { getMonthKey, generateId } from '@/lib/parsers';

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar datos de localStorage al montar
  useEffect(() => {
    const loadedState = loadFullState();
    setState(loadedState);
    setIsLoaded(true);
    console.log('✓ Estado cargado de localStorage');
  }, []);

  // === Setters básicos ===

  const setMonth = useCallback((month: number) => {
    setState((prev) => ({ ...prev, currentMonth: month }));
  }, []);

  const setYear = useCallback((year: number) => {
    setState((prev) => ({ ...prev, currentYear: year }));
  }, []);

  const setExchangeRate = useCallback((rate: number) => {
    setState((prev) => ({ ...prev, exchangeRate: rate }));
    saveExchangeRate(rate);
  }, []);

  // === Manejo de Gastos ===

  const addExpenses = useCallback((expenses: Expense[], monthKey: string) => {
    setState((prev) => {
      const newData = { ...prev.data };
      if (!newData[monthKey]) {
        newData[monthKey] = [];
      }
      newData[monthKey] = [...newData[monthKey], ...expenses];
      saveExpensesToStorage(newData);
      return { ...prev, data: newData };
    });
  }, []);

  const deleteExpense = useCallback((monthKey: string, index: number) => {
    setState((prev) => {
      const newData = { ...prev.data };
      if (newData[monthKey]) {
        newData[monthKey] = newData[monthKey].filter((_, i) => i !== index);
        if (newData[monthKey].length === 0) {
          delete newData[monthKey];
        }
        saveExpensesToStorage(newData);
      }
      return { ...prev, data: newData };
    });
  }, []);

  const clearMonthData = useCallback((monthKey: string) => {
    setState((prev) => {
      const newData = { ...prev.data };
      delete newData[monthKey];
      saveExpensesToStorage(newData);
      return { ...prev, data: newData };
    });
  }, []);

  const clearAllData = useCallback(() => {
    clearAllStorage();
    setState(getInitialState());
  }, []);

  // === Manejo de Ingresos ===

  const addIncome = useCallback((income: Omit<Income, 'id'>) => {
    const newIncome: Income = { ...income, id: generateId() };
    setState((prev) => {
      const newIncomeState = {
        ...prev.income,
        base: [...prev.income.base, newIncome],
      };
      saveIncomeToStorage(newIncomeState);
      return { ...prev, income: newIncomeState };
    });
  }, []);

  const updateIncome = useCallback((id: string, updates: Partial<Income>) => {
    setState((prev) => {
      const newIncomeState = {
        ...prev.income,
        base: prev.income.base.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      };
      saveIncomeToStorage(newIncomeState);
      return { ...prev, income: newIncomeState };
    });
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setState((prev) => {
      const newIncomeState = {
        ...prev.income,
        base: prev.income.base.filter((item) => item.id !== id),
      };
      saveIncomeToStorage(newIncomeState);
      return { ...prev, income: newIncomeState };
    });
  }, []);

  const getIncomeForMonth = useCallback(
    (monthKey: string): Income[] => {
      // Si hay override para este mes, usarlo
      if (state.income.overrides[monthKey]) {
        return state.income.overrides[monthKey];
      }
      // Sino, devolver copia de los ingresos base
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

  // No renderizar hasta que se carguen los datos
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
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

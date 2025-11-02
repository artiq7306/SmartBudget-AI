import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction, CategoryType, TransactionType, AppSettings, FinancialSummary, CategorySummary } from '@/types';

const STORAGE_KEYS = {
  TRANSACTIONS: '@smartbudget_transactions',
  SETTINGS: '@smartbudget_settings',
};

const defaultSettings: AppSettings = {
  language: 'en',
  currency: 'UZS',
  notifications: true,
};

export const [BudgetContext, useBudget] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const data = stored ? JSON.parse(stored) : [];
        console.log('[BudgetContext] Loaded transactions:', data.length);
        return data as Transaction[];
      } catch (error) {
        console.error('[BudgetContext] Error loading transactions:', error);
        return [];
      }
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
        const data = stored ? JSON.parse(stored) : defaultSettings;
        console.log('[BudgetContext] Loaded settings:', data);
        return data as AppSettings;
      } catch (error) {
        console.error('[BudgetContext] Error loading settings:', error);
        return defaultSettings;
      }
    },
  });

  const saveTransactionsMutation = useMutation({
    mutationFn: async (newTransactions: Transaction[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTransactions));
      console.log('[BudgetContext] Saved transactions:', newTransactions.length);
      return newTransactions;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['transactions'], data);
      setTransactions(data);
    },
  });
  const { mutate: saveTransactions } = saveTransactionsMutation;

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: AppSettings) => {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      console.log('[BudgetContext] Saved settings:', newSettings);
      return newSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
      setSettings(data);
    },
  });
  const { mutate: saveSettingsMutate } = saveSettingsMutation;

  useEffect(() => {
    if (transactionsQuery.data) {
      setTransactions(transactionsQuery.data);
    }
  }, [transactionsQuery.data]);

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    setTransactions(currentTransactions => {
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };
      const updated = [newTransaction, ...currentTransactions];
      saveTransactions(updated);
      console.log('[BudgetContext] Added transaction:', newTransaction);
      return updated;
    });
  }, [saveTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(currentTransactions => {
      const updated = currentTransactions.filter(t => t.id !== id);
      saveTransactions(updated);
      console.log('[BudgetContext] Deleted transaction:', id);
      return updated;
    });
  }, [saveTransactions]);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    setTransactions(currentTransactions => {
      const updated = currentTransactions.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      saveTransactions(updated);
      console.log('[BudgetContext] Updated transaction:', id, updates);
      return updated;
    });
  }, [saveTransactions]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(currentSettings => {
      const updated = { ...currentSettings, ...newSettings };
      saveSettingsMutate(updated);
      console.log('[BudgetContext] Updated settings:', updated);
      return updated;
    });
  }, [saveSettingsMutate]);

  const financialSummary: FinancialSummary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
    };
  }, [transactions]);

  const categoryBreakdown: CategorySummary[] = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<CategoryType, { amount: number; count: number }>();

    expenseTransactions.forEach(t => {
      const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
      categoryMap.set(t.category, {
        amount: existing.amount + t.amount,
        count: existing.count + 1,
      });
    });

    const breakdown: CategorySummary[] = [];
    categoryMap.forEach((value, category) => {
      breakdown.push({
        category,
        amount: value.amount,
        percentage: totalExpense > 0 ? (value.amount / totalExpense) * 100 : 0,
        transactionCount: value.count,
      });
    });

    return breakdown.sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const getTransactionsByMonth = useCallback((year: number, month: number) => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }, [transactions]);

  return useMemo(() => ({
    transactions,
    settings,
    financialSummary,
    categoryBreakdown,
    isLoading: transactionsQuery.isLoading || settingsQuery.isLoading,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    updateSettings,
    getTransactionsByMonth,
  }), [transactions, settings, financialSummary, categoryBreakdown, transactionsQuery.isLoading, settingsQuery.isLoading, addTransaction, deleteTransaction, updateTransaction, updateSettings, getTransactionsByMonth]);
});

export const useFilteredTransactions = (
  type?: TransactionType,
  category?: CategoryType,
  limit?: number
) => {
  const { transactions } = useBudget();

  return useMemo(() => {
    let filtered = transactions;

    if (type) {
      filtered = filtered.filter(t => t.type === type);
    }

    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [transactions, type, category, limit]);
};

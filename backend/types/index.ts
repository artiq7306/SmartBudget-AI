export type TransactionType = 'income' | 'expense';

export type CategoryType = 'food' | 'transport' | 'entertainment' | 'shopping' | 'bills' | 'health' | 'education' | 'other' | 'salary' | 'business' | 'investment';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: CategoryType;
  description: string;
  date: string;
  createdAt: number;
}

export interface BudgetLimit {
  category: CategoryType;
  limit: number;
  spent: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
}

export interface CategorySummary {
  category: CategoryType;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export type Language = 'en' | 'uz' | 'ru';

export interface AppSettings {
  language: Language;
  currency: string;
  notifications: boolean;
}

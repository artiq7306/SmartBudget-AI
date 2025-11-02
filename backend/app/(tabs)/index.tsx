import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated as RNAnimated, Alert, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, Trash2, Edit3, X } from 'lucide-react-native';
import { useBudget, useFilteredTransactions } from '@/contexts/BudgetContext';
import { getTranslation } from '@/constants/translations';
import Colors from '@/constants/colors';
import { useMemo, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const { financialSummary, settings, isLoading, deleteTransaction, updateTransaction } = useBudget();
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const recentTransactions = useFilteredTransactions(undefined, undefined, 5);
  const t = (key: keyof typeof import('@/constants/translations').translations.en) => 
    getTranslation(settings.language, key);

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(50)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const formattedBalance = useMemo(() => `${Math.abs(financialSummary.balance).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${settings.currency}`, [financialSummary.balance, settings.currency]);
  const formattedIncome = useMemo(() => `${Math.abs(financialSummary.totalIncome).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${settings.currency}`, [financialSummary.totalIncome, settings.currency]);
  const formattedExpense = useMemo(() => `${Math.abs(financialSummary.totalExpense).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${settings.currency}`, [financialSummary.totalExpense, settings.currency]);

  const formatCurrency = (amount: number) => {
    return `${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${settings.currency}`;
  };

  const handleDelete = (transactionId: string, description: string) => {
    Alert.alert(
      t('confirmDelete'),
      `${description}`,
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => deleteTransaction(transactionId)
        }
      ]
    );
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
  };

  const handleSaveEdit = () => {
    if (!editingTransaction) return;
    
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('error'), 'Please enter a valid amount');
      return;
    }

    updateTransaction(editingTransaction.id, {
      amount: parsedAmount,
      description: editDescription.trim() || editingTransaction.description
    });
    
    setEditingTransaction(null);
    setEditAmount('');
    setEditDescription('');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <RNAnimated.View 
          style={[
            styles.balanceCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.light.primary, Colors.light.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIconContainer}>
                <Wallet color="#FFFFFF" size={24} />
              </View>
              <Text style={styles.balanceLabel}>{t('balance')}</Text>
            </View>
            <Text style={styles.balanceAmount}>{formattedBalance}</Text>
            <View style={styles.savingsRateContainer}>
              <Text style={styles.savingsRateText}>
                {t('savingsRate')}: {financialSummary.savingsRate.toFixed(1)}%
              </Text>
            </View>
          </LinearGradient>
        </RNAnimated.View>

        <RNAnimated.View 
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.light.income + '20' }]}>
              <TrendingUp color={Colors.light.income} size={20} />
            </View>
            <Text style={styles.statLabel}>{t('income')}</Text>
            <Text style={[styles.statAmount, { color: Colors.light.income }]}>
              {formattedIncome}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.light.expense + '20' }]}>
              <TrendingDown color={Colors.light.expense} size={20} />
            </View>
            <Text style={styles.statLabel}>{t('expense')}</Text>
            <Text style={[styles.statAmount, { color: Colors.light.expense }]}>
              {formattedExpense}
            </Text>
          </View>
        </RNAnimated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recentTransactions')}</Text>
          {recentTransactions.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/analytics')}>
              <Text style={styles.viewAllButton}>{t('viewAll')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>{t('noTransactionsYet')}</Text>
            <Text style={styles.emptyStateText}>
              {t('startTracking')}
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction) => {
              const isIncome = transaction.type === 'income';
              const categoryColor = Colors.light.categories[transaction.category as keyof typeof Colors.light.categories] || Colors.light.textSecondary;
              
              return (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={[styles.transactionIcon, { backgroundColor: categoryColor + '20' }]}>
                    {isIncome ? (
                      <ArrowUpRight color={Colors.light.income} size={20} />
                    ) : (
                      <ArrowDownRight color={Colors.light.expense} size={20} />
                    )}
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description || t(transaction.category)}
                    </Text>
                    <Text style={styles.transactionCategory}>
                      {t(transaction.category)} • {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text 
                      style={[
                        styles.transactionAmount,
                        { color: isIncome ? Colors.light.income : Colors.light.expense }
                      ]}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </Text>
                    <View style={styles.transactionActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEdit(transaction)}
                      >
                        <Edit3 color={Colors.light.primary} size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDelete(transaction.id, transaction.description || t(transaction.category))}
                      >
                        <Trash2 color={Colors.light.danger} size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!editingTransaction}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingTransaction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('edit')}</Text>
              <TouchableOpacity onPress={() => setEditingTransaction(null)}>
                <X color={Colors.light.text} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>{t('amount')}</Text>
              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.modalInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.light.textLight}
                />
                <Text style={styles.modalCurrency}>{settings.currency}</Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>{t('description')}</Text>
              <TextInput
                style={styles.modalDescriptionInput}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder={t('description')}
                placeholderTextColor={Colors.light.textLight}
                multiline
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditingTransaction(null)}
              >
                <Text style={styles.modalButtonTextCancel}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalButtonTextSave}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-transaction' as any)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.light.primary, Colors.light.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus color="#FFFFFF" size={28} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  balanceCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceGradient: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500' as const,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  savingsRateContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  savingsRateText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  viewAllButton: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600' as const,
  },
  emptyState: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  transactionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    elevation: 6,
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  modalCurrency: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  modalDescriptionInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.light.surface,
  },
  modalButtonSave: {
    backgroundColor: Colors.light.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});

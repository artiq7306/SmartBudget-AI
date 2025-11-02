import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useBudget } from '@/contexts/BudgetContext';
import { getTranslation } from '@/constants/translations';
import Colors from '@/constants/colors';
import { TransactionType, CategoryType } from '@/types';
import { ArrowUpRight, ArrowDownRight, X } from 'lucide-react-native';

const incomeCategories: CategoryType[] = ['salary', 'business', 'investment', 'other'];
const expenseCategories: CategoryType[] = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'education', 'other'];

export default function AddTransactionScreen() {
  const router = useRouter();
  const { addTransaction, settings } = useBudget();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('food');
  const [description, setDescription] = useState('');

  const t = (key: keyof typeof import('@/constants/translations').translations.en) => 
    getTranslation(settings.language, key);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!category) {
      alert('Please select a category');
      return;
    }

    addTransaction({
      type,
      amount: parsedAmount,
      category,
      description: description.trim() || t(category),
      date: new Date().toISOString(),
    });

    console.log('[Add Transaction] Transaction added:', { type, amount: parsedAmount, category, description });
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: t('addTransaction'),
          presentation: 'modal',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <X color={Colors.light.text} size={24} />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
            onPress={() => {
              setType('income');
              setCategory('salary');
            }}
          >
            <View style={[styles.typeIcon, type === 'income' && styles.typeIconActive]}>
              <ArrowUpRight color={type === 'income' ? '#FFFFFF' : Colors.light.income} size={20} />
            </View>
            <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
              {t('income')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
            onPress={() => {
              setType('expense');
              setCategory('food');
            }}
          >
            <View style={[styles.typeIcon, type === 'expense' && styles.typeIconActive]}>
              <ArrowDownRight color={type === 'expense' ? '#FFFFFF' : Colors.light.expense} size={20} />
            </View>
            <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
              {t('expense')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.label}>{t('amount')}</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.light.textLight}
            />
            <Text style={styles.currency}>{settings.currency}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('category')}</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => {
              const isSelected = category === cat;
              const categoryColor = Colors.light.categories[cat as keyof typeof Colors.light.categories] || Colors.light.textSecondary;
              
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    isSelected && { 
                      backgroundColor: categoryColor + '20',
                      borderColor: categoryColor,
                      borderWidth: 2
                    }
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                  <Text style={[styles.categoryText, isSelected && { color: categoryColor, fontWeight: '700' as const }]}>
                    {t(cat)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('description')}</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder={`${t('description')} (${t('category')})`}
            placeholderTextColor={Colors.light.textLight}
            multiline
            maxLength={100}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    borderColor: Colors.light.primary,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: Colors.light.background,
  },
  typeIconActive: {
    backgroundColor: Colors.light.primary,
  },
  typeButtonText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '600' as const,
  },
  typeButtonTextActive: {
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
  amountSection: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500' as const,
  },
  descriptionInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

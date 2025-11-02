import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useBudget } from '@/contexts/BudgetContext';
import { getTranslation } from '@/constants/translations';
import Colors from '@/constants/colors';
import { Globe, DollarSign, Bell, ChevronRight } from 'lucide-react-native';
import { Language } from '@/types';

export default function SettingsScreen() {
  const { settings, updateSettings } = useBudget();
  const t = (key: keyof typeof import('@/constants/translations').translations.en) => 
    getTranslation(settings.language, key);

  const languages: { value: Language; label: string }[] = [
    { value: 'en', label: t('english') },
    { value: 'uz', label: t('uzbek') },
    { value: 'ru', label: t('russian') },
  ];

  const currencies = ['UZS', 'USD', 'RUB', 'EUR'];

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe color={Colors.light.primary} size={20} />
          <Text style={styles.sectionTitle}>{t('language')}</Text>
        </View>
        <View style={styles.card}>
          {languages.map((lang, index) => (
            <TouchableOpacity
              key={lang.value}
              style={[
                styles.optionRow,
                index !== languages.length - 1 && styles.optionBorder
              ]}
              onPress={() => updateSettings({ language: lang.value })}
            >
              <Text style={styles.optionLabel}>{lang.label}</Text>
              {settings.language === lang.value && (
                <View style={styles.selectedDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign color={Colors.light.primary} size={20} />
          <Text style={styles.sectionTitle}>{t('currency')}</Text>
        </View>
        <View style={styles.card}>
          {currencies.map((currency, index) => (
            <TouchableOpacity
              key={currency}
              style={[
                styles.optionRow,
                index !== currencies.length - 1 && styles.optionBorder
              ]}
              onPress={() => updateSettings({ currency })}
            >
              <Text style={styles.optionLabel}>{currency}</Text>
              {settings.currency === currency && (
                <View style={styles.selectedDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell color={Colors.light.primary} size={20} />
          <Text style={styles.sectionTitle}>{t('notifications')}</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>{t('enableNotifications')}</Text>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSettings({ notifications: value })}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              thumbColor={Colors.light.surface}
            />
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>SmartBudget AI</Text>
        <Text style={styles.infoText}>Version 1.0.0</Text>
        <Text style={styles.infoText}>AI-powered financial management</Text>
      </View>
    </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginLeft: 8,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  optionLabel: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500' as const,
  },
  selectedDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
  },
  infoCard: {
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
});

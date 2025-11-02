import { StyleSheet, Text, View, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useBudget } from '@/contexts/BudgetContext';
import { getTranslation } from '@/constants/translations';
import Colors from '@/constants/colors';
import { PieChart, BarChart, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { generateText } from '@rork/toolkit-sdk';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = SCREEN_WIDTH - 80;
const RADIUS = CHART_SIZE / 2 - 20;

export default function AnalyticsScreen() {
  const { categoryBreakdown, financialSummary, settings, transactions } = useBudget();
  const t = useCallback((key: keyof typeof import('@/constants/translations').translations.en) => 
    getTranslation(settings.language, key), [settings.language]);

  const formatCurrency = (amount: number) => {
    return `${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${settings.currency}`;
  };

  const pieChartData = useMemo(() => {
    let cumulativePercentage = 0;
    return categoryBreakdown.map((item) => {
      const startPercentage = cumulativePercentage;
      cumulativePercentage += item.percentage;
      return {
        ...item,
        startPercentage,
        endPercentage: cumulativePercentage,
      };
    });
  }, [categoryBreakdown]);

  const PieSlice = ({ 
    startPercentage, 
    endPercentage, 
    color 
  }: { 
    startPercentage: number; 
    endPercentage: number; 
    color: string;
  }) => {
    return (
      <G>
        <Circle
          cx={CHART_SIZE / 2}
          cy={CHART_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={RADIUS * 0.6}
          strokeDasharray={`${(endPercentage - startPercentage) / 100 * 2 * Math.PI * RADIUS} ${2 * Math.PI * RADIUS}`}
          strokeDashoffset={-startPercentage / 100 * 2 * Math.PI * RADIUS}
          rotation={-90}
          origin={`${CHART_SIZE / 2}, ${CHART_SIZE / 2}`}
        />
      </G>
    );
  };

  const avgDailyExpense = useMemo(() => {
    const days = 30;
    return financialSummary.totalExpense / days;
  }, [financialSummary.totalExpense]);

  const topCategory = useMemo(() => {
    if (categoryBreakdown.length === 0) return null;
    return categoryBreakdown[0];
  }, [categoryBreakdown]);

  const [aiInsights, setAiInsights] = useState<{ type: 'warning' | 'success' | 'info'; text: string }[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    const generateInsights = async () => {
      if (categoryBreakdown.length === 0) {
        setAiInsights([]);
        setIsLoadingInsights(false);
        return;
      }

      setIsLoadingInsights(true);
      
      const timeoutId = setTimeout(() => {
        console.error('[Analytics] AI insights timeout');
        setAiInsights([{
          type: 'info',
          text: t('aiAnalysisFailed')
        }]);
        setIsLoadingInsights(false);
      }, 15000);

      try {
        const categoriesData = categoryBreakdown.map(c => ({
          category: t(c.category),
          percentage: c.percentage.toFixed(1)
        }));

        const languageInstruction = settings.language === 'uz' ? 
          'Javoblarni o\'zbek tilida bering.' : 
          settings.language === 'ru' ? 
          'Отвечайте на русском языке.' : 
          'Respond in English.';

        const prompt = `You are a financial advisor AI. Analyze spending data and provide 3 SHORT insights (MAX 8-10 words each).

Spending:
${categoriesData.map(c => `${c.category}: ${c.percentage}%`).join(', ')}

Provide exactly 3 insights as JSON:
[{"type": "warning|success|info", "text": "very short insight"}]

Rules:
- Use "warning" if >30% in one category
- Use "success" if balanced spending
- Use "info" for neutral facts
- MAX 8-10 words per insight
- Be direct and specific
- ${languageInstruction}
- Respond ONLY with valid JSON array`;

        console.log('[Analytics] Starting AI insights generation...');
        const response = await generateText(prompt);
        console.log('[Analytics] AI response received:', response);
        
        clearTimeout(timeoutId);
        
        const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const insights = JSON.parse(cleanResponse);
        setAiInsights(insights);
        console.log('[Analytics] AI insights generated successfully');
      } catch (error) {
        console.error('[Analytics] Error generating AI insights:', error);
        clearTimeout(timeoutId);
        setAiInsights([{
          type: 'info',
          text: t('aiAnalysisFailed')
        }]);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    generateInsights();
  }, [categoryBreakdown, settings.language, t]);

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={[styles.statIconBox, { backgroundColor: Colors.light.primary + '20' }]}>
            <PieChart color={Colors.light.primary} size={20} />
          </View>
          <Text style={styles.statBoxLabel}>{t('totalTransactions')}</Text>
          <Text style={styles.statBoxValue}>{transactions.length}</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.statIconBox, { backgroundColor: Colors.light.warning + '20' }]}>
            <BarChart color={Colors.light.warning} size={20} />
          </View>
          <Text style={styles.statBoxLabel}>{t('averageDaily')}</Text>
          <Text style={styles.statBoxValue}>{formatCurrency(avgDailyExpense)}</Text>
        </View>
      </View>

      {topCategory && (
        <View style={styles.topCategoryCard}>
          <Text style={styles.topCategoryLabel}>{t('topCategory')}</Text>
          <View style={styles.topCategoryContent}>
            <View 
              style={[
                styles.topCategoryDot, 
                { backgroundColor: Colors.light.categories[topCategory.category as keyof typeof Colors.light.categories] }
              ]} 
            />
            <Text style={styles.topCategoryName}>{t(topCategory.category)}</Text>
            <Text style={styles.topCategoryAmount}>{formatCurrency(topCategory.amount)}</Text>
          </View>
          <Text style={styles.topCategoryPercentage}>
            {topCategory.percentage.toFixed(1)}% {t('spending').toLowerCase()}
          </Text>
        </View>
      )}

      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>{t('spendingByCategory')}</Text>
        
        {categoryBreakdown.length === 0 ? (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>{t('noExpenseDataYet')}</Text>
            <Text style={styles.emptyChartSubtext}>
              {t('addSomeExpenses')}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.chartContainer}>
              <Svg width={CHART_SIZE} height={CHART_SIZE}>
                {pieChartData.map((item, index) => {
                  const color = Colors.light.categories[item.category as keyof typeof Colors.light.categories] || Colors.light.textSecondary;
                  return (
                    <PieSlice
                      key={index}
                      startPercentage={item.startPercentage}
                      endPercentage={item.endPercentage}
                      color={color}
                    />
                  );
                })}
                <Circle
                  cx={CHART_SIZE / 2}
                  cy={CHART_SIZE / 2}
                  r={RADIUS * 0.5}
                  fill={Colors.light.background}
                />
                <SvgText
                  x={CHART_SIZE / 2}
                  y={CHART_SIZE / 2 - 10}
                  fontSize="20"
                  fontWeight="700"
                  fill={Colors.light.text}
                  textAnchor="middle"
                >
                  {formatCurrency(financialSummary.totalExpense)}
                </SvgText>
                <SvgText
                  x={CHART_SIZE / 2}
                  y={CHART_SIZE / 2 + 15}
                  fontSize="14"
                  fill={Colors.light.textSecondary}
                  textAnchor="middle"
                >
                  {t('totalSpending')}
                </SvgText>
              </Svg>
            </View>

            <View style={styles.legendContainer}>
              {categoryBreakdown.map((item, index) => {
                const color = Colors.light.categories[item.category as keyof typeof Colors.light.categories] || Colors.light.textSecondary;
                return (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color }]} />
                    <Text style={styles.legendLabel}>{t(item.category)}</Text>
                    <Text style={styles.legendValue}>{item.percentage.toFixed(1)}%</Text>
                    <Text style={styles.legendAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      {categoryBreakdown.length > 0 && (
        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>{t('aiInsights')}</Text>
          {isLoadingInsights ? (
            <View style={styles.insightsLoading}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.insightsLoadingText}>{t('aiAnalyzing')}</Text>
            </View>
          ) : (
            <View style={styles.insightsList}>
              {aiInsights.map((insight, index) => {
                const iconColor = insight.type === 'warning' ? Colors.light.warning : 
                                 insight.type === 'success' ? Colors.light.success : 
                                 Colors.light.primary;
                const bgColor = insight.type === 'warning' ? Colors.light.warning + '15' : 
                               insight.type === 'success' ? Colors.light.success + '15' : 
                               Colors.light.primary + '15';
                const Icon = insight.type === 'warning' ? AlertCircle : 
                            insight.type === 'success' ? CheckCircle : 
                            TrendingUp;

                return (
                  <View key={index} style={[styles.insightCard, { backgroundColor: bgColor }]}>
                    <View style={styles.insightIconContainer}>
                      <Icon size={20} color={iconColor} />
                    </View>
                    <Text style={styles.insightText}>{insight.text}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
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
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statBox: {
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
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statBoxLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  topCategoryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  topCategoryLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
    fontWeight: '500' as const,
  },
  topCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topCategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  topCategoryName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
  },
  topCategoryAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.expense,
  },
  topCategoryPercentage: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  chartSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 20,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  legendContainer: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500' as const,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginRight: 12,
    minWidth: 50,
    textAlign: 'right',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
    minWidth: 100,
    textAlign: 'right',
  },
  insightsSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    elevation: 2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  insightsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  insightsLoadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  insightIconContainer: {
    paddingTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
});

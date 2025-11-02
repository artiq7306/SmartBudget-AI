import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { getTranslation } from '@/constants/translations';
import Colors from '@/constants/colors';
import { Send, Bot, User } from 'lucide-react-native';
import { useRorkAgent, createRorkTool } from '@rork/toolkit-sdk';
import { z } from 'zod';

export default function AIAssistantScreen() {
  const { financialSummary, categoryBreakdown, settings } = useBudget();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const t = (key: keyof typeof import('@/constants/translations').translations.en) => 
    getTranslation(settings.language, key);

  const { messages, sendMessage, error } = useRorkAgent({
    tools: {
      getFinancialSummary: createRorkTool({
        description: 'Get current financial summary including balance, income, expense, and savings rate',
        zodSchema: z.object({}),
        execute() {
          return JSON.stringify(financialSummary);
        },
      }),
      getCategoryBreakdown: createRorkTool({
        description: 'Get spending breakdown by category',
        zodSchema: z.object({}),
        execute() {
          return JSON.stringify(categoryBreakdown);
        },
      }),
    },
  });

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    const message = input;
    console.log('[AI Assistant] Sending message:', message);
    setInput('');
    setIsSending(true);
    
    try {
      await sendMessage(message);
      console.log('[AI Assistant] Message sent successfully');
    } catch (err) {
      console.error('[AI Assistant] Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${settings.currency}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Bot color={Colors.light.primary} size={24} />
        </View>
        <View>
          <Text style={styles.headerTitle}>{t('ai')}</Text>
          <Text style={styles.headerSubtitle}>{t('yourFinancialAdvisor')}</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>{t('aiGreeting')}</Text>
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>{t('balance')}</Text>
              <Text style={[styles.quickStatValue, { color: financialSummary.balance >= 0 ? Colors.light.income : Colors.light.expense }]}>
                {formatCurrency(financialSummary.balance)}
              </Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>{t('savingsRate')}</Text>
              <Text style={[styles.quickStatValue, { color: Colors.light.primary }]}>
                {financialSummary.savingsRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageCard,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            <View style={styles.messageHeader}>
              <View style={[
                styles.messageIcon,
                message.role === 'user' ? styles.userIcon : styles.assistantIcon
              ]}>
                {message.role === 'user' ? (
                  <User color="#FFFFFF" size={16} />
                ) : (
                  <Bot color="#FFFFFF" size={16} />
                )}
              </View>
              <Text style={styles.messageRole}>
                {message.role === 'user' ? t('you') : t('ai')}
              </Text>
            </View>
            {message.parts.map((part, i) => {
              switch (part.type) {
                case 'text':
                  return (
                    <Text key={`${message.id}-${i}`} style={styles.messageText}>
                      {part.text}
                    </Text>
                  );
                case 'tool':
                  return (
                    <View key={`${message.id}-${i}`} style={styles.toolCall}>
                      <Text style={styles.toolCallText}>
                        {part.state === 'output-available' 
                          ? `✓ ${part.toolName}` 
                          : `⋯ ${part.toolName}...`}
                      </Text>
                    </View>
                  );
              }
            })}
          </View>
        ))}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>Error: {error.message || 'Something went wrong'}</Text>
          </View>
        )}

        {isSending && (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>{t('aiAnalyzing')}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t('askAI')}
          placeholderTextColor={Colors.light.textLight}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isSending}
        >
          <Send 
            color={input.trim() ? Colors.light.primary : Colors.light.textLight} 
            size={20} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStat: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 12,
  },
  quickStatLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  messageCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: Colors.light.primary + '15',
    marginLeft: 40,
  },
  assistantMessage: {
    backgroundColor: Colors.light.surface,
    marginRight: 40,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userIcon: {
    backgroundColor: Colors.light.primary,
  },
  assistantIcon: {
    backgroundColor: Colors.light.secondary,
  },
  messageRole: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  messageText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  toolCall: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  toolCallText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic' as const,
  },
  errorCard: {
    backgroundColor: Colors.light.danger + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.danger,
  },
  loadingCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: 'italic' as const,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 12,
    marginRight: 12,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

import { Tabs } from "expo-router";
import { LayoutDashboard, BarChart3, Bot, Settings } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";
import { useBudget } from "@/contexts/BudgetContext";
import { getTranslation } from "@/constants/translations";

export default function TabLayout() {
  const { settings } = useBudget();
  const t = (key: keyof typeof import('@/constants/translations').translations.en) => 
    getTranslation(settings.language, key);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.light.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: Colors.light.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.light.border,
        },
        headerTitleStyle: {
          fontWeight: '700' as const,
          fontSize: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t('analytics'),
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: t('ai'),
          tabBarIcon: ({ color }) => <Bot color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

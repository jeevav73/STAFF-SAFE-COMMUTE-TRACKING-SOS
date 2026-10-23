import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export const stackOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: colors.background },
  // No transition animation: nothing may delay reaching SOS or Stop Sharing.
  animation: 'none',
};

const tabGlyphs: Record<string, string> = {
  Dashboard: '▦',
  Journeys: '↗',
  Alerts: '!',
  Staff: '♙',
  More: '•••',
  Home: '⌂',
  History: '◷',
  Settings: '⚙',
};

type TabIconProps = Parameters<NonNullable<BottomTabNavigationOptions['tabBarIcon']>>[0] & {
  routeName: string;
};

function TabGlyph({ routeName, color, focused, size }: TabIconProps) {
  return React.createElement(
    View,
    { style: [styles.icon, focused && styles.iconFocused] },
    React.createElement(
      Text,
      { style: { color, fontSize: size, lineHeight: size + 2, fontWeight: '700' } },
      tabGlyphs[routeName] ?? '•',
    ),
  );
}

export function tabIcon(routeName: string): NonNullable<BottomTabNavigationOptions['tabBarIcon']> {
  return function renderTabIcon({ color, focused, size }) {
    return React.createElement(TabGlyph, { routeName, color, focused, size });
  };
}

export function tabOptions(bottomInset: number): BottomTabNavigationOptions {
  return {
    headerStyle: { backgroundColor: colors.navy },
    headerTintColor: '#FFFFFF',
    tabBarActiveTintColor: colors.navy,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    tabBarStyle: {
      height: 62 + bottomInset,
      paddingTop: 5,
      paddingBottom: Math.max(bottomInset, 6),
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      elevation: 12,
      shadowColor: '#0B1730',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: -2 },
    },
    tabBarItemStyle: { paddingVertical: 1 },
    tabBarHideOnKeyboard: true,
  };
}

const styles = StyleSheet.create({
  icon: {
    minWidth: 34,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFocused: { backgroundColor: colors.navyLight },
});

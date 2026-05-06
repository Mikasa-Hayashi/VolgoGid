import { getAllRoutes } from '@/src/db/routeRepository';
import { getSelectedCityId } from '@/src/storage/citySelection';
import { headerStyles } from '@/src/theme/headerStyles';
import { useTheme } from '@/src/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RoutesHeader = ({ onSettings, colors, t }: { onSettings(): void; colors: any; t: any }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      <View style={headerStyles.iconButton} />

      <Text style={[headerStyles.headerTitle, { color: colors.text }]}>{t('menu.routes')}</Text>

      <TouchableOpacity onPress={onSettings} style={headerStyles.iconButton}>
        <Ionicons name="settings-outline" size={28} color={colors.text} />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const RouteRow = ({
  coverImageUrl,
  title,
  onPress,
  colors,
}: {
  coverImageUrl: string;
  title: string;
  onPress: () => void;
  colors: any;
}) => (
  <TouchableOpacity
    style={[styles.routeRow, { backgroundColor: colors.card }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Image source={{ uri: coverImageUrl }} style={styles.routeRowImage} />
    <View style={styles.routeRowTextWrap}>
      <Text style={[styles.routeRowTitle, { color: colors.text }]} numberOfLines={2}>
        {title}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
  </TouchableOpacity>
);

export default function RoutesTabScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  useScrollToTop(scrollRef);

  const routes = useMemo(
    () => getAllRoutes(i18n.language, selectedCityId),
    [i18n.language, selectedCityId],
  );

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => setSelectedCityId(await getSelectedCityId());
      load();
    }, []),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RoutesHeader onSettings={() => router.push('/settings')} colors={colors} t={t} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listWrap}>
          {routes.map((route) => (
            <RouteRow
              key={route.id}
              coverImageUrl={route.coverImageUrl}
              title={route.name}
              onPress={() => router.push({ pathname: '/route-info', params: { id: route.id } })}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  listWrap: { paddingHorizontal: 20, paddingTop: 16 },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    minHeight: 88,
  },
  routeRowImage: {
    width: 100,
    height: 88,
  },
  routeRowTextWrap: {
    flex: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  routeRowTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
});

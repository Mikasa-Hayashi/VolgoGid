import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext'; // Импортируем хук для темы
import { headerStyles } from '@/src/theme/headerStyles';
import { cleanPath } from 'expo-router/build/fork/getStateFromPath-forks';
import { useTranslation } from "react-i18next";
import { monumentData } from '@/src/store/monumentStore';

// --- Types ---
type MenuHeaderProps = {
  onBack: () => void;
  onSettings: () => void;
  colors: any;
};

type Monument = typeof monumentData[0];

// --- Component 1: Header ---
const MenuHeader = ({ onBack, onSettings, colors }: { onBack(): void; onSettings(): void; colors: any }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}>
      {/* Левая кнопка */}
      <TouchableOpacity onPress={onBack} style={headerStyles.iconButton}>
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </TouchableOpacity>

      {/* Текст посередние */}
      <Text style={[headerStyles.headerTitle, { color: colors.text }]}>
        Scan<Text style={{ color: colors.primary }}>App</Text>
      </Text>

      {/* Правая кнопка */}
      <TouchableOpacity onPress={onSettings} style={headerStyles.iconButton}>
        <Ionicons name="settings-outline" size={28} color={colors.text} />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

// --- Component 2: Search Bar ---
const SearchBar = ({ value, onChange, colors, t }: { value: string; onChange: (text: string) => void; colors: any; t: any }) => (
  <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
    <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
    <TextInput
      style={[styles.searchInput, { color: colors.text }]}
      placeholder={t("menu.searchPlaceholder")}
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChange}
      returnKeyType="done"
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChange('')} style={styles.clearButton}>
        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    )}
  </View>
);

// --- Component 3: Monument Card ---
const MonumentCard = ({ item, onPress, colors, t }: { item: Monument; onPress: () => void; colors: any; t: any }) => (
  <TouchableOpacity style={[styles.cardContainer, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.8}>
    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
    <View style={styles.cardOverlay}>
      <View style={styles.badgeContainer}>
        <Text style={[styles.badgeText, { color: colors.primary }]}>#{item.id}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{t(`monuments_data.${item.id}.name`)}</Text>
    </View>
  </TouchableOpacity>
);

// --- Component 4: Empty State ---
const EmptyState = ({ searchQuery, t, colors }: { searchQuery: string; t: any; colors: any }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="search-outline" size={60} color={colors.textMuted} />
    <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("menu.notFound")}</Text>
    {/* <Text style={[styles.emptyText, { color: colors.textMuted }]}>
      {t("menu.notFoundMessage", { number: searchQuery })}
    </Text> */}
  </View>
);

// --- MAIN SCREEN ---
export default function MonumentsScreen() {
  const { t } = useTranslation();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Логика фильтрации: показываем все, если поиск пуст, иначе ищем совпадение по ID
  // const filteredMonuments = monumentsList.filter(monument => 
  //   monument.id.includes(searchQuery.trim())
  // );
  const filteredMonuments = monumentData.filter(monument => {
    const query = searchQuery.trim().toLowerCase();
    if (query === '') return true; // пустой поиск – показываем всё

    const idMatch = monument.id.toLowerCase().includes(query);
    // Получаем название через t (оно уже на текущем языке)
    const nameMatch = t(`monuments_data.${monument.id}.name`).toLowerCase().includes(query);

    return idMatch || nameMatch;
  });

  const handleMonumentPress = (monument: Monument) => {
    router.push(`/info?id=${monument.id}`); // Навигация на экран информации о монументе
  };

  const handleBack = () => {
    router.back();
  };

  const handleSettings = () => {
    router.push('/settings');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header & Search */}
      <MenuHeader onBack={handleBack} onSettings={handleSettings} colors={colors} />
      <View style={styles.topSection}>
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          colors={colors}
          t={t}
        />
      </View>

      {/* Monuments Section */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>{t("menu.monuments")}</Text>
        
        <FlatList
          data={filteredMonuments}
          keyExtractor={(item) => item.id}
          numColumns={2} // Делаем красивую сетку из 2 колонок
          contentContainerStyle={styles.flatListContent}
          columnWrapperStyle={styles.rowWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState searchQuery={searchQuery} t={t} colors={colors} />}
          renderItem={({ item }) => (
            <MonumentCard 
              item={item} 
              onPress={() => handleMonumentPress(item)} 
              colors={colors}
              t={t}
            />
          )}
        />
      </View>
    </View>
  );
}

// --- Styles ---
const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
// Вычисляем ширину карточки: половина экрана минус отступы по бокам и между карточками
const CARD_WIDTH = (width - 40 - CARD_MARGIN * 2) / 2; 

const styles = StyleSheet.create({
  container: { flex: 1 },

  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  
  // Header
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContainer: { backgroundColor: 'black', zIndex: 10 },
  headerContent: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  appTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleHighlight: {
    color: '#FFD700', // Желтый акцент
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 5,
  },

  // List & Section
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  flatListContent: {
    paddingBottom: 40, // Отступ снизу для удобного скролла
  },
  rowWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // Card
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3, // Делаем карточку немного вытянутой по вертикали
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // Затемнение, чтобы текст всегда читался
    justifyContent: 'space-between',
    padding: 12,
  },
  badgeContainer: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
});
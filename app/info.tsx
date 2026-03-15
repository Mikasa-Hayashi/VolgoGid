import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { monumentData } from '../src/store/monumentStore'; // Импортируем моковые данные для монумента
import { headerStyles } from '@/src/theme/headerStyles';
import { useTheme } from '../src/theme/ThemeContext'; 
import { useTranslation } from "react-i18next";

// --- Types ---
type TopNavProps = {
  onBack: () => void;
};

type MonumentHeroProps = {
  imageUrl: string;
  name: string;
  location: string;
  monumentId: string;
  colors: any;
};

type InfoTableProps = {
  title: string;
  data: { label: string; value: any }[];
  colors: any;
};

// --- Component 1: Top Navigation ---
const InfoHeader = ({ onBack, onShare, colors }: { onBack(): void; onShare(): void; colors: any }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}> 
      {/* Левая кнопка */}
      <TouchableOpacity onPress={onBack} style={headerStyles.iconButton}>
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </TouchableOpacity>

      {/* Текст посередние */}
      {/* <Text style={[headerStyles.headerTitle, { color: colors.text }]}></Text> */}

      {/* Правая кнопка */}
      {/* <TouchableOpacity onPress={onShare} style={headerStyles.iconButton}>
        <Ionicons name="share" size={28} color={colors.text} />
      </TouchableOpacity> */}
      <View style={{width: 40}}></View>
    </View>
  </SafeAreaView>
);

// --- Component 2: Hero Section (Image + Title + Location) ---
const MonumentHero: React.FC<MonumentHeroProps> = ({ imageUrl, name, location, monumentId, colors }) => (
  <View style={styles.heroContainer}>
    <Image 
      source={{ uri: imageUrl }} 
      style={styles.heroImage} 
      resizeMode="cover" 
    />
    <View style={styles.heroTextOverlay}>
      <View style={styles.badgeContainer}>
        <Text style={[styles.badgeText, { color: 'black' }]}>#{monumentId}</Text>
      </View>
      <Text style={[styles.monumentName, { color: 'white' }]}>{name}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={16} color={colors.primary} />
        <Text style={styles.locationText}>{location}</Text>
      </View>
    </View>
  </View>
);

// --- Component 3: Reusable Info Table ---
const InfoTable: React.FC<InfoTableProps> = ({ title, data, colors }) => (
  <View style={styles.sectionContainer}>
    <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
    <View style={[styles.tableContainer, { backgroundColor: colors.card }]}>
      {data.map((item, index) => (
        <View key={index} style={[
          styles.tableRow, 
          index === data.length - 1 && styles.noBorder,
          { borderBottomColor: colors.border }
        ]}>
          <Text style={[styles.tableLabel, { color: colors.text }]}>{item.label}</Text>
          <Text style={[styles.tableValue, { color: colors.textMuted }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  </View>
);

// --- Component 4: Quick Action Button (Optional but cool for Monuments) ---
const ActionButton = ({ icon, label, onPress, colors }: { icon: any; label: string; onPress: () => void; colors: any }) => (
  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={onPress}>
    <Ionicons name={icon} size={24} color="black" />
    <Text style={styles.actionButtonText}>{label}</Text>
  </TouchableOpacity>
);

// --- Main Screen Component ---
export default function MonumentDetailScreen() {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  const monument = monumentData.find(m => m.id === id) ?? monumentData[0];
  const monumentTranslationPath = `monuments_data.${monument.id}`;


  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    
  };

  const handleAudioGuide = () => {
    console.log("Play Audio Guide");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* 1. Fixed Header */}
      <InfoHeader 
        onBack={handleBack} 
        onShare={handleShare}
        colors={colors}
      />

      {/* 2. Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* Hero Image & Titles */}
        <MonumentHero 
          imageUrl={monument.imageUrl} 
          name={t(`${monumentTranslationPath}.name`)}
          location={t(`${monumentTranslationPath}.location`)}
          monumentId={monument.id}
          colors={colors}
        />

        {/* Action Button (e.g. Audio Guide) */}
        <View style={styles.actionRow}>
          <ActionButton 
            icon="headset" 
            label={t("info.audioGuide")} 
            onPress={handleAudioGuide} 
            colors={colors}
          />
        </View>

        {/* Description Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t("info.historyInfo")}</Text>
          <Text style={[styles.descriptionText, { color: colors.textMuted }]}>
            {t(`${monumentTranslationPath}.description`)}
          </Text>
        </View>

        {/* Fact Tables */}
        <InfoTable
          title={t("info.architectureDetails")}
          data={monument.details.map(item => ({ 
            label: t(item.labelKey), 
            value: item.valueKey ? t(item.valueKey) : item.value 
          }))} 
          colors={colors}
        />
        <InfoTable 
          title={t("info.tourismInfo")}
          data={monument.visitors.map(item => ({ 
            label: t(item.labelKey), 
            value: t(item.valueKey)
          }))} 
          colors={colors}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// --- Styles ---
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Navigation
  // headerContainer: {
  //   backgroundColor: 'transparent',
  //   position: 'absolute', // Делаем хедер плавающим поверх картинки!
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   zIndex: 10,
  // },
  headerContainer: { backgroundColor: 'black', zIndex: 10 },
  headerContent: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  navContent: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    // // Добавим легкую тень, чтобы кнопку было видно на светлых фото
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.8,
    // shadowRadius: 2,
  },

  // Scroll Content
  scrollContent: {
    paddingBottom: 20,
  },

  // Hero Section
  heroContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroImage: {
    width: width,
    height: 380, // Чуть больше, чем у фруктов, для масштаба
  },
  heroTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    // paddingTop: 60, // Больше градиента сверху
    backgroundColor: 'rgba(0,0,0,0.6)', 
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  monumentName: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Action Button
  actionRow: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Sections & Tables
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    // borderBottomColor: '#38383A',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  tableLabel: {
    fontSize: 16,
  },
  tableValue: {
    fontSize: 16,
  },
});
import { monumentData } from '@/src/store/monumentStore';
import { headerStyles } from '@/src/theme/headerStyles';
import { useTheme } from '@/src/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from "react-i18next";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// --- Types ---
type MapMonument = {
  id: string;
  lat: number;
  lon: number;
};

const markers = monumentData
  .filter(m => m.lat && m.lon)
  .map(m => ({ id: m.id, lat: m.lat, lon: m.lon }));

// --- HTML Template for Yandex Maps Web API ---
// Генерируем HTML, вставляя наши маркеры прямо в JS-код внутри WebView
const generateMapHTML = (monuments: MapMonument[]) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: black; }
        #map { width: 100%; height: 100%; }
        
        /* CSS-хак для Dark Mode на Яндекс Картах */
        .dark-mode-map .ymaps-2-1-79-map {
            filter: invert(100%) hue-rotate(180deg) contrast(90%) !important;
        }
        /* Возвращаем нормальные цвета картинкам (маркерам) внутри инвертированной карты */
        .dark-mode-map ymaps[class*="-image"] {
            filter: invert(100%) hue-rotate(180deg) !important;
        }
    </style>
    <script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=" type="text/javascript"></script>
    <script>
        let myMap;

        ymaps.ready(init);

        function init() {
            myMap = new ymaps.Map("map", {
                center: [48.7423, 44.5370], // Родина Мать
                zoom: 12,
                // controls: [] // Убираем дефолтные зумы и кнопки Яндекса
            });

            // Добавляем класс для темной темы
            document.getElementById('map').classList.add('dark-mode-map');

            const monumentsData = ${JSON.stringify(monuments)};

            monumentsData.forEach(monument => {
                const placemark = new ymaps.Placemark([monument.lat, monument.lon], {
                    hintContent: monument.name
                }, {
                    preset: 'islands#yellowIcon' // Желтая иконка под наш дизайн
                });

                // Обработчик клика по маркеру
                placemark.events.add('click', function () {
                    // Центрируем карту при клике
                    myMap.setCenter([monument.lat, monument.lon], 15, { checkZoomRange: true, duration: 500 });
                    
                    // Отправляем сообщение в React Native!
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'MARKER_CLICK',
                        id: monument.id
                    }));
                });

                myMap.geoObjects.add(placemark);
            });
        }

        // Функция, которую мы будем вызывать из React Native для переключения слоев
        function toggleLayer(isSatellite) {
            if (myMap) {
                myMap.setType(isSatellite ? 'yandex#hybrid' : 'yandex#map');
                // Убираем фильтр темной темы на спутнике, так как спутник и так темный
                if (isSatellite) {
                    document.getElementById('map').classList.remove('dark-mode-map');
                } else {
                    document.getElementById('map').classList.add('dark-mode-map');
                }
            }
        }
    </script>
</head>
<body>
    <div id="map"></div>
</body>
</html>
`;

// --- UI Components ---
const MapHeader = ({ onMenu, onCamera, colors, t }: { onMenu(): void; onCamera(): void; colors: any; t: any }) => (
  <SafeAreaView edges={['top']} style={[headerStyles.headerContainer, { backgroundColor: colors.background }]}>
    <View style={headerStyles.headerContent}> 
      {/* Левая кнопка */}
      <TouchableOpacity onPress={onMenu} style={headerStyles.iconButton}>
        <Ionicons name="menu" size={28} color={colors.text} />
      </TouchableOpacity>

      {/* Текст посередние */}
      <Text style={[headerStyles.headerTitle, { color: colors.text }]}>{t("map.title")}</Text>

      {/* Правая кнопка */}
      <TouchableOpacity onPress={onCamera} style={headerStyles.iconButton}>
        <Ionicons name="camera" size={28} color={colors.primary} />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);


const MonumentPreviewCard = ({ monument, onClose, onDetails, t, colors }: { monument: any, onClose: () => void; onDetails: () => void; t: any; colors: any }) => (
  <View style={[styles.previewCardContainer, { 'backgroundColor': colors.card }]}>
    <TouchableOpacity style={[styles.closePreviewButton, { 'backgroundColor': colors.card }]} onPress={onClose}>
      <Ionicons name="close-circle" size={24} color="#A0A0A0" />
    </TouchableOpacity>
    <Image source={{ uri: monument.imageUrl }} style={styles.previewImage} />
    <View style={styles.previewInfo}>
      <View>
        <Text style={[styles.previewId, { color: colors.primary }]}>#{monument.id}</Text>
        <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
          {t(`monuments_data.${monument.id}.name`)}
        </Text>
      </View>
      <TouchableOpacity style={[styles.detailsButton, { backgroundColor: colors.primary }]} onPress={onDetails}>
        <Text style={styles.detailsButtonText}>{t("map.details")}</Text>
        <Ionicons name="arrow-forward" size={16} color="black" />
      </TouchableOpacity>
    </View>
  </View>
);

// --- Main Screen ---
export default function MapScreen() {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const webviewRef = useRef<WebView>(null);
  const [selectedMonument, setSelectedMonument] = useState<MapMonument | null>(null);
  
  // В вебе вместо 3D мы делаем переключатель "Схема / Спутник"
  const [isSatelliteMode, setIsSatelliteMode] = useState(false);

  // Обработка сообщений из WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MARKER_CLICK') {
        const monument = monumentData.find(m => m.id === data.id);
        if (monument) setSelectedMonument(monument);
      }
    } catch (e) {
      console.log('Error parsing WebView message', e);
    }
  };

  const toggleSatelliteMode = () => {
    const newMode = !isSatelliteMode;
    setIsSatelliteMode(newMode);
    // Выполняем JS-код внутри загруженной страницы WebView
    webviewRef.current?.injectJavaScript(`toggleLayer(${newMode}); true;`);
  };

  const handleOpenMenu = () => {
    router.push('/menu');
  };

  const handleOpenCamera = () => {
    router.replace('/camera');
  }

  const handleOnDetails = () => {
    router.push(`/info?id=${selectedMonument?.id}`);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <MapHeader 
        onMenu={handleOpenMenu} 
        onCamera={handleOpenCamera} 
        colors={colors}
        t={t}
      />

      <View style={styles.mapWrapper}>
        <WebView
          ref={webviewRef}
          source={{ html: generateMapHTML(markers) }}
          style={styles.map}
          onMessage={handleWebViewMessage}
          scrollEnabled={false} // Отключаем скролл WebView, чтобы карта свайпалась корректно
          bounces={false}
        />

        {/* Floating Satellite/Map Toggle Control */}
        {/* <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleSatelliteMode}>
            <Ionicons 
              name={isSatelliteMode ? "map" : "earth"} 
              size={24} 
              color={isSatelliteMode ? "white" : "#FFD700"} 
            />
          </TouchableOpacity>
        </View> */}

        {/* Preview Card */}
        {selectedMonument && (
          <MonumentPreviewCard 
            monument={selectedMonument} 
            onClose={() => setSelectedMonument(null)}
            onDetails={handleOnDetails}
            t={t}
            colors={colors}
          />
        )}
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  headerContainer: { backgroundColor: 'black', zIndex: 10 },
  headerContent: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  mapWrapper: { flex: 1, position: 'relative' },
  map: { flex: 1, backgroundColor: 'black' },
  controlsContainer: { position: 'absolute', right: 15, top: 20, gap: 10 },
  controlButton: { width: 48, height: 48, backgroundColor: '#1C1C1E', borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 },
  previewCardContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 10 },
  closePreviewButton: { position: 'absolute', top: -10, right: -10, borderRadius: 15, zIndex: 10 },
  previewImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#333' },
  previewInfo: { flex: 1, marginLeft: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewId: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  previewTitle: { fontSize: 18, fontWeight: '700', maxWidth: 120 },
  detailsButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  detailsButtonText: { color: 'black', fontWeight: 'bold', fontSize: 14 },
});
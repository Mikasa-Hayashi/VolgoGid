/**
 * monumentRepository.ts
 * Заменяет старый monumentStore.ts.
 * Все запросы к SQLite, API такой же как был — компоненты почти не меняются.
 */

import { db } from './database';

// ─── Типы (совместимы со старым monumentStore) ────────────────────────────────

export type FieldConfigRow = {
  labelKey: string;
  value: string | null;  // готовое значение (уже переведённое или static)
};

export type Monument = {
  id: string;
  lat: number;
  lon: number;
  imageUrl: string;
  name: string;
  location: string;
  description: string;
  details: FieldConfigRow[];
  visitors: FieldConfigRow[];
};

export type MonumentPreview = {
  id: string;
  lat: number;
  lon: number;
  imageUrl: string;
  name: string;
};

// ─── Запросы ──────────────────────────────────────────────────────────────────

/** Все памятники для списка/карты (без тяжёлых полей) */
export function getAllMonumentPreviews(lang: string): MonumentPreview[] {
  const rows = db.getAllSync<{
    id: string; lat: number; lon: number; image_url: string; field_value: string;
  }>(
    `SELECT m.id, m.lat, m.lon, m.image_url, mt.field_value
     FROM monuments m
     LEFT JOIN monument_translations mt
       ON mt.monument_id = m.id AND mt.lang = ? AND mt.field_key = 'name'
     ORDER BY m.sort_order`,
    [lang]
  );

  return rows.map(r => ({
    id: r.id,
    lat: r.lat,
    lon: r.lon,
    imageUrl: r.image_url,
    name: r.field_value ?? '',
  }));
}

/** Один памятник со всеми полями */
export function getMonumentById(id: string, lang: string): Monument | null {
  const base = db.getFirstSync<{ id: string; lat: number; lon: number; image_url: string }>(
    `SELECT id, lat, lon, image_url FROM monuments WHERE id = ?`,
    [id]
  );
  if (!base) return null;

  // Все переводы для этого памятника и языка в виде Map
  const translationRows = db.getAllSync<{ field_key: string; field_value: string }>(
    `SELECT field_key, field_value
     FROM monument_translations
     WHERE monument_id = ? AND lang = ?`,
    [id, lang]
  );
  const translations = new Map(translationRows.map(r => [r.field_key, r.field_value]));

  // Конфигурация полей
  const fieldConfigs = db.getAllSync<{
    section: string; label_key: string; field_key: string | null; static_value: string | null;
  }>(
    `SELECT section, label_key, field_key, static_value
     FROM monument_field_config
     WHERE monument_id = ?
     ORDER BY section, order_index`,
    [id]
  );

  const details: FieldConfigRow[] = [];
  const visitors: FieldConfigRow[] = [];

  for (const fc of fieldConfigs) {
    const value = fc.static_value ?? (fc.field_key ? translations.get(fc.field_key) ?? null : null);
    const row: FieldConfigRow = { labelKey: fc.label_key, value };
    if (fc.section === 'details') details.push(row);
    else visitors.push(row);
  }

  return {
    id: base.id,
    lat: base.lat,
    lon: base.lon,
    imageUrl: base.image_url,
    name: translations.get('name') ?? '',
    location: translations.get('location') ?? '',
    description: translations.get('description') ?? '',
    details,
    visitors,
  };
}

/** Координаты памятника (для маршрутов, без перевода) */
export function getMonumentCoords(id: string): { lat: number; lon: number } | null {
  return db.getFirstSync<{ lat: number; lon: number }>(
    `SELECT lat, lon FROM monuments WHERE id = ?`,
    [id]
  ) ?? null;
}

/** Поиск памятников по имени */
export function searchMonuments(query: string, lang: string): MonumentPreview[] {
  const rows = db.getAllSync<{
    id: string; lat: number; lon: number; image_url: string; field_value: string;
  }>(
    `SELECT m.id, m.lat, m.lon, m.image_url, mt.field_value
     FROM monuments m
     JOIN monument_translations mt
       ON mt.monument_id = m.id AND mt.lang = ? AND mt.field_key = 'name'
     WHERE mt.field_value LIKE ?
     ORDER BY m.sort_order`,
    [lang, `%${query}%`]
  );

  return rows.map(r => ({
    id: r.id,
    lat: r.lat,
    lon: r.lon,
    imageUrl: r.image_url,
    name: r.field_value,
  }));
}

/** Ближайшие памятники к точке (GPS-поиск, офлайн) */
export function getNearbyMonuments(
  lat: number,
  lon: number,
  radiusKm: number,
  lang: string
): (MonumentPreview & { distanceKm: number })[] {
  // Формула Хаверсина прямо в SQL (приближённая, достаточна для малых расстояний)
  const rows = db.getAllSync<{
    id: string; lat: number; lon: number; image_url: string; field_value: string;
  }>(
    `SELECT m.id, m.lat, m.lon, m.image_url, mt.field_value
     FROM monuments m
     LEFT JOIN monument_translations mt
       ON mt.monument_id = m.id AND mt.lang = ? AND mt.field_key = 'name'
     ORDER BY m.sort_order`,
    [lang]
  );

  const R = 6371; // радиус Земли в км
  return rows
    .map(r => {
      const dLat = ((r.lat - lat) * Math.PI) / 180;
      const dLon = ((r.lon - lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((r.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { id: r.id, lat: r.lat, lon: r.lon, imageUrl: r.image_url, name: r.field_value ?? '', distanceKm };
    })
    .filter(r => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

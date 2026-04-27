/**
 * routeRepository.ts — заменяет старый routeStore.ts
 */

import { db } from './database';
import { getMonumentCoords } from './monumentRepository';

// ─── Типы ────────────────────────────────────────────────────────────────────

export type RoutePreview = {
  id: string;
  coverMonumentId: string;
  name: string;
  description: string;
  stopCount: number;
  coverImageUrl: string;
};

export type RouteStop = {
  id: string;
  name: string;
};

export type RouteDetail = RoutePreview & {
  monumentIds: string[];      // порядковый список ID остановок
  stops: RouteStop[];         // ID + имя (для отображения в route-info)
};

export type ResolvedMapPoint = {
  id: string;
  lat: number;
  lon: number;
  name: string;
};

// ─── Вспомогательная: одна строка перевода маршрута ──────────────────────────

function fetchRouteTranslation(
  routeId: string,
  lang: string,
): { name: string; description: string } | null {
  const row = db.getFirstSync<{ name: string; description: string }>(
    `SELECT name, description FROM route_translations WHERE route_id = ? AND lang = ?`,
    [routeId, lang],
  );
  // Фолбэк на ru, если перевод отсутствует
  if (!row) {
    return (
      db.getFirstSync<{ name: string; description: string }>(
        `SELECT name, description FROM route_translations WHERE route_id = ? AND lang = 'ru'`,
        [routeId],
      ) ?? null
    );
  }
  return row;
}

// ─── Запросы ──────────────────────────────────────────────────────────────────

/** Все маршруты для списка (menu.tsx) */
export function getAllRoutes(lang: string): RoutePreview[] {
  const rows = db.getAllSync<{
    id: string;
    cover_monument_id: string;
    image_url: string;
  }>(
    `SELECT r.id, r.cover_monument_id, m.image_url
     FROM routes r
     LEFT JOIN monuments m ON m.id = r.cover_monument_id
     ORDER BY r.sort_order`,
  );

  return rows.map((r) => {
    const tr = fetchRouteTranslation(r.id, lang);
    const stopCount =
      db.getFirstSync<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM route_stops WHERE route_id = ?`,
        [r.id],
      )?.cnt ?? 0;

    return {
      id: r.id,
      coverMonumentId: r.cover_monument_id,
      name: tr?.name ?? '',
      description: tr?.description ?? '',
      stopCount,
      coverImageUrl: r.image_url ?? '',
    };
  });
}

/** Один маршрут со всеми остановками (route-info.tsx) */
export function getRouteById(id: string, lang: string): RouteDetail | null {
  const base = db.getFirstSync<{
    id: string;
    cover_monument_id: string;
    image_url: string;
  }>(
    `SELECT r.id, r.cover_monument_id, m.image_url
     FROM routes r
     LEFT JOIN monuments m ON m.id = r.cover_monument_id
     WHERE r.id = ?`,
    [id],
  );
  if (!base) return null;

  const tr = fetchRouteTranslation(id, lang);

  const stopRows = db.getAllSync<{ monument_id: string }>(
    `SELECT monument_id FROM route_stops WHERE route_id = ? ORDER BY order_index`,
    [id],
  );

  const stops: RouteStop[] = stopRows.map((s) => {
    const nameRow = db.getFirstSync<{ field_value: string }>(
      `SELECT field_value FROM monument_translations
       WHERE monument_id = ? AND lang = ? AND field_key = 'name'`,
      [s.monument_id, lang],
    );
    return { id: s.monument_id, name: nameRow?.field_value ?? '' };
  });

  const stopCount =
    db.getFirstSync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM route_stops WHERE route_id = ?`,
      [id],
    )?.cnt ?? 0;

  return {
    id: base.id,
    coverMonumentId: base.cover_monument_id,
    coverImageUrl: base.image_url ?? '',
    name: tr?.name ?? '',
    description: tr?.description ?? '',
    stopCount,
    monumentIds: stopRows.map((s) => s.monument_id),
    stops,
  };
}

/** Остановки маршрута с координатами (index.tsx — карта) */
export function getResolvedRouteMapPoints(
  routeId: string,
  lang: string,
): ResolvedMapPoint[] {
  const stops = db.getAllSync<{ monument_id: string }>(
    `SELECT monument_id FROM route_stops WHERE route_id = ? ORDER BY order_index`,
    [routeId],
  );

  const result: ResolvedMapPoint[] = [];
  for (const stop of stops) {
    const coords = getMonumentCoords(stop.monument_id);
    if (!coords) continue;

    const nameRow = db.getFirstSync<{ field_value: string }>(
      `SELECT field_value FROM monument_translations
       WHERE monument_id = ? AND lang = ? AND field_key = 'name'`,
      [stop.monument_id, lang],
    );

    result.push({
      id: stop.monument_id,
      lat: coords.lat,
      lon: coords.lon,
      name: nameRow?.field_value ?? '',
    });
  }
  return result;
}

/** Ссылка на Яндекс.Карты с маршрутом */
export function buildYandexRouteUrl(routeId: string): string {
  const stops = db.getAllSync<{ monument_id: string }>(
    `SELECT monument_id FROM route_stops WHERE route_id = ? ORDER BY order_index`,
    [routeId],
  );

  const parts: string[] = [];
  for (const stop of stops) {
    const coords = getMonumentCoords(stop.monument_id);
    if (coords) parts.push(`${coords.lat},${coords.lon}`);
  }

  if (parts.length === 0) return 'https://yandex.ru/maps/';
  if (parts.length === 1) {
    const [lat, lon] = parts[0].split(',');
    return `https://yandex.ru/maps/?pt=${lon},${lat}&z=14&l=map`;
  }
  return `https://yandex.ru/maps/?rtext=${parts.join('~')}&rtt=auto`;
}

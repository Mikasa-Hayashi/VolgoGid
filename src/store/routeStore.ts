import { monumentData } from './monumentStore';

export type RouteItem = {
  id: string;
  coverMonumentId: string;
  /**
   * ID памятников из monumentData или ключей из routeWaypoints (например panikaha).
   */
  monumentIds: string[];
};

/** Дополнительные точки маршрута (не из списка памятников), при необходимости. */
export const routeWaypoints: Record<string, { lat: number; lon: number; nameKey: string }> = {};

export const routeData: RouteItem[] = [
  {
    id: 'center',
    coverMonumentId: '1',
    monumentIds: ['1', '5', '6'],
  },
  {
    id: 'history',
    coverMonumentId: '2',
    monumentIds: ['2', '3', '4'],
  },
  {
    id: 'poetic',
    coverMonumentId: '5',
    monumentIds: ['2', '5', '3'],
  },
];

export function getCoordinatesForRoutePoint(pointId: string): { lat: number; lon: number } | null {
  const w = routeWaypoints[pointId];
  if (w) return { lat: w.lat, lon: w.lon };
  const m = monumentData.find((x) => x.id === pointId);
  if (m) return { lat: m.lat, lon: m.lon };
  return null;
}

/** Локализованное название остановки (памятник или доп. точка). */
export function getRouteStopTitle(pointId: string, t: (key: string) => string): string {
  const w = routeWaypoints[pointId];
  if (w) return t(w.nameKey);
  return t(`monuments_data.${pointId}.name`);
}

export type ResolvedMapPoint = {
  id: string;
  lat: number;
  lon: number;
  name: string;
};

export function getResolvedRouteMapPoints(route: RouteItem, t: (key: string) => string): ResolvedMapPoint[] {
  const out: ResolvedMapPoint[] = [];
  for (const pid of route.monumentIds) {
    const coords = getCoordinatesForRoutePoint(pid);
    if (!coords) continue;
    out.push({
      id: pid,
      lat: coords.lat,
      lon: coords.lon,
      name: getRouteStopTitle(pid, t),
    });
  }
  return out;
}

/** Ссылка на Яндекс.Карты с маршрутом по тем же точкам (внешнее приложение). */
export function buildYandexRouteUrl(monumentIds: string[]): string {
  const parts: string[] = [];
  for (const id of monumentIds) {
    const c = getCoordinatesForRoutePoint(id);
    if (c) parts.push(`${c.lat},${c.lon}`);
  }
  if (parts.length === 0) return 'https://yandex.ru/maps/';
  if (parts.length === 1) {
    const [lat, lon] = parts[0].split(',');
    return `https://yandex.ru/maps/?pt=${lon},${lat}&z=14&l=map`;
  }
  return `https://yandex.ru/maps/?rtext=${parts.join('~')}&rtt=auto`;
}

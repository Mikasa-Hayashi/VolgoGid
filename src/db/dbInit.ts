/**
 * dbInit.ts
 * Вызови эту функцию ОДИН РАЗ при старте приложения (например в App.tsx).
 *
 * Пример использования в App.tsx:
 *
 *   import { setupDatabase } from './db/dbInit';
 *
 *   export default function App() {
 *     useEffect(() => {
 *       setupDatabase();
 *     }, []);
 *     ...
 *   }
 */

import { initDatabase, isSeeded, migrateMonumentsCityColumn, migrateMonumentsFilterColumns } from './database';
import { syncMonumentFilterMetadata } from './monumentRepository';
import { seedDatabase, syncCitiesAndMonumentCityIds } from './seed';

export function setupDatabase(): void {
  // 1. Создаём таблицы (если нет)
  initDatabase();
  migrateMonumentsCityColumn();
  migrateMonumentsFilterColumns();

  // 2. Заливаем начальные данные (только при первом запуске)
  if (!isSeeded()) {
    console.log('[DB] First launch — seeding database...');
    seedDatabase();
    console.log('[DB] Seed complete.');
  } else {
    console.log('[DB] Database already seeded.');
  }

  syncMonumentFilterMetadata();
  syncCitiesAndMonumentCityIds();
}


/**
 * СТРУКТУРА ФАЙЛОВ:
 *
 * src/
 * ├── db/
 * │   ├── database.ts          ← схема и открытие БД
 * │   ├── seed.ts              ← начальные данные (сюда добавляешь новые памятники)
 * │   ├── monumentRepository.ts← запросы к памятникам
 * │   ├── routeRepository.ts   ← запросы к маршрутам
 * │   └── dbInit.ts            ← точка входа (вызов при старте)
 * │
 * ├── locales/                 ← i18n JSON файлы (ТОЛЬКО UI-строки, без monuments_data)
 * │   ├── ru.json
 * │   ├── en.json
 * │   ├── ar.json
 * │   └── zh.json
 * │
 * └── App.tsx
 *
 *
 * ЧТО УДАЛИТЬ ИЗ JSON ФАЙЛОВ:
 * - "monuments_data": { ... }   → теперь в seed.ts
 * - "routes_data": { ... }      → теперь в seed.ts
 *
 * ЧТО ОСТАВИТЬ В JSON ФАЙЛАХ:
 * - "settings": { ... }
 * - "info": { ... }
 * - "menu": { ... }
 * - "route_info": { ... }
 * - "map": { ... }
 * - "monument_fields": { ... }  ← лейблы полей остаются здесь!
 *
 *
 * КАК ДОБАВИТЬ НОВЫЙ ПАМЯТНИК:
 * Просто добавь новый объект в массив monumentSeedData в seed.ts.
 * При следующем запуске на свежем устройстве он появится автоматически.
 *
 * Для обновления на уже установленных устройствах — позже добавим
 * механизм синхронизации с бэкендом (FastAPI + /updates endpoint).
 *
 *
 * УСТАНОВКА ЗАВИСИМОСТИ:
 * npx expo install expo-sqlite
 */

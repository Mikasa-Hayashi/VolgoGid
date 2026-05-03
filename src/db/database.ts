/**
 * database.ts
 * Открывает БД и создаёт таблицы при первом запуске.
 *
 * Установка: npx expo install expo-sqlite
 */

import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('volgogid.db');

export function initDatabase(): void {
  db.execSync(`PRAGMA journal_mode = WAL;`);

  db.execSync(`
    -- Основная таблица памятников (структура, не переводы)
    CREATE TABLE IF NOT EXISTS monuments (
      id         TEXT PRIMARY KEY,
      lat        REAL NOT NULL,
      lon        REAL NOT NULL,
      image_url  TEXT,
      sort_order INTEGER DEFAULT 0
    );

    -- Переводы памятников: одна строка = один язык одного памятника
    -- Поля хранятся как пары ключ-значение для гибкости при добавлении новых полей
    CREATE TABLE IF NOT EXISTS monument_translations (
      monument_id  TEXT NOT NULL,
      lang         TEXT NOT NULL,
      field_key    TEXT NOT NULL,   -- например: 'name', 'description', 'height', 'architect'
      field_value  TEXT NOT NULL,
      PRIMARY KEY (monument_id, lang, field_key),
      FOREIGN KEY (monument_id) REFERENCES monuments(id)
    );

    -- Конфигурация отображаемых полей (порядок и секция)
    CREATE TABLE IF NOT EXISTS monument_field_config (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      monument_id  TEXT NOT NULL,
      section      TEXT NOT NULL CHECK(section IN ('details', 'visitors')),
      order_index  INTEGER NOT NULL,
      label_key    TEXT NOT NULL,   -- ключ из i18n: monument_fields.year
      field_key    TEXT,            -- ключ из monument_translations (если null — используем static_value)
      static_value TEXT,            -- статичное значение (не требует перевода)
      FOREIGN KEY (monument_id) REFERENCES monuments(id)
    );

    -- Маршруты
    CREATE TABLE IF NOT EXISTS routes (
      id                 TEXT PRIMARY KEY,
      cover_monument_id  TEXT,
      sort_order         INTEGER DEFAULT 0,
      FOREIGN KEY (cover_monument_id) REFERENCES monuments(id)
    );

    -- Остановки маршрута
    CREATE TABLE IF NOT EXISTS route_stops (
      route_id     TEXT NOT NULL,
      monument_id  TEXT NOT NULL,
      order_index  INTEGER NOT NULL,
      PRIMARY KEY (route_id, order_index),
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (monument_id) REFERENCES monuments(id)
    );

    -- Переводы маршрутов
    CREATE TABLE IF NOT EXISTS route_translations (
      route_id    TEXT NOT NULL,
      lang        TEXT NOT NULL,
      name        TEXT NOT NULL,
      description TEXT NOT NULL,
      PRIMARY KEY (route_id, lang),
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );

    -- Флаг первого запуска (чтобы seed не повторялся)
    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function monumentsHasColumn(name: string): boolean {
  const rows = db.getAllSync<{ name: string }>('PRAGMA table_info(monuments)');
  return rows.some((r) => r.name === name);
}

/** Adds popularity / tags_json for filters (idempotent for existing DBs). */
export function migrateMonumentsFilterColumns(): void {
  if (!monumentsHasColumn('popularity')) {
    db.execSync('ALTER TABLE monuments ADD COLUMN popularity INTEGER NOT NULL DEFAULT 0');
  }
  if (!monumentsHasColumn('tags_json')) {
    db.execSync(`ALTER TABLE monuments ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]'`);
  }
}

/** Проверяет, была ли уже выполнена начальная загрузка данных */
export function isSeeded(): boolean {
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'seeded'`
  );
  return row?.value === '1';
}

export function markSeeded(): void {
  db.runSync(`INSERT OR REPLACE INTO app_meta (key, value) VALUES ('seeded', '1')`);
}

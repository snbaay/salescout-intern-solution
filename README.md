# SaleScout — Прайс-бот для Kaspi.kz (Тестовое задание)

Мини-версия прайс-бота для автоматического управления ценами товаров продавца на маркетплейсе относительно конкурентов.

---

## 🚀 Быстрый старт

### 1. Требования
- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`

### 2. Установка зависимостей
Установите зависимости в корне проекта (бэкенд, тесты, утилиты) и в папке клиента (React + Vite фронтенд):

```bash
# Установка зависимостей бэкенда и тестов
npm install

# Установка зависимостей фронтенда
npm run client:install
```

---

## 🧪 Запуск тестов

Тесты написаны на **Vitest** и покрывают все правила расчёта цены `calculatePrice`, включая граничные случаи, наличие/отсутствие товаров на складе, дробный шаг и равенство ожидаемым результатам из `data/expected.json`.

```bash
npm test
```

Для проверки типов TypeScript во всём проекте:
```bash
npm run typecheck
```

---

## 💻 Запуск приложения

Для полноценной работы приложения запустите сервер API и веб-интерфейс в двух отдельных терминалах:

### Терминал 1: Сервер (HTTP API)
Запуск сервера на Express (порт `3001`):

```bash
npm run server:dev
# или для продакшн-запуска:
# npm run server:start
```
Сервер будет доступен по адресу: `http://localhost:3001`  
Эндпоинт репрайсинга: `POST http://localhost:3001/reprice`

### Терминал 2: Веб-клиент (React + Vite)
Запуск фронтенда:

```bash
npm run client:dev
```
Веб-интерфейс откроется по адресу: `http://localhost:5173`

---

## 📂 Структура проекта

```text
├── src/
│   ├── pricing.ts          # Чистая функция calculatePrice(product): PriceResult
│   ├── pricing.test.ts     # Vitest-тесты (11 тест-кейсов со всеми сценариями)
│   └── types.ts            # TypeScript-типы (Product, Competitor, PriceResult, Reason)
├── server/
│   ├── index.ts            # Express-сервер с эндпоинтом POST /reprice и CORS
│   └── tsconfig.json       # Конфигурация компилятора для сервера
├── client/                 # React 18 + Vite фронтенд
│   ├── src/
│   │   ├── App.tsx         # Таблица «было / стало», статусы, фильтры и кнопка запуска
│   │   ├── App.css         # Стили оформления интерфейса и бейджей причин
│   │   └── main.tsx        # Точка монтирования React
│   ├── vite.config.ts      # Конфигурация Vite с проксированием /reprice на :3001
│   └── package.json        # Зависимости клиента
├── data/
│   ├── products.json       # Пример входных данных с товарами и конкурентами
│   └── expected.json       # Ожидаемый результат для products.json
├── package.json            # Корневой package.json со скриптами запуска
└── tsconfig.json           # Корневой tsconfig проекта
```

---

## 📋 Правила расчёта цены (`calculatePrice`)

1. **Учитываются только конкуренты в наличии**: `inStock === true`.
2. **Нет конкурентов в наличии** (или список пуст):
   - `newPrice = maxPrice`, `reason = "NO_COMPETITORS"`.
3. **Иначе находится минимальная цена среди них**: `best`.
4. **Кандидат**: `candidate = Math.floor(best - step)`.
5. **Ограничение диапазоном**:
   - `candidate < minPrice` → `newPrice = minPrice`, `reason = "AT_MIN"`
   - `candidate > maxPrice` → `newPrice = maxPrice`, `reason = "AT_MAX"`
   - иначе (`minPrice <= candidate <= maxPrice`) → `newPrice = candidate`, `reason = "UNDERCUT"`

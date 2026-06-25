# React + Vite Telegram Mini App — Конструктор браслетов

Этот проект содержит Telegram Mini App на React, который позволяет собирать браслеты из натуральных камней.

## Установка

```bash
cd "c:\Users\god51\OneDrive\Dokumente\Projects\telegram-bracelet-builder-react"
npm install
```

## Запуск

```bash
npm run dev
```

Открой `http://localhost:5173` и тестируй внутри Telegram с HTTPS.

## GitHub Pages

Этот проект можно автоматически деплоить на GitHub Pages из ветки `master`.
- Сборка публикуется в ветку `gh-pages`.
- После установки GitHub Pages в настройках репозитория указывай `gh-pages` как источник.
- После успешного деплоя приложение будет доступно по URL:

```text
https://GOD517.github.io/ester/
```

Для Telegram Mini App в BotFather укажи именно этот HTTPS-адрес как Web App URL.

### Быстрый ngrok

1. Установи ngrok: https://ngrok.com/
2. Запусти туннель:

```bash
ngrok http 5173
```

3. Скопируй HTTPS-адрес из ngrok и укажи его в настройках мини-приложения Telegram.

4. Открой мини-приложение через бота внутри Telegram.

### Сервер для webhook

```bash
set TELEGRAM_BOT_TOKEN=ваш_токен
set WEB_APP_URL=https://<ngrok-id>.ngrok.io
npm run server
```

Сервер будет слушать `http://localhost:3000/webhook`.

### Установить кнопку MINI APP в меню Telegram

После запуска сервера отправь POST-запрос на `/set-menu`:

```bash
curl -X POST http://localhost:3000/set-menu \
  -H "Content-Type: application/json" \
  -d '{"chat_id": <ID_чата>, "url": "https://<ngrok-id>.ngrok.io"}'
```

Если не указывать `chat_id`, кнопка будет установлена как общая кнопка меню.

### Что добавлено

- выбор способа доставки: самовывоз, курьер, почта
- выбор оплаты: наличные, карта, Telegram Pay
- итоговая сумма с учётом доставки
- кнопка Telegram Menu для открытия Mini App
- запись заказов в базу `orders.db`

## Что реализовано

- выбор камня, размера, стиля, цвета шнура и подвески
- реалистичные SVG-изображения камней
- расчёт цены
- отправка заказа боту через `Telegram.WebApp.sendData()`

## Как открыть в Telegram

1. Создай бот через BotFather.
2. Укажи URL приложения в настройках мини-приложения.
3. Используй ngrok или другой HTTPS туннель для локальной разработки.
4. Открой мини-приложение через Telegram и проверь работу.

## Пример payload

```json
{
  "type": "bracelet-order",
  "stone": "Аметист",
  "size": "8 мм",
  "style": "На резинке",
  "accent": "Без акцента",
  "cord": "Чёрный",
  "charm": "Без подвески",
  "quantity": 1,
  "totalPrice": 1200,
  "timestamp": "2026-06-25T12:34:56.789Z"
}
```

## Бэкенд-пример

См. `server.js` в корне проекта.

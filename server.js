import express from 'express';
import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createHash } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL || '';
const PAYMENT_PROVIDER_TOKEN = process.env.PAYMENT_PROVIDER_TOKEN || '';

if (!TELEGRAM_TOKEN) {
  console.error('Нужно установить TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

app.use(express.json());
let db;

async function initDb() {
  db = await open({
    filename: './orders.db',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT,
      user_name TEXT,
      payload TEXT,
      order_hash TEXT,
      invoice_payload TEXT,
      total_price INTEGER,
      payment_method TEXT,
      shipping_method TEXT,
      delivery_address TEXT,
      delivery_phone TEXT,
      delivery_comment TEXT,
      status TEXT DEFAULT 'new',
      repeat_count INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    )
  `);
}

app.post('/webhook', async (req, res) => {
  const update = req.body;
  console.log('Получено обновление:', JSON.stringify(update, null, 2));

  if (update.pre_checkout_query) {
    return await answerPreCheckout(update.pre_checkout_query, res);
  }

  if (update.message && update.message.successful_payment) {
    await handleSuccessfulPayment(update.message);
    return res.sendStatus(200);
  }

  if (update.message && update.message.web_app_data) {
    const chatId = update.message.chat.id;
    const data = update.message.web_app_data.data;

    let order;
    try {
      order = JSON.parse(data);
    } catch (error) {
      console.error('Не удалось распарсить web_app_data:', error);
      return res.sendStatus(400);
    }

    const orderHash = hashOrder(order);
    const duplicate = await findDuplicateOrder(chatId, orderHash);
    if (duplicate) {
      await incrementRepeatCount(duplicate.id);
      await sendMessage(chatId, 'Повторный заказ обнаружен. Мы сохранили его как повторный заказ.');
      return res.sendStatus(200);
    }

    const invoicePayload = `order_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const orderId = await saveOrder(
      chatId,
      order.user || '',
      JSON.stringify(order),
      orderHash,
      invoicePayload,
      order.totalPrice || 0,
      order.paymentMethod,
      order.shippingMethod,
      order.delivery?.address || '',
      order.delivery?.phone || '',
      order.delivery?.comment || ''
    );

    if (order.paymentMethod === 'Telegram Pay' && PAYMENT_PROVIDER_TOKEN) {
      await sendInvoice(chatId, order, orderId, invoicePayload);
      return res.sendStatus(200);
    }

    const text = formatOrderText(order);
    await sendMessage(chatId, text);
    return res.sendStatus(200);
  }

  res.sendStatus(200);
});
app.post('/set-webhook', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`;
  const response = await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, allowed_updates: ['message', 'pre_checkout_query'] }),
  });
  const result = await response.json();
  res.json(result);
});

app.post('/set-menu', async (req, res) => {
  const { chat_id, url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const menuButton = {
    type: 'web_app',
    text: 'Конструктор браслетов',
    web_app: { url },
  };

  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setChatMenuButton`;
  const body = chat_id ? { chat_id, menu_button: menuButton } : { menu_button: menuButton };
  const response = await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  res.json(result);
});
app.get('/admin', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Админка заказов</title>
  <style>
    body { font-family: Arial, sans-serif; background: #101a32; color: #f8fbff; margin: 0; padding: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid rgba(255,255,255,0.08); padding: 12px; }
    th { background: #122041; }
    tr:nth-child(even) { background: rgba(255,255,255,0.03); }
    select, button { padding: 8px 12px; margin: 4px 0; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: #122041; color: #f8fbff; }
  </style>
</head>
<body>
  <h1>Админка заказов</h1>
  <p>Здесь отображаются все заказы.</p>
  <div class="filters">
    <label>Статус
      <select id="filterStatus" onchange="loadOrders()">
        <option value="">Все</option>
        <option value="new">new</option>
        <option value="awaiting_payment">awaiting_payment</option>
        <option value="paid">paid</option>
        <option value="shipped">shipped</option>
        <option value="delivered">delivered</option>
        <option value="cancelled">cancelled</option>
      </select>
    </label>
    <label>Платеж
      <select id="filterPayment" onchange="loadOrders()">
        <option value="">Все</option>
        <option value="Наличные при получении">Наличные при получении</option>
        <option value="Карта онлайн">Карта онлайн</option>
        <option value="Telegram Pay">Telegram Pay</option>
      </select>
    </label>
    <label>Доставка
      <select id="filterShipping" onchange="loadOrders()">
        <option value="">Все</option>
        <option value="Самовывоз">Самовывоз</option>
        <option value="Курьер">Курьер</option>
        <option value="Почта">Почта</option>
      </select>
    </label>
    <label>С даты
      <input id="filterDateFrom" type="date" onchange="loadOrders()" />
    </label>
    <label>По дату
      <input id="filterDateTo" type="date" onchange="loadOrders()" />
    </label>
    <label>Поиск
      <input id="filterSearch" type="text" placeholder="Имя или ID" oninput="loadOrders()" />
    </label>
    <button type="button" onclick="resetFilters()">Сбросить</button>
  </div>
  <table id="ordersTable">
    <thead><tr><th>ID</th><th>Пользователь</th><th>Статус</th><th>Платеж</th><th>Доставка</th><th>Сумма</th><th>Дата</th><th>Действия</th></tr></thead>
    <tbody></tbody>
  </table>
  <script>
    function getFilterParams() {
      const params = new URLSearchParams();
      const status = document.querySelector('#filterStatus').value;
      const payment = document.querySelector('#filterPayment').value;
      const shipping = document.querySelector('#filterShipping').value;
      const dateFrom = document.querySelector('#filterDateFrom').value;
      const dateTo = document.querySelector('#filterDateTo').value;
      const search = document.querySelector('#filterSearch').value.trim();

      if (status) params.append('status', status);
      if (payment) params.append('payment_method', payment);
      if (shipping) params.append('shipping_method', shipping);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (search) params.append('search', search);

      return params.toString();
    }

    async function loadOrders(){
      const query = getFilterParams();
      const resp = await fetch('/admin/orders' + (query ? `?${query}` : ''));
      const orders = await resp.json();
      const tbody = document.querySelector('#ordersTable tbody');
      tbody.innerHTML = '';
      orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${order.id}</td>
          <td>${order.user_name}</td>
          <td><select onchange="updateStatus(${order.id}, this.value)">
              ${['new','awaiting_payment','paid','shipped','delivered','cancelled'].map(s=>`<option value="${s}" ${s===order.status?'selected':''}>${s}</option>`).join('')}
            </select></td>
          <td>${order.payment_method}</td>
          <td>${order.shipping_method}</td>
          <td>${order.total_price} ₽</td>
          <td>${order.created_at}</td>
          <td><button onclick="showDetails(${order.id})">Детали</button></td>
        `;
        tbody.appendChild(tr);
      });
    }
    window.updateStatus = async (id, status) => {
      await fetch('/admin/order/' + id + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadOrders();
    };
    window.showDetails = async (id) => {
      const resp = await fetch('/admin/order/' + id);
      const order = await resp.json();
      alert(JSON.stringify(order, null, 2));
    };
    window.resetFilters = () => {
      document.querySelector('#filterStatus').value = '';
      document.querySelector('#filterPayment').value = '';
      document.querySelector('#filterShipping').value = '';
      document.querySelector('#filterDateFrom').value = '';
      document.querySelector('#filterDateTo').value = '';
      document.querySelector('#filterSearch').value = '';
      loadOrders();
    };
    loadOrders();
  </script>
</body>
</html>`);
});

app.get('/admin/orders', async (req, res) => {
  const filters = [];
  const params = [];

  if (req.query.status) {
    filters.push('status = ?');
    params.push(req.query.status);
  }
  if (req.query.payment_method) {
    filters.push('payment_method = ?');
    params.push(req.query.payment_method);
  }
  if (req.query.shipping_method) {
    filters.push('shipping_method = ?');
    params.push(req.query.shipping_method);
  }
  if (req.query.date_from) {
    filters.push('date(created_at) >= date(?)');
    params.push(req.query.date_from);
  }
  if (req.query.date_to) {
    filters.push('date(created_at) <= date(?)');
    params.push(req.query.date_to);
  }
  if (req.query.search) {
    filters.push('(user_name LIKE ? OR id LIKE ? OR delivery_phone LIKE ?)');
    const searchPattern = `%${req.query.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const query = `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT 200`;
  const rows = await db.all(query, ...params);
  res.json(rows);
});

app.get('/admin/order/:id', async (req, res) => {
  const order = await db.get('SELECT * FROM orders WHERE id = ?', req.params.id);
  res.json(order || {});
});

app.post('/admin/order/:id/status', async (req, res) => {
  const { status } = req.body;
  await db.run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', status, new Date().toISOString(), req.params.id);
  res.json({ ok: true });
});

function hashOrder(order) {
  const normalized = { ...order, timestamp: undefined };
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

async function findDuplicateOrder(chatId, orderHash) {
  return await db.get(
    'SELECT * FROM orders WHERE chat_id = ? AND order_hash = ? AND status != ? ORDER BY created_at DESC LIMIT 1',
    chatId,
    orderHash,
    'cancelled'
  );
}

async function incrementRepeatCount(orderId) {
  await db.run('UPDATE orders SET repeat_count = repeat_count + 1, updated_at = ? WHERE id = ?', new Date().toISOString(), orderId);
}

async function saveOrder(chatId, userName, payload, orderHash, invoicePayload, totalPrice, paymentMethod, shippingMethod, deliveryAddress, deliveryPhone, deliveryComment) {
  const now = new Date().toISOString();
  const result = await db.run(
    `INSERT INTO orders (chat_id, user_name, payload, order_hash, invoice_payload, total_price, payment_method, shipping_method, delivery_address, delivery_phone, delivery_comment, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    chatId,
    userName,
    payload,
    orderHash,
    invoicePayload,
    totalPrice,
    paymentMethod,
    shippingMethod,
    deliveryAddress,
    deliveryPhone,
    deliveryComment,
    paymentMethod === 'Telegram Pay' ? 'awaiting_payment' : 'new',
    now,
    now
  );
  return result.lastID;
}

function formatOrderText(order) {
  const items = order.items
    .map((item, index) =>
      `\n${index + 1}. ${item.stone} (${item.size}, ${item.style}) — ${item.quantity} шт, ${item.totalPrice} ₽`
    )
    .join('');

  return `Новый заказ браслета:\n` +
    `Пользователь: ${order.user || 'не указан'}\n` +
    `Оплата: ${order.paymentMethod || 'не указано'}\n` +
    `Доставка: ${order.shippingMethod || 'не указано'}\n` +
    `Адрес: ${order.delivery?.address || 'не указан'}\n` +
    `Телефон: ${order.delivery?.phone || 'не указан'}\n` +
    `Комментарий: ${order.delivery?.comment || '-'}\n` +
    `Заказ:${items}\n` +
    `Итого: ${order.totalPrice || 0} ₽\n` +
    `Время: ${order.timestamp || ''}`;
}

async function sendInvoice(chatId, order, orderId) {
  if (!PAYMENT_PROVIDER_TOKEN) {
    console.error('PAYMENT_PROVIDER_TOKEN не настроен. Пересылаю текст заказа.');
    return sendMessage(chatId, formatOrderText(order));
  }

  const prices = [
    { label: 'Браслеты', amount: Math.round(order.totalPrice * 100) },
  ];

  const body = {
    chat_id: chatId,
    title: 'Заказ браслетов из натуральных камней',
    description: `Сумма заказа: ${order.totalPrice} ₽`,
    payload: `order_${orderId}`,
    provider_token: PAYMENT_PROVIDER_TOKEN,
    currency: 'RUB',
    prices,
    need_name: true,
    need_phone_number: true,
    need_shipping_address: false,
    is_flexible: false,
  };

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendInvoice`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  if (!result.ok) {
    console.error('Ошибка отправки счета:', result);
    throw new Error('Telegram API error');
  }
  return result;
}

async function answerPreCheckout(preCheckoutQuery, res) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerPreCheckoutQuery`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pre_checkout_query_id: preCheckoutQuery.id, ok: true }),
  });
  const result = await response.json();
  if (!result.ok) {
    console.error('Ошибка подтверждения pre_checkout:', result);
  }
  return res.sendStatus(200);
}

async function handleSuccessfulPayment(message) {
  const invoicePayload = message.successful_payment.invoice_payload;
  await db.run(
    'UPDATE orders SET status = ?, updated_at = ? WHERE invoice_payload = ?',
    'paid',
    new Date().toISOString(),
    invoicePayload
  );
  await sendMessage(message.chat.id, `Платёж получен: ${message.successful_payment.total_amount / 100} ₽. Статус заказа обновлён.`);
}

async function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  if (!result.ok) {
    console.error('Ошибка отправки сообщения:', result);
    throw new Error('Telegram API error');
  }
  return result;
}

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
  });
}

start();

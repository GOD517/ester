import { useEffect, useMemo, useState } from 'react';
import amethystImage from './assets/amethyst.svg';
import roseQuartzImage from './assets/rose-quartz.svg';
import tigerEyeImage from './assets/tiger-eye.svg';
import lapisImage from './assets/lapis.svg';
import jadeImage from './assets/jade.svg';

const stoneOptions = [
  {
    id: 'amethyst',
    label: 'Аметист',
    color: '#9b5fff',
    image: amethystImage,
    description: 'успокаивающий и медитативный',
    price: 1200,
  },
  {
    id: 'rose',
    label: 'Розовый кварц',
    color: '#f7a9c8',
    image: roseQuartzImage,
    description: 'нежный камень любви',
    price: 1000,
  },
  {
    id: 'tiger',
    label: 'Тигровый глаз',
    color: '#b67625',
    image: tigerEyeImage,
    description: 'защитный и активирующий',
    price: 1100,
  },
  {
    id: 'lapis',
    label: 'Лазурит',
    color: '#345a99',
    image: lapisImage,
    description: 'гармония и глубина',
    price: 1300,
  },
  {
    id: 'jade',
    label: 'Нефрит',
    color: '#6bb56d',
    image: jadeImage,
    description: 'натуральный и свежий',
    price: 1400,
  },
];

const sizeOptions = [
  { id: '6mm', label: '6 мм', price: 0 },
  { id: '8mm', label: '8 мм', price: 180 },
  { id: '10mm', label: '10 мм', price: 320 },
];

const styleOptions = [
  { id: 'stretch', label: 'На резинке', price: 0 },
  { id: 'braid', label: 'Плетёный', price: 180 },
  { id: 'adjustable', label: 'Регулируемый', price: 260 },
];

const accentOptions = [
  { id: 'none', label: 'Без акцента', price: 0 },
  { id: 'silver', label: 'Серебряная вставка', price: 220 },
  { id: 'gold', label: 'Золотая вставка', price: 320 },
];

const cordOptions = [
  { id: 'black', label: 'Чёрный' },
  { id: 'brown', label: 'Коричневый' },
  { id: 'beige', label: 'Бежевый' },
  { id: 'blue', label: 'Синий' },
];

const charmOptions = [
  { id: 'none', label: 'Без подвески', price: 0 },
  { id: 'moon', label: 'Лунный камень', price: 260 },
  { id: 'heart', label: 'Сердце', price: 240 },
  { id: 'flower', label: 'Цветок', price: 280 },
];

const paymentOptions = [
  { id: 'cash', label: 'Наличные при получении' },
  { id: 'card', label: 'Карта онлайн' },
  { id: 'telegram', label: 'Telegram Pay' },
];

const deliveryMethods = [
  { id: 'pickup', label: 'Самовывоз', price: 0 },
  { id: 'courier', label: 'Курьер', price: 250 },
  { id: 'post', label: 'Почта', price: 180 },
];

const presetSets = [
  {
    id: 'moon-glow',
    title: 'Лунный свет',
    description: 'Аметист с серебряной подвеской и синим шнуром.',
    config: {
      stoneId: 'amethyst',
      sizeId: '8mm',
      styleId: 'stretch',
      accentId: 'silver',
      cordId: 'blue',
      charmId: 'moon',
      quantity: 1,
    },
  },
  {
    id: 'rose-charm',
    title: 'Розовый шарм',
    description: 'Розовый кварц с регулируемым плетением и сердцем.',
    config: {
      stoneId: 'rose',
      sizeId: '8mm',
      styleId: 'adjustable',
      accentId: 'gold',
      cordId: 'beige',
      charmId: 'heart',
      quantity: 1,
    },
  },
  {
    id: 'forest-balance',
    title: 'Лесное равновесие',
    description: 'Нефрит с тёплым шнуром, без подвески.',
    config: {
      stoneId: 'jade',
      sizeId: '6mm',
      styleId: 'braid',
      accentId: 'none',
      cordId: 'brown',
      charmId: 'none',
      quantity: 1,
    },
  },
];

function getOption(options, id) {
  return options.find((item) => item.id === id) || options[0];
}

function getItemPrice(config) {
  const stone = getOption(stoneOptions, config.stoneId);
  const size = getOption(sizeOptions, config.sizeId);
  const style = getOption(styleOptions, config.styleId);
  const accent = getOption(accentOptions, config.accentId);
  const charm = getOption(charmOptions, config.charmId);
  return (stone.price + size.price + style.price + accent.price + charm.price) * config.quantity;
}

function normalizeConfig(config) {
  return {
    stoneId: config.stoneId,
    sizeId: config.sizeId,
    styleId: config.styleId,
    accentId: config.accentId,
    cordId: config.cordId,
    charmId: config.charmId,
    quantity: config.quantity,
  };
}

function App() {
  const [stoneId, setStoneId] = useState('amethyst');
  const [sizeId, setSizeId] = useState('8mm');
  const [styleId, setStyleId] = useState('stretch');
  const [accentId, setAccentId] = useState('none');
  const [cordId, setCordId] = useState('black');
  const [charmId, setCharmId] = useState('none');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [shippingMethod, setShippingMethod] = useState('courier');
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryComment, setDeliveryComment] = useState('');
  const [telegramUser, setTelegramUser] = useState('гость');
  const [orderStatus, setOrderStatus] = useState('Готово к отправки');
  const [orderStage, setOrderStage] = useState('Не отправлен');

  const stone = useMemo(() => getOption(stoneOptions, stoneId), [stoneId]);
  const size = useMemo(() => getOption(sizeOptions, sizeId), [sizeId]);
  const style = useMemo(() => getOption(styleOptions, styleId), [styleId]);
  const accent = useMemo(() => getOption(accentOptions, accentId), [accentId]);
  const cord = useMemo(() => getOption(cordOptions, cordId), [cordId]);
  const charm = useMemo(() => getOption(charmOptions, charmId), [charmId]);

  const activeItemPrice = useMemo(
    () => (stone.price + size.price + style.price + accent.price + charm.price) * quantity,
    [stone, size, style, accent, charm, quantity]
  );

  const shippingCost = useMemo(
    () => getOption(deliveryMethods, shippingMethod).price,
    [shippingMethod]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + getItemPrice(item.config), 0),
    [cart]
  );

  const orderTotal = useMemo(
    () => (cartTotal || activeItemPrice) + shippingCost,
    [cartTotal, activeItemPrice, shippingCost]
  );

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      return;
    }
    tg.expand();
    const user = tg.initDataUnsafe?.user;
    if (user) {
      setTelegramUser(user.first_name || 'пользователь');
    }
  }, []);

  const applyPreset = (preset) => {
    const { stoneId, sizeId, styleId, accentId, cordId, charmId, quantity } = preset.config;
    setStoneId(stoneId);
    setSizeId(sizeId);
    setStyleId(styleId);
    setAccentId(accentId);
    setCordId(cordId);
    setCharmId(charmId);
    setQuantity(quantity);
  };

  const addCurrentToCart = () => {
    const config = normalizeConfig({ stoneId, sizeId, styleId, accentId, cordId, charmId, quantity });
    setCart((prev) => {
      const exists = prev.find((item) => JSON.stringify(item.config) === JSON.stringify(config));
      if (exists) {
        return prev.map((item) =>
          JSON.stringify(item.config) === JSON.stringify(config)
            ? { ...item, config: { ...item.config, quantity: item.config.quantity + quantity } }
            : item
        );
      }
      return [...prev, { config, id: Date.now().toString() }];
    });
    setOrderStatus('Текущий набор добавлен в корзину.');
  };

  const removeCartItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSend = () => {
    if (!deliveryName || !deliveryPhone || !deliveryAddress) {
      setOrderStatus('Заполните данные доставки перед отправкой.');
      return;
    }

    const tg = window.Telegram?.WebApp;
    if (!tg?.sendData) {
      setOrderStatus('Telegram SDK недоступен: откройте внутри Telegram.');
      setOrderStage('Ошибка отправки');
      return;
    }

    const payload = {
      type: 'bracelet-order',
      user: telegramUser,
      paymentMethod: getOption(paymentOptions, paymentMethod).label,
      shippingMethod: getOption(deliveryMethods, shippingMethod).label,
      items: cart.length
        ? cart.map((item) => ({
            stone: getOption(stoneOptions, item.config.stoneId).label,
            size: getOption(sizeOptions, item.config.sizeId).label,
            style: getOption(styleOptions, item.config.styleId).label,
            accent: getOption(accentOptions, item.config.accentId).label,
            cord: getOption(cordOptions, item.config.cordId).label,
            charm: getOption(charmOptions, item.config.charmId).label,
            quantity: item.config.quantity,
            totalPrice: getItemPrice(item.config),
          }))
        : [
            {
              stone: stone.label,
              size: size.label,
              style: style.label,
              accent: accent.label,
              cord: cord.label,
              charm: charm.label,
              quantity,
              totalPrice: activeItemPrice,
            },
          ],
      delivery: {
        name: deliveryName,
        phone: deliveryPhone,
        address: deliveryAddress,
        comment: deliveryComment,
      },
      totalPrice: orderTotal,
      timestamp: new Date().toISOString(),
    };

    tg.sendData(JSON.stringify(payload));
    const stage = paymentMethod === 'telegram' ? 'Ожидает оплаты' : 'Отправлен боту';
    setOrderStage(stage);
    setOrderStatus('Заказ отправлен боту. Проверьте чат Telegram.');
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <p className="eyebrow">Конструктор браслетов</p>
          <h1>Собери браслет из натуральных камней</h1>
          <p className="subtitle">Выбери камень, стиль, шнур и подвеску, или начни с готового набора.</p>
        </div>
        <div className="user-chip">Привет, {telegramUser}</div>
        <button className="secondary-button admin-button" type="button" onClick={() => window.open('/admin', '_blank')}>
          Админка
        </button>
      </header>

      <main className="grid-layout">
        <section className="panel panel-form">
          <h2>Параметры</h2>

          <label>
            Камень
            <select value={stoneId} onChange={(e) => setStoneId(e.target.value)}>
              {stoneOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Размер
            <select value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
              {sizeOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Стиль
            <select value={styleId} onChange={(e) => setStyleId(e.target.value)}>
              {styleOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Акцент
            <select value={accentId} onChange={(e) => setAccentId(e.target.value)}>
              {accentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Цвет шнура
            <select value={cordId} onChange={(e) => setCordId(e.target.value)}>
              {cordOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Подвеска
            <select value={charmId} onChange={(e) => setCharmId(e.target.value)}>
              {charmOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Количество
            <input type="number" min="1" max="10" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </label>

          <button className="secondary-button" type="button" onClick={addCurrentToCart}>
            Добавить в корзину
          </button>
        </section>

        <section className="panel panel-preview">
          <h2>Предпросмотр</h2>
          <div className="preview-card">
            <div className="preview-image" style={{ backgroundColor: stone.color }}>
              <img src={stone.image} alt={stone.label} />
            </div>
            <div className="preview-description">
              <p className="stone-name">{stone.label}</p>
              <p>{stone.description}</p>
              <div className="detail-row">
                <span>Размер:</span>
                <strong>{size.label}</strong>
              </div>
              <div className="detail-row">
                <span>Стиль:</span>
                <strong>{style.label}</strong>
              </div>
              <div className="detail-row">
                <span>Подвеска:</span>
                <strong>{charm.label}</strong>
              </div>
            </div>
          </div>

          <div className="order-summary">
            <div>
              <p>Количество</p>
              <strong>{quantity}</strong>
            </div>
            <div>
              <p>Итоговая цена</p>
              <strong>{activeItemPrice.toLocaleString('ru-RU')} ₽</strong>
            </div>
          </div>
        </section>

        <section className="panel panel-actions">
          <h2>Корзина</h2>
          {cart.length ? (
            <div className="cart-list">
              {cart.map((item) => {
                const stoneItem = getOption(stoneOptions, item.config.stoneId);
                const itemPrice = getItemPrice(item.config);
                return (
                  <div key={item.id} className="cart-item">
                    <div>
                      <p>{stoneItem.label}, {item.config.sizeId}, {item.config.styleId}</p>
                      <p className="muted-text">{item.config.quantity} шт — {itemPrice.toLocaleString('ru-RU')} ₽</p>
                    </div>
                    <button className="text-button" type="button" onClick={() => removeCartItem(item.id)}>
                      Удалить
                    </button>
                  </div>
                );
              })}
              <div className="cart-total">
                <span>Всего</span>
                <strong>{cartTotal.toLocaleString('ru-RU')} ₽</strong>
              </div>
            </div>
          ) : (
            <div className="empty-card">Корзина пуста. Добавь набор или используй текущую конфигурацию.</div>
          )}

          <div className="delivery-form">
            <h3>Доставка и оплата</h3>
            <label>
              Способ доставки
              <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}>
                {deliveryMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label} {method.price ? `(+${method.price} ₽)` : '(бесплатно)'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Способ оплаты
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {paymentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Имя получателя
              <input value={deliveryName} onChange={(e) => setDeliveryName(e.target.value)} placeholder="Иван Иванов" />
            </label>
            <label>
              Телефон
              <input value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} placeholder="+7 999 123-45-67" />
            </label>
            <label>
              Адрес или пункт выдачи
              <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="г. Москва, ул. Тверская, 1" />
            </label>
            <label>
              Комментарий
              <input value={deliveryComment} onChange={(e) => setDeliveryComment(e.target.value)} placeholder="Пакет без открыток" />
            </label>
          </div>

          <button className="primary-button" type="button" onClick={handleSend}>
            Отправить заказ боту
          </button>
          <p className="status-text">{orderStatus}</p>
          <p className="status-text">Статус заказа: {orderStage}</p>
          <div className="order-summary">
            <div>
              <p>Стоимость доставки</p>
              <strong>{shippingCost.toLocaleString('ru-RU')} ₽</strong>
            </div>
            <div>
              <p>Итого с доставкой</p>
              <strong>{orderTotal.toLocaleString('ru-RU')} ₽</strong>
            </div>
          </div>
          <div className="hint-box">
            <p>Если корзина пуста, будет отправлен текущий набор.</p>
            <p>Доставка и способ оплаты сохраняются в заказе и приходят в `web_app_data`.</p>
          </div>
        </section>
      </main>

      <section className="panel panel-presets">
        <h2>Готовые композиции</h2>
        <div className="preset-grid">
          {presetSets.map((preset) => (
            <article key={preset.id} className="preset-card">
              <div className="preset-meta">
                <strong>{preset.title}</strong>
                <p>{preset.description}</p>
              </div>
              <button className="secondary-button" type="button" onClick={() => applyPreset(preset)}>
                Выбрать набор
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;

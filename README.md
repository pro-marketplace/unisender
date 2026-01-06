# Unisender Go Extension

Транзакционные email-уведомления через Unisender Go. **1 функция** для отправки писем.

> Подтверждения заказов, сброс пароля, уведомления о статусе — всё через один API.

---

## Для ассистента: перед интеграцией

**Спроси у пользователя:**

> Для отправки email-уведомлений мне нужны данные из Unisender Go:
> 1. **API-ключ** — из [личного кабинета](https://go.unisender.ru/ru/user/project/list) Unisender Go
> 2. **Email отправителя** — с какого адреса будут приходить письма (должен быть подтверждён в Unisender Go)
> 3. **Имя отправителя** — например "Магазин Store" или "Поддержка"

---

## Установка

### 1. Переменные окружения

| Переменная | Описание |
|------------|----------|
| `UNISENDER_API_KEY` | API-ключ Unisender Go |
| `UNISENDER_SENDER_EMAIL` | Email отправителя (подтверждённый) |
| `UNISENDER_SENDER_NAME` | Имя отправителя |

### 2. Добавление секретов

```python
put_secret("UNISENDER_API_KEY", "<API ключ от пользователя>")
put_secret("UNISENDER_SENDER_EMAIL", "<email отправителя>")
put_secret("UNISENDER_SENDER_NAME", "<имя отправителя>")
```

---

## API

### POST ?action=send

Отправка письма с кастомным HTML.

**Request:**
```json
{
  "to_email": "customer@example.com",
  "to_name": "Иван Иванов",
  "subject": "Ваш заказ #{{order_id}} оформлен",
  "body_html": "<h1>Спасибо за заказ!</h1><p>Номер: {{order_id}}</p>",
  "substitutions": {
    "order_id": "12345"
  },
  "tags": ["order", "confirmation"]
}
```

**Response:**
```json
{
  "success": true,
  "job_id": "abc123..."
}
```

### POST ?action=send-template

Отправка письма по сохранённому шаблону.

**Request:**
```json
{
  "to_email": "customer@example.com",
  "template_id": "order_confirmation",
  "substitutions": {
    "order_id": "12345",
    "total": "2500 ₽"
  }
}
```

---

## Примеры использования

### Подтверждение заказа

```tsx
import { useUnisender } from "@/hooks/useUnisender";

const API_URL = "https://functions.poehali.dev/xxx-unisender";

function OrderConfirmation({ order, customerEmail }) {
  const { sendEmail, isLoading } = useUnisender({ apiUrl: API_URL });

  const sendConfirmation = async () => {
    await sendEmail({
      to_email: customerEmail,
      subject: `Заказ #${order.id} оформлен`,
      body_html: `
        <h1>Спасибо за заказ!</h1>
        <p>Номер заказа: <strong>${order.id}</strong></p>
        <p>Сумма: ${order.total} ₽</p>
      `,
      tags: ["order", "confirmation"],
    });
  };

  return (
    <button onClick={sendConfirmation} disabled={isLoading}>
      Отправить подтверждение
    </button>
  );
}
```

### Сброс пароля

```tsx
const sendPasswordReset = async (email: string, resetLink: string) => {
  await sendEmail({
    to_email: email,
    subject: "Сброс пароля",
    body_html: `
      <h1>Восстановление пароля</h1>
      <p>Для сброса пароля перейдите по ссылке:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ссылка действительна 1 час.</p>
    `,
    tags: ["auth", "password-reset"],
  });
};
```

### Использование шаблона

```tsx
const { sendTemplate } = useUnisender({ apiUrl: API_URL });

// Отправка по шаблону из Unisender Go
await sendTemplate({
  to_email: "customer@example.com",
  template_id: "shipping_notification",
  substitutions: {
    order_id: "12345",
    tracking_number: "RU123456789",
    delivery_date: "15 января",
  },
});
```

---

## Типичные кейсы

| Тип письма | Когда отправлять |
|------------|------------------|
| Подтверждение заказа | После успешной оплаты |
| Чек/квитанция | После платежа |
| Статус доставки | При изменении статуса |
| Сброс пароля | По запросу пользователя |
| Подтверждение регистрации | После регистрации |
| Напоминание | По расписанию/триггеру |

---

## После установки

**ОБЯЗАТЕЛЬНО:** Интегрируй отправку писем в нужные места приложения!

Используй компоненты из `/frontend`:
- `useUnisender.ts` — хук для отправки писем

**Типичные точки интеграции:**
- После оформления заказа → подтверждение
- После оплаты → чек
- Форма сброса пароля → письмо со ссылкой

**Скажи пользователю:**

> ✅ Email-уведомления через Unisender Go настроены!
>
> Транзакционные письма будут отправляться автоматически.

---

## Настройка Unisender Go

### Получение API-ключа
1. Зарегистрируйтесь на [go.unisender.ru](https://go.unisender.ru/)
2. Перейдите в Настройки → API
3. Скопируйте ключ

### Подтверждение домена отправителя
1. Перейдите в Настройки → Домены
2. Добавьте домен
3. Настройте SPF и DKIM записи
4. Дождитесь подтверждения

### Создание шаблонов (опционально)
1. Перейдите в Шаблоны
2. Создайте шаблон с переменными `{{variable_name}}`
3. Скопируйте ID шаблона

---

## Безопасность

- API-ключ хранится в секретах, не передаётся на фронтенд
- Отправитель верифицирован через SPF/DKIM
- Трекинг открытий и кликов (опционально)
- 99.9% доставляемость

---

## Лимиты

- До 500 получателей в одном запросе
- Максимум 10 МБ на запрос
- До 4 тегов на письмо

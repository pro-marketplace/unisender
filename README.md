# Unisender Extension

Подписка на email-рассылку через Unisender. **1 функция** с действиями subscribe/unsubscribe.

---

## Для ассистента: перед интеграцией

**Спроси у пользователя:**

> Для подключения рассылки Unisender мне нужны:
> 1. **API-ключ** — найдёте в [личном кабинете](https://cp.unisender.com/ru/v5/user/info/api) Unisender
> 2. **ID списка** — создайте список в разделе "Контакты" и скопируйте его ID

---

## Установка

### 1. Переменные окружения

| Переменная | Описание |
|------------|----------|
| `UNISENDER_API_KEY` | API-ключ из личного кабинета |
| `UNISENDER_LIST_ID` | ID списка для подписки |

### 2. Добавление секретов

```python
put_secret("UNISENDER_API_KEY", "<API ключ от пользователя>")
put_secret("UNISENDER_LIST_ID", "<ID списка от пользователя>")
```

---

## API

### POST ?action=subscribe

Подписка на рассылку.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "Иван Иванов",
  "tags": "website,promo"
}
```

**Response:**
```json
{
  "success": true,
  "person_id": 2500767342
}
```

### POST ?action=unsubscribe

Отписка от рассылки.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Frontend

### Простая форма подписки

```tsx
import { SubscribeForm } from "@/components/SubscribeForm";

<SubscribeForm
  apiUrl="https://functions.poehali.dev/xxx-unisender"
  buttonText="Подписаться"
  successMessage="Спасибо за подписку!"
/>
```

### С полем имени

```tsx
<SubscribeForm
  apiUrl="https://functions.poehali.dev/xxx-unisender"
  showNameField={true}
  emailPlaceholder="Email"
  namePlaceholder="Как вас зовут?"
  buttonText="Получать новости"
  onSuccess={() => console.log("Subscribed!")}
/>
```

### Использование хука

```tsx
import { useUnisender } from "@/hooks/useUnisender";

const API_URL = "https://functions.poehali.dev/xxx-unisender";

function NewsletterSection() {
  const { subscribe, unsubscribe, isLoading, error } = useUnisender({
    apiUrl: API_URL,
  });

  const handleSubscribe = async () => {
    const result = await subscribe({
      email: "user@example.com",
      name: "Иван",
    });

    if (result.success) {
      console.log("Subscribed! Person ID:", result.person_id);
    }
  };

  return (
    <button onClick={handleSubscribe} disabled={isLoading}>
      {isLoading ? "Загрузка..." : "Подписаться"}
    </button>
  );
}
```

---

## После установки

**ОБЯЗАТЕЛЬНО:** Последним шагом добавь форму подписки на фронтенд, чтобы пользователь сразу видел результат!

Используй компоненты из `/frontend`:
- `SubscribeForm.tsx` — готовая форма подписки
- `useUnisender.ts` — хук для кастомной логики

**Скажи пользователю:**

> ✅ Рассылка Unisender настроена!
>
> Форма подписки добавлена на сайт. Новые подписчики будут автоматически добавляться в ваш список.

---

## Где взять данные

### API-ключ
1. Войдите в [личный кабинет Unisender](https://cp.unisender.com/)
2. Перейдите в Настройки → Интеграция и API
3. Скопируйте ключ API

### ID списка
1. Перейдите в раздел "Контакты" → "Списки"
2. Создайте новый список или выберите существующий
3. ID списка виден в URL: `https://cp.unisender.com/ru/v5/lists/{LIST_ID}/contacts`

---

## Параметры подписки

| Параметр | Описание |
|----------|----------|
| `email` | Email адрес (обязательно) |
| `name` | Имя подписчика |
| `tags` | Метки через запятую (макс. 10) |
| `list_id` | ID списка (если отличается от дефолтного) |

---

## Безопасность

- API-ключ хранится в секретах, не передаётся на фронтенд
- Валидация email на бэкенде
- CORS ограничение через `ALLOWED_ORIGINS`

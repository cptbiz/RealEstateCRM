# Руководство по развертыванию Real Estate приложения

## Обзор архитектуры

- **Фронтенд**: React приложение (деплой на Vercel)
- **Бэкенд**: Node.js + Express + MongoDB (деплой на Railway)

## Шаг 1: Развертывание бэкенда на Railway

### 1.1 Создание аккаунта Railway

1. Зайдите на [railway.app](https://railway.app)
2. Создайте аккаунт через GitHub
3. Создайте новый проект

### 1.2 Настройка MongoDB

1. В Railway добавьте MongoDB сервис:
   - Нажмите "Add Service" → "Database" → "MongoDB"
   - Railway автоматически создаст базу данных

### 1.3 Деплой бэкенда

1. В Railway нажмите "Add Service" → "GitHub Repo"
2. Выберите ваш репозиторий
3. Укажите корневую папку как `server`
4. Railway автоматически определит Node.js проект

### 1.4 Настройка переменных окружения

В разделе "Variables" добавьте:

```env
PORT=5001
DATABASE_URL=${{MongoDB.DATABASE_URL}}
DATABASE_NAME=Prolink
NODE_ENV=production
HTTPS=false
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### 1.5 Получение URL бэкенда

После успешного деплоя Railway предоставит вам URL вида:
`https://your-project-name.up.railway.app`

## Шаг 2: Развертывание фронтенда на Vercel

### 2.1 Создание аккаунта Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. Создайте аккаунт через GitHub

### 2.2 Деплой фронтенда

1. В Vercel нажмите "Add New Project"
2. Выберите ваш GitHub репозиторий
3. Настройте проект:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install --legacy-peer-deps`

### 2.3 Настройка переменных окружения

В разделе "Environment Variables" добавьте:

```env
REACT_APP_BASE_URL=https://your-railway-backend.up.railway.app/api
```

### 2.4 Обновление CORS в бэкенде

После получения URL Vercel приложения, обновите переменную `CORS_ORIGIN` в Railway:

```env
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

## Шаг 3: Локальная разработка

### 3.1 Установка зависимостей

```bash
# Установка зависимостей бэкенда
cd server
npm install

# Установка зависимостей фронтенда
cd ../client
npm install --legacy-peer-deps
```

### 3.2 Настройка локальных переменных

**Бэкенд** (`server/.env`):
```env
PORT=5001
DB_URL=mongodb://127.0.0.1:27017
DB=Prolink
NODE_ENV=development
HTTPS=false
JWT_SECRET=your-local-jwt-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
CORS_ORIGIN=http://localhost:3000
```

**Фронтенд** (`client/.env`):
```env
REACT_APP_BASE_URL=http://localhost:5001/api
```

### 3.3 Запуск приложения

```bash
# Запуск бэкенда
cd server
npm run dev

# Запуск фронтенда (в новом терминале)
cd client
npm start
```

## Шаг 4: Тестирование

### 4.1 Локальное тестирование

1. Откройте `http://localhost:3000`
2. Проверьте подключение к API
3. Убедитесь, что данные загружаются корректно

### 4.2 Тестирование в продакшене

1. Откройте ваш Vercel URL
2. Проверьте все функции приложения
3. Убедитесь, что API запросы работают корректно

## Шаг 5: Настройка домена (опционально)

### 5.1 Настройка домена в Vercel

1. Перейдите в настройки проекта
2. Добавьте свой домен
3. Настройте DNS записи

### 5.2 Настройка домена в Railway

1. Перейдите в настройки проекта
2. Добавьте custom domain
3. Обновите переменную `CORS_ORIGIN`

## Troubleshooting

### Проблема: CORS ошибки

**Решение**: Убедитесь, что `CORS_ORIGIN` в Railway точно совпадает с URL вашего Vercel приложения.

### Проблема: 404 ошибки на фронтенде

**Решение**: Убедитесь, что `vercel.json` настроен правильно для SPA routing.

### Проблема: Ошибки подключения к базе данных

**Решение**: Проверьте, что `DATABASE_URL` правильно настроена в Railway.

### Проблема: Зависимости не устанавливаются

**Решение**: Используйте `npm install --legacy-peer-deps` для клиентской части.

## Дополнительные настройки

### Мониторинг

- Railway предоставляет встроенный мониторинг
- Vercel предоставляет аналитику и логи

### Масштабирование

- Railway автоматически масштабирует приложение
- Vercel автоматически масштабирует статические файлы

### Безопасность

- Используйте сильные JWT секреты
- Настройте правильные CORS политики
- Используйте HTTPS в продакшене

## Полезные ссылки

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (альтернатива Railway MongoDB)

---

**Примечание**: Замените все placeholder значения (your-email@gmail.com, your-stripe-keys, и т.д.) на реальные значения при развертывании.
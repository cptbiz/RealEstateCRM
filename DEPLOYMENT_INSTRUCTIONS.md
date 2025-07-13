# 🚀 Инструкции по развертыванию Multilingual Real Estate CRM

## 📋 Обзор архитектуры развертывания

- **Frontend**: React.js → Vercel
- **Backend**: Node.js → Railway
- **Database**: MongoDB → MongoDB Atlas
- **Cache**: Redis → Railway Redis
- **Repository**: GitHub

## 🔧 Предварительная настройка

### 1. Создание аккаунтов
- [GitHub](https://github.com) - для хранения кода
- [Railway](https://railway.app) - для бэкенда и базы данных
- [Vercel](https://vercel.com) - для фронтенда
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - для базы данных (опционально)

### 2. Получение API ключей
- **OpenAI**: [platform.openai.com](https://platform.openai.com/api-keys)
- **Google Cloud**: [console.cloud.google.com](https://console.cloud.google.com)
- **WhatsApp Business**: [business.whatsapp.com](https://business.whatsapp.com)
- **Telegram Bot**: [@BotFather](https://t.me/botfather)
- **Stripe**: [dashboard.stripe.com](https://dashboard.stripe.com)

## 📁 Шаг 1: Подготовка репозитория GitHub

### 1.1 Создание репозитория
```bash
# Клонировать или создать новый репозиторий
git init
git add .
git commit -m "Initial commit: Multilingual Real Estate CRM"
git branch -M main
git remote add origin https://github.com/USERNAME/real-estate-crm.git
git push -u origin main
```

### 1.2 Структура проекта
```
real-estate-crm/
├── client/           # React фронтенд
├── server/           # Node.js бэкенд
├── package.json      # Корневой package.json
├── vercel.json       # Конфигурация Vercel
├── docker-compose.yml # Локальная разработка
└── README.md
```

## 🚄 Шаг 2: Развертывание бэкенда на Railway

### 2.1 Подключение к Railway
1. Зайдите на [railway.app](https://railway.app)
2. Войдите через GitHub
3. Нажмите **"New Project"**
4. Выберите **"Deploy from GitHub repo"**
5. Выберите ваш репозиторий `real-estate-crm`

### 2.2 Настройка сервиса бэкенда
1. После подключения репозитория, Railway автоматически обнаружит ваш проект
2. Выберите папку **`server`** для развертывания
3. Railway автоматически развернет приложение

### 2.3 Настройка переменных окружения на Railway

В разделе **Variables** добавьте:

```bash
# Основные настройки
NODE_ENV=production
PORT=5001
RAILWAY_DEPLOYMENT=true

# База данных (Railway предоставит автоматически)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# JWT & Sessions
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# AI Services
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# Integrations
WHATSAPP_API_KEY=your-whatsapp-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key

# CORS (URL вашего Vercel фронтенда)
CORS_ORIGIN=https://your-app.vercel.app

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 2.4 Добавление баз данных
1. В Railway dashboard, нажмите **"New"** → **"Database"**
2. Выберите **"Add PostgreSQL"** (или MongoDB если нужно)
3. Выберите **"Add Redis"**
4. Railway автоматически создаст переменные `DATABASE_URL` и `REDIS_URL`

### 2.5 Получение URL бэкенда
После развертывания Railway предоставит URL вида:
```
https://your-backend-production.up.railway.app
```

## 🌐 Шаг 3: Развертывание фронтенда на Vercel

### 3.1 Подключение к Vercel
1. Зайдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub
3. Нажмите **"New Project"**
4. Выберите ваш репозиторий `real-estate-crm`

### 3.2 Настройка проекта в Vercel
1. **Root Directory**: `client`
2. **Framework Preset**: `Create React App`
3. **Build Command**: `npm run build`
4. **Output Directory**: `build`
5. **Install Command**: `npm install --legacy-peer-deps`

### 3.3 Настройка переменных окружения в Vercel

В разделе **Environment Variables** добавьте:

```bash
# API URLs (замените на ваш Railway URL)
REACT_APP_API_URL=https://your-backend-production.up.railway.app/api
REACT_APP_WS_URL=https://your-backend-production.up.railway.app

# Google Maps
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# App Configuration
REACT_APP_ENVIRONMENT=production
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_SUPPORTED_LANGUAGES=en,pt-BR,es,ru
REACT_APP_DEFAULT_CURRENCY=USD
REACT_APP_SUPPORTED_CURRENCIES=USD,BRL,EUR,RUB

# Features
REACT_APP_ENABLE_AI_FEATURES=true
REACT_APP_ENABLE_REAL_TIME=true
REACT_APP_ENABLE_NOTIFICATIONS=true
```

### 3.4 Развертывание
1. Нажмите **"Deploy"**
2. Vercel автоматически соберет и развернет ваше приложение
3. Получите URL вида: `https://your-app.vercel.app`

## 🔄 Шаг 4: Настройка автоматического развертывания

### 4.1 GitHub Actions (опционально)
Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway and Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: |
        npm run install:all
    - name: Run tests
      run: |
        npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to Railway
      run: echo "Backend deployed automatically by Railway"

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to Vercel
      run: echo "Frontend deployed automatically by Vercel"
```

### 4.2 Автоматическое развертывание
- **Railway**: Автоматически развертывает при push в `main`
- **Vercel**: Автоматически развертывает при push в `main`
- **Preview**: Создает preview для pull requests

## 🗄️ Шаг 5: Настройка базы данных

### 5.1 MongoDB Atlas (альтернатива)
Если используете MongoDB Atlas вместо PostgreSQL:

1. Создайте кластер на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Получите connection string
3. Обновите `DATABASE_URL` в Railway:
```bash
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/RealEstateCRM
```

### 5.2 Инициализация данных
```bash
# Подключитесь к вашему Railway backend через SSH или используйте Railway CLI
railway run npm run migrate
```

## 🔧 Шаг 6: Тестирование развертывания

### 6.1 Проверка бэкенда
```bash
# Проверьте health endpoint
curl https://your-backend-production.up.railway.app/api/health

# Ожидаемый ответ:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### 6.2 Проверка фронтенда
1. Откройте `https://your-app.vercel.app`
2. Проверьте, что приложение загружается
3. Проверьте подключение к API
4. Тестируйте функции на разных языках

### 6.3 Проверка интеграции
1. **Real-time**: Проверьте WebSocket соединение
2. **AI**: Тестируйте чатбот и рекомендации
3. **Multilingual**: Переключение языков
4. **Maps**: Загрузка Google Maps

## 🔍 Шаг 7: Мониторинг и логирование

### 7.1 Railway мониторинг
- Dashboard показывает CPU, память, сеть
- Логи доступны в реальном времени
- Алерты при ошибках

### 7.2 Vercel мониторинг
- Analytics для фронтенда
- Performance insights
- Error tracking

### 7.3 Настройка алертов
```bash
# В Railway Variables добавьте:
SENTRY_DSN=your-sentry-dsn-for-error-tracking
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

## 🚨 Устранение неполадок

### Частые проблемы:

1. **CORS ошибки**:
   ```bash
   # Убедитесь, что CORS_ORIGIN правильно настроен в Railway
   CORS_ORIGIN=https://your-exact-vercel-url.vercel.app
   ```

2. **Database connection**:
   ```bash
   # Проверьте DATABASE_URL в Railway
   # Убедитесь, что MongoDB/PostgreSQL доступен
   ```

3. **Build ошибки в Vercel**:
   ```bash
   # В Vercel Environment Variables:
   CI=false
   GENERATE_SOURCEMAP=false
   ```

4. **Memory limits**:
   ```bash
   # В Railway увеличьте memory limits
   # В Vercel используйте:
   NODE_OPTIONS=--max_old_space_size=4096
   ```

## 🔄 Обновления

### Процесс обновления:
1. Внесите изменения в код
2. Commit и push в GitHub
3. Railway и Vercel автоматически развернут обновления
4. Проверьте, что все работает корректно

### Rollback:
- **Railway**: Deploy previous commit from dashboard
- **Vercel**: Revert to previous deployment

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Railway/Vercel dashboards
2. Убедитесь, что все environment variables настроены
3. Проверьте статус внешних сервисов (OpenAI, Google, etc.)

---

## ✅ Чек-лист развертывания

- [ ] Репозиторий создан на GitHub
- [ ] Railway проект настроен с PostgreSQL и Redis
- [ ] Все environment variables настроены в Railway
- [ ] Vercel проект настроен с правильными переменными
- [ ] CORS_ORIGIN обновлен с Vercel URL
- [ ] Database инициализирована
- [ ] Health checks проходят
- [ ] Multilingual функции работают
- [ ] AI сервисы подключены
- [ ] Real-time функции работают
- [ ] Интеграции (WhatsApp, Telegram) настроены

**Поздравляем! 🎉 Ваш Multilingual Real Estate CRM успешно развернут!**
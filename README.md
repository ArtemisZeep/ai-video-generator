# AI Video Generator - Enhanced Pipeline v2.0

🚀 **Полнофункциональный сервис для автоматической генерации видео с улучшенным пайплайном**

Использует Perplexity API, ElevenLabs, Pexels и Creatomate для создания профессиональных коротких видео с автоматическим поиском и отбором контента.

## 🚀 Возможности

### 🆕 Новый улучшенный пайплайн (v2.0)
- **Детальный сценарий**: Структурированный JSON сценарий с разбивкой по сценам
- **Автоматический поиск видео**: Поиск релевантных вертикальных видео через Pexels API
- **Умный отбор контента**: AI-анализ и выбор лучших видео для каждой сцены
- **Профессиональный рендеринг**: Создание финального видео через Creatomate
- **Полная автоматизация**: От идеи до готового видео в одном запросе

### 🔧 Базовые возможности
- **Генерация контента**: Сценарии, названия, описания, ключевые слова через Perplexity
- **Создание озвучки**: Высококачественная озвучка через ElevenLabs API
- **Создание видео**: Полноценные видео через ShortGPT с фоновыми изображениями
- **Многоязычность**: Поддержка русского, английского и других языков
- **Ротация API ключей**: Автоматическое переключение между ключами
- **REST API**: Полный набор endpoints для интеграции
- **Вертикальный формат**: Оптимизация для TikTok, YouTube Shorts, Instagram Reels

## 📋 Требования

- Node.js 16+
- Python 3.x
- FFmpeg
- ImageMagick
- **API ключи Perplexity** (для генерации контента и анализа)
- **API ключи ElevenLabs** (для озвучки)
- **API ключи Pexels** (для поиска видео)
- **API ключи Creatomate** (для финального рендеринга)
- API ключи OpenAI (для ShortGPT, опционально)

## 🛠 Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd Video
```

2. Установите зависимости:
```bash
npm install
```

3. Установите ShortGPT:
```bash
# Автоматическая установка
./scripts/install-shortgpt.sh

# Или вручную
cd python
pip3 install -r requirements.txt
```

4. Настройте API ключи:
   - Откройте файл `config/apiKeys.json`
   - Замените ключи на ваши реальные:
     - Perplexity API ключи
     - ElevenLabs API ключи
     - OpenAI API ключ (для ShortGPT)
     - Pexels API ключ (для фоновых изображений)

## 🎯 Использование

### Запуск сервера

```bash
# Обычный запуск
npm start

# Запуск в режиме разработки
npm run dev
```

Сервер будет доступен по адресу: `http://localhost:3000`

### Генерация контента через скрипт

```bash
npm run generate
```

Интерактивный скрипт позволит:
- Ввести тему видео
- Выбрать язык
- Автоматически сгенерировать весь контент
- Сохранить результат в базу данных

### Использование API

#### Генерация контента
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Искусственный интеллект", "language": "ru"}'
```

#### Полная генерация видео (контент + озвучка)
```bash
curl -X POST http://localhost:3000/api/generate-full \
  -H "Content-Type: application/json" \
  -d '{"topic": "Искусственный интеллект", "language": "ru", "generateVoiceover": true}'
```

#### Полная генерация видео (контент + озвучка + видео)
```bash
curl -X POST http://localhost:3000/api/generate-full-video \
  -H "Content-Type: application/json" \
  -d '{"topic": "Искусственный интеллект", "language": "ru"}'
```

### 🚀 Новый улучшенный пайплайн (v2.0)

#### Полный автоматизированный пайплайн
```bash
curl -X POST http://localhost:3000/api/pipeline/generate-full-video \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "как выбрать смартфон",
    "language": "ru",
    "options": {
      "templateId": "your-creatomate-template-id"
    }
  }'
```

#### Проверка доступности всех сервисов
```bash
curl -X POST http://localhost:3000/api/pipeline/check-services
```

#### Статус видео в пайплайне
```bash
curl http://localhost:3000/api/pipeline/status/VIDEO_ID
```

#### Генерация детального сценария
```bash
curl -X POST http://localhost:3000/api/perplexity/detailed-script \
  -H "Content-Type: application/json" \
  -d '{"topic": "как выбрать смартфон", "language": "ru"}'
```

#### Поиск видео в Pexels
```bash
curl -X POST http://localhost:3000/api/pexels/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "смартфон",
    "options": {
      "orientation": "portrait",
      "per_page": 10,
      "min_duration": 5,
      "max_duration": 30
    }
  }'
```

#### Создание рендера в Creatomate
```bash
curl -X POST http://localhost:3000/api/creatomate/create-render \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "your-template-id",
    "modifications": {
      "Music.source": "https://your-audio-url.mp3",
      "Background-1.source": "https://video-url.mp4",
      "Text-1.text": "Текст первой сцены"
    }
  }'
```

#### Генерация озвучки для существующего видео
```bash
curl -X POST http://localhost:3000/api/generate-voiceover/VIDEO_ID \
  -H "Content-Type: application/json" \
  -d '{"language": "ru"}'
```

#### Получить доступные голоса
```bash
curl http://localhost:3000/api/voices
```

#### Скачать аудио файл
```bash
curl -O http://localhost:3000/api/audio/VIDEO_ID
```

#### Получить все видео
```bash
curl http://localhost:3000/api/videos
```

#### Поиск видео
```bash
curl http://localhost:3000/api/videos/search/искусственный
```

#### Видео по языку
```bash
curl http://localhost:3000/api/videos/language/ru
```

### ShortGPT Endpoints

#### Проверка доступности ShortGPT
```bash
curl -X POST http://localhost:3000/api/shortgpt/check
```

#### Установка зависимостей ShortGPT
```bash
curl -X POST http://localhost:3000/api/shortgpt/install
```

#### Настройка конфигурации ShortGPT
```bash
curl -X POST http://localhost:3000/api/shortgpt/config \
  -H "Content-Type: application/json" \
  -d '{
    "openai_key": "your-openai-key",
    "elevenlabs_key": "your-elevenlabs-key", 
    "pexels_key": "your-pexels-key",
    "voice_name": "Charlie",
    "language": "ru"
  }'
```

#### Создание видео через ShortGPT
```bash
curl -X POST http://localhost:3000/api/shortgpt/create-video/VIDEO_ID \
  -H "Content-Type: application/json" \
  -d '{"scriptText": "Ваш текст для озвучки"}'
```

#### Получение информации о видео
```bash
curl http://localhost:3000/api/shortgpt/video/VIDEO_ID
```

#### Удаление видео
```bash
curl -X DELETE http://localhost:3000/api/shortgpt/video/VIDEO_ID
```

## 📁 Структура проекта

```
Video/
├── config/
│   └── apiKeys.json          # API ключи (Perplexity, ElevenLabs, OpenAI, Pexels)
├── data/
│   ├── videos.json           # JSON база данных
│   ├── audio/                # Сгенерированные аудио файлы
│   └── videos/               # Сгенерированные видео файлы
├── services/
│   ├── perplexityService.js  # Сервис для работы с Perplexity API
│   ├── elevenLabsService.js  # Сервис для работы с ElevenLabs API
│   ├── shortGptService.js    # Сервис для работы с ShortGPT
│   └── dataService.js        # Сервис для работы с данными
├── python/
│   ├── video_creator.py      # Python скрипт для ShortGPT
│   ├── config.json           # Конфигурация ShortGPT
│   └── requirements.txt      # Python зависимости
├── scripts/
│   ├── generateContent.js    # Скрипт генерации контента
│   └── install-shortgpt.sh   # Скрипт установки ShortGPT
├── server.js                 # Основной сервер Express
├── package.json
└── README.md
```

## 🔧 API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| **Основные** |
| GET | `/` | Информация о API |
| POST | `/api/generate` | Генерация контента |
| POST | `/api/generate-full` | Полная генерация (контент + озвучка) |
| POST | `/api/generate-full-video` | Полная генерация (контент + озвучка + видео) |
| POST | `/api/generate-voiceover/:id` | Генерация озвучки для видео |
| **ElevenLabs** |
| GET | `/api/voices` | Доступные голоса ElevenLabs |
| GET | `/api/audio/:id` | Скачать аудио файл |
| **ShortGPT** |
| POST | `/api/shortgpt/check` | Проверка доступности ShortGPT |
| POST | `/api/shortgpt/install` | Установка зависимостей ShortGPT |
| POST | `/api/shortgpt/config` | Настройка конфигурации ShortGPT |
| POST | `/api/shortgpt/create-video/:id` | Создание видео через ShortGPT |
| GET | `/api/shortgpt/video/:id` | Информация о видео |
| DELETE | `/api/shortgpt/video/:id` | Удалить видео |
| **Управление** |
| GET | `/api/videos` | Все видео |
| GET | `/api/videos/:id` | Видео по ID |
| GET | `/api/videos/search/:query` | Поиск видео |
| GET | `/api/videos/language/:lang` | Видео по языку |
| GET | `/api/videos/topic/:topic` | Видео по теме |
| PUT | `/api/videos/:id` | Обновить видео |
| DELETE | `/api/videos/:id` | Удалить видео |
| GET | `/api/stats` | Статистика |

## 📝 Формат данных

### Запрос генерации
```json
{
  "topic": "Тема видео",
  "language": "ru"
}
```

### Ответ генерации
```json
{
  "id": "uuid",
  "topic": "Тема видео",
  "language": "ru",
  "title": "Название видео",
  "description": "Описание с хештегами",
  "script": "Полный сценарий",
  "keywords": "ключевые, слова, через, запятую",
  "voiceoverText": "Текст для озвучки видео",
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "status": "success"
}
```

## 🌍 Поддерживаемые языки

- Русский (ru)
- English (en)
- Español (es)
- Français (fr)
- Deutsch (de)
- Italiano (it)
- Português (pt)
- 中文 (zh)
- 日本語 (ja)
- 한국어 (ko)

## 🔑 Настройка API ключей

1. Получите API ключи на [Perplexity AI](https://www.perplexity.ai/)
2. Откройте `config/apiKeys.json`
3. Замените ключи на ваши:

```json
{
  "perplexityKeys": [
    "pplx-your-actual-key-1",
    "pplx-your-actual-key-2",
    "pplx-your-actual-key-3"
  ]
}
```

## 🚨 Важные замечания

- API ключи ротируются автоматически для избежания лимитов
- Все данные сохраняются в локальном JSON файле
- Рекомендуется регулярно создавать резервные копии файла `data/videos.json`
- Для продакшена рекомендуется использовать настоящую базу данных

## 🐛 Устранение неполадок

### Ошибка "No Perplexity API keys found"
- Проверьте файл `config/apiKeys.json`
- Убедитесь, что ключи указаны правильно

### Ошибка API Perplexity
- Проверьте валидность API ключей
- Убедитесь, что у вас есть доступ к Perplexity API
- Проверьте интернет-соединение

### Ошибка сохранения данных
- Убедитесь, что папка `data` существует
- Проверьте права на запись в папку проекта

## 📈 Планы развития

- [ ] Интеграция с базами данных (MongoDB, PostgreSQL)
- [ ] Аутентификация и авторизация
- [ ] Веб-интерфейс для управления
- [ ] Интеграция с другими AI сервисами
- [ ] Экспорт в различные форматы
- [ ] Планировщик задач
- [ ] Аналитика и метрики

## 📄 Лицензия

MIT License

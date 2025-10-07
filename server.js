const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const PerplexityService = require('./services/perplexityService');
const DataService = require('./services/dataService');
const ElevenLabsService = require('./services/elevenLabsService');
const ShortGptService = require('./services/shortGptService');
const PexelsService = require('./services/pexelsService');
const CreatomateService = require('./services/creatomateService');
const VideoPipelineService = require('./services/videoPipelineService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Инициализация сервисов
const perplexityService = new PerplexityService();
const dataService = new DataService();
const elevenLabsService = new ElevenLabsService();
const shortGptService = new ShortGptService();
const pexelsService = new PexelsService();
const creatomateService = new CreatomateService();
const videoPipelineService = new VideoPipelineService();

// Middleware для логирования
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Маршруты API

// Главная страница
app.get('/', (req, res) => {
  res.json({
    message: 'AI Video Generator API - Enhanced Pipeline',
    version: '2.0.0',
    status: 'running',
    features: [
      'Генерация контента через Perplexity API',
      'Создание озвучки через ElevenLabs API',
      'Поиск видео через Pexels API',
      'Умный отбор видео через Perplexity',
      'Создание финального видео через Creatomate',
      'Полный автоматизированный пайплайн'
    ],
    endpoints: {
      // 🚀 НОВЫЙ УЛУЧШЕННЫЙ ПАЙПЛАЙН
      'POST /api/pipeline/generate-full-video': '🚀 НОВЫЙ: Полный улучшенный пайплайн',
      'GET /api/pipeline/status/:videoId': 'Статус видео в пайплайне',
      'POST /api/pipeline/check-services': 'Проверка доступности всех сервисов',
      
      // Perplexity API
      'POST /api/perplexity/detailed-script': 'Генерация детального сценария с JSON структурой',
      'POST /api/perplexity/select-video': 'Умный выбор лучшего видео для сцены',
      
      // Pexels API
      'POST /api/pexels/search': 'Поиск вертикальных видео в Pexels',
      
      // Creatomate API
      'POST /api/creatomate/create-render': 'Создание рендера в Creatomate',
      'GET /api/creatomate/render-status/:renderId': 'Статус рендера в Creatomate',
      
      // Старые endpoints (для совместимости)
      'POST /api/generate': 'Генерация контента для видео (старый метод)',
      'POST /api/generate-full': 'Полная генерация видео (контент + озвучка)',
      'POST /api/generate-full-video': 'Полная генерация видео (контент + озвучка + видео)',
      'POST /api/generate-voiceover/:id': 'Генерация озвучки для существующего видео',
      
      // ElevenLabs endpoints
      'GET /api/voices': 'Получить доступные голоса ElevenLabs',
      'GET /api/audio/:id': 'Скачать аудио файл озвучки',
      
      // ShortGPT endpoints
      'POST /api/shortgpt/check': 'Проверка доступности ShortGPT',
      'POST /api/shortgpt/install': 'Установка зависимостей ShortGPT',
      'POST /api/shortgpt/config': 'Обновление конфигурации ShortGPT',
      'POST /api/shortgpt/create-video/:id': 'Создание видео через ShortGPT',
      'GET /api/shortgpt/video/:id': 'Получить информацию о видео',
      'DELETE /api/shortgpt/video/:id': 'Удалить видео',
      
      // Управление видео
      'GET /api/videos': 'Получить все видео',
      'GET /api/videos/:id': 'Получить видео по ID',
      'GET /api/videos/search/:query': 'Поиск видео',
      'GET /api/videos/language/:lang': 'Видео по языку',
      'GET /api/videos/topic/:topic': 'Видео по теме',
      'DELETE /api/videos/:id': 'Удалить видео',
      
      // Статистика
      'GET /api/stats': 'Получить статистику системы'
    },
    usage: {
      // 🚀 Новый улучшенный пайплайн
      newPipeline: {
        method: 'POST',
        url: '/api/pipeline/generate-full-video',
        body: { 
          topic: 'как выбрать смартфон', 
          language: 'ru',
          options: {
            templateId: 'your-creatomate-template-id' // опционально
          }
        },
        description: 'Полный автоматизированный пайплайн: сценарий → поиск видео → отбор → аудио → финальное видео'
      },
      
      // Старые методы (для совместимости)
      generate: {
        method: 'POST',
        url: '/api/generate',
        body: { topic: 'ваша тема', language: 'ru' }
      }
    },
    pipeline: {
      stages: [
        '1. Генерация детального сценария через Perplexity',
        '2. Поиск видео для каждой сцены через Pexels',
        '3. Умный отбор лучших видео через Perplexity',
        '4. Генерация аудио через ElevenLabs',
        '5. Создание финального видео через Creatomate'
      ],
      benefits: [
        'Автоматический поиск релевантных видео',
        'Умный отбор на основе AI анализа',
        'Профессиональное качество рендеринга',
        'Вертикальный формат для TikTok/Shorts',
        'Полная автоматизация процесса'
      ]
    }
  });
});

// Генерация контента
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, language = 'ru' } = req.body;

    if (!topic) {
      return res.status(400).json({
        error: 'Тема видео обязательна',
        status: 'error'
      });
    }

    console.log(`Генерация контента: ${topic} (${language})`);
    
    const result = await perplexityService.generateVideoContent(topic, language);
    
    if (result.status === 'error') {
      return res.status(500).json(result);
    }

    const savedVideo = await dataService.saveVideo(result);
    
    res.json({
      ...savedVideo,
      message: 'Контент успешно сгенерирован'
    });

  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Полный процесс генерации видео (контент + озвучка)
app.post('/api/generate-full', async (req, res) => {
  try {
    const { topic, language = 'ru', generateVoiceover = true } = req.body;

    if (!topic) {
      return res.status(400).json({
        error: 'Тема видео обязательна',
        status: 'error'
      });
    }

    console.log(`Полная генерация видео: ${topic} (${language})`);
    
    // Шаг 1: Генерируем контент
    const contentResult = await perplexityService.generateVideoContent(topic, language);
    
    if (contentResult.status === 'error') {
      return res.status(500).json(contentResult);
    }

    // Сохраняем базовый контент
    const savedVideo = await dataService.saveVideo(contentResult);

    let voiceoverData = null;

    // Шаг 2: Генерируем озвучку (если запрошено)
    if (generateVoiceover && contentResult.voiceoverText) {
      try {
        console.log('Генерация озвучки...');
        voiceoverData = await elevenLabsService.generateAndSaveVoiceover(
          contentResult.voiceoverText,
          savedVideo.id,
          language
        );
        
        // Обновляем видео с данными озвучки
        await dataService.updateVideo(savedVideo.id, {
          voiceover: {
            filename: voiceoverData.filename,
            filePath: voiceoverData.filePath,
            fileSize: voiceoverData.fileSize,
            voiceId: voiceoverData.voiceId,
            generatedAt: voiceoverData.generatedAt
          }
        });

        console.log('Озвучка успешно сгенерирована');
      } catch (voiceoverError) {
        console.error('Ошибка генерации озвучки:', voiceoverError.message);
        // Не прерываем процесс, если озвучка не удалась
      }
    }

    // Получаем обновленные данные видео
    const finalVideo = await dataService.getVideoById(savedVideo.id);
    
    res.json({
      ...finalVideo,
      message: 'Видео полностью сгенерировано',
      voiceoverGenerated: !!voiceoverData
    });

  } catch (error) {
    console.error('Error in /api/generate-full:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Генерация только озвучки для существующего видео
app.post('/api/generate-voiceover/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { language = 'ru' } = req.body;

    // Получаем видео
    const video = await dataService.getVideoById(videoId);
    if (!video) {
      return res.status(404).json({
        error: 'Видео не найдено',
        status: 'error'
      });
    }

    if (!video.voiceoverText) {
      return res.status(400).json({
        error: 'У видео нет текста для озвучки',
        status: 'error'
      });
    }

    console.log(`Генерация озвучки для видео: ${video.title}`);
    
    // Генерируем озвучку
    const voiceoverData = await elevenLabsService.generateAndSaveVoiceover(
      video.voiceoverText,
      videoId,
      language
    );

    // Обновляем видео с данными озвучки
    const updatedVideo = await dataService.updateVideo(videoId, {
      voiceover: {
        filename: voiceoverData.filename,
        filePath: voiceoverData.filePath,
        fileSize: voiceoverData.fileSize,
        voiceId: voiceoverData.voiceId,
        generatedAt: voiceoverData.generatedAt
      }
    });

    res.json({
      video: updatedVideo,
      voiceover: voiceoverData,
      message: 'Озвучка успешно сгенерирована'
    });

  } catch (error) {
    console.error('Error in /api/generate-voiceover:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Получить доступные голоса ElevenLabs
app.get('/api/voices', async (req, res) => {
  try {
    const voices = await elevenLabsService.getVoices();
    res.json({
      voices: voices.voices,
      count: voices.voices.length,
      status: 'success'
    });
  } catch (error) {
    console.error('Error in /api/voices:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Скачать аудио файл озвучки
app.get('/api/audio/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await dataService.getVideoById(videoId);
    if (!video || !video.voiceover) {
      return res.status(404).json({
        error: 'Аудио файл не найден',
        status: 'error'
      });
    }

    const audioPath = video.voiceover.filePath;
    
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({
        error: 'Аудио файл не найден на диске',
        status: 'error'
      });
    }

    res.download(audioPath, video.voiceover.filename);

  } catch (error) {
    console.error('Error in /api/audio:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Получить все видео
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await dataService.getAllVideos();
    res.json({
      videos,
      count: videos.length,
      status: 'success'
    });
  } catch (error) {
    console.error('Error in /api/videos:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Получить видео по ID
app.get('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await dataService.getVideoById(id);
    
    if (!video) {
      return res.status(404).json({
        error: 'Видео не найдено',
        status: 'error'
      });
    }

    res.json({
      video,
      status: 'success'
    });
  } catch (error) {
    console.error('Error in /api/videos/:id:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Поиск видео
app.get('/api/videos/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const videos = await dataService.searchVideos(query);
    
    res.json({
      videos,
      count: videos.length,
      query,
      status: 'success'
    });
  } catch (error) {
    console.error('Error in /api/videos/search:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Видео по языку
app.get('/api/videos/language/:lang', async (req, res) => {
  try {
    const { lang } = req.params;
    const videos = await dataService.getVideosByLanguage(lang);
    
    res.json({
      videos,
      count: videos.length,
      language: lang,
      status: 'success'
    });
  } catch (error) {
    console.error('Error in /api/videos/language:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Видео по теме
app.get('/api/videos/topic/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const videos = await dataService.getVideosByTopic(topic);
    
    res.json({
      videos,
      count: videos.length,
      topic,
      status: 'success'
    });
  } catch (error) {
    console.error('Error in /api/videos/topic:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Обновить видео
app.put('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedVideo = await dataService.updateVideo(id, updateData);
    
    res.json({
      video: updatedVideo,
      message: 'Видео успешно обновлено',
      status: 'success'
    });
  } catch (error) {
    console.error('Error in PUT /api/videos/:id:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Удалить видео
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dataService.deleteVideo(id);
    
    res.json({
      message: 'Видео успешно удалено',
      status: 'success'
    });
  } catch (error) {
    console.error('Error in DELETE /api/videos/:id:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// Статистика
app.get('/api/stats', async (req, res) => {
  try {
    const videos = await dataService.getAllVideos();
    
    const stats = {
      totalVideos: videos.length,
      languages: {},
      topics: {},
      recentVideos: videos
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };

    // Подсчет по языкам
    videos.forEach(video => {
      const lang = video.language || 'unknown';
      stats.languages[lang] = (stats.languages[lang] || 0) + 1;
    });

    // Подсчет по темам (первые 10)
    const topicCounts = {};
    videos.forEach(video => {
      const topic = video.topic || 'unknown';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    stats.topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    res.json({
      stats,
      status: 'success'
    });
  } catch (error) {
    console.error('Error in /api/stats:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// ==================== SHORTGPT ENDPOINTS ====================

// POST /api/shortgpt/check - Проверка доступности ShortGPT
app.post('/api/shortgpt/check', async (req, res) => {
  try {
    console.log('🔍 Проверяем доступность ShortGPT...');
    
    const isAvailable = await shortGptService.checkShortGptAvailability();
    
    res.json({
      available: isAvailable,
      message: isAvailable ? 'ShortGPT доступен' : 'ShortGPT недоступен',
      status: 'success'
    });
  } catch (error) {
    console.error('Error checking ShortGPT:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// POST /api/shortgpt/install - Установка зависимостей ShortGPT
app.post('/api/shortgpt/install', async (req, res) => {
  try {
    console.log('📦 Устанавливаем зависимости ShortGPT...');
    
    await shortGptService.installDependencies();
    
    res.json({
      message: 'Зависимости ShortGPT установлены',
      status: 'success'
    });
  } catch (error) {
    console.error('Error installing ShortGPT dependencies:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// POST /api/shortgpt/config - Обновление конфигурации ShortGPT
app.post('/api/shortgpt/config', async (req, res) => {
  try {
    const config = req.body;
    console.log('🔧 Обновляем конфигурацию ShortGPT...');
    
    await shortGptService.updateConfig(config);
    
    res.json({
      message: 'Конфигурация ShortGPT обновлена',
      status: 'success'
    });
  } catch (error) {
    console.error('Error updating ShortGPT config:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// POST /api/shortgpt/create-video/:videoId - Создание видео через ShortGPT
app.post('/api/shortgpt/create-video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { scriptText, options = {} } = req.body;
    
    if (!scriptText) {
      return res.status(400).json({
        error: 'Текст скрипта обязателен',
        status: 'error'
      });
    }
    
    console.log(`🎬 Создаем видео через ShortGPT для ID: ${videoId}`);
    
    const result = await shortGptService.createVideo(scriptText, videoId, options);
    
    if (result.success) {
      // Обновляем информацию о видео в базе данных
      const video = dataService.getVideoById(videoId);
      if (video) {
        dataService.updateVideo(videoId, {
          videoFile: path.basename(result.videoPath),
          videoPath: result.videoPath,
          videoGeneratedAt: new Date().toISOString(),
          videoSize: result.fileSize
        });
      }
      
      res.json({
        message: 'Видео успешно создано',
        videoId: result.videoId,
        videoPath: result.videoPath,
        fileSize: result.fileSize,
        status: 'success'
      });
    } else {
      res.status(500).json({
        error: result.message || 'Ошибка создания видео',
        status: 'error'
      });
    }
  } catch (error) {
    console.error('Error creating video with ShortGPT:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// GET /api/shortgpt/video/:videoId - Получение информации о видео
app.get('/api/shortgpt/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const videoInfo = await shortGptService.getVideoInfo(videoId);
    
    res.json({
      videoId: videoId,
      ...videoInfo,
      status: 'success'
    });
  } catch (error) {
    console.error('Error getting video info:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// DELETE /api/shortgpt/video/:videoId - Удаление видео
app.delete('/api/shortgpt/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const deleted = await shortGptService.deleteVideo(videoId);
    
    res.json({
      message: deleted ? 'Видео удалено' : 'Видео не найдено',
      deleted: deleted,
      status: 'success'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// POST /api/generate-full-video - Полная генерация: контент + озвучка + видео
app.post('/api/generate-full-video', async (req, res) => {
  try {
    const { topic, language = 'ru', options = {} } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        error: 'Тема обязательна',
        status: 'error'
      });
    }
    
    console.log(`🎬 Полная генерация видео: ${topic} (${language})`);
    
    // Шаг 1: Генерация контента
    console.log('📝 Генерируем контент...');
    const contentResult = await perplexityService.generateVideoContent(topic, language);
    
    // Шаг 2: Сохранение в базу данных
    const videoId = dataService.generateId();
    const videoData = {
      id: videoId,
      topic: topic,
      language: language,
      title: contentResult.title.content,
      description: contentResult.description.content,
      script: contentResult.script.content,
      keywords: contentResult.keywords.content,
      voiceoverText: contentResult.voiceoverText.content,
      thinking: {
        title: contentResult.title.thinking,
        description: contentResult.description.thinking,
        script: contentResult.script.thinking,
        keywords: contentResult.keywords.thinking,
        voiceoverText: contentResult.voiceoverText.thinking
      },
      createdAt: new Date().toISOString(),
      status: 'content_generated'
    };
    
    dataService.saveVideo(videoData);
    console.log(`Video saved with ID: ${videoId}`);
    
    // Шаг 3: Генерация озвучки
    console.log('🎤 Генерируем озвучку...');
    const voiceoverResult = await elevenLabsService.generateAndSaveVoiceover(
      contentResult.voiceoverText.content, 
      videoId, 
      language
    );
    
    // Обновляем статус
    dataService.updateVideo(videoId, { 
      status: 'voiceover_generated',
      audioFile: voiceoverResult.filename,
      audioPath: voiceoverResult.filePath,
      audioGeneratedAt: voiceoverResult.generatedAt
    });
    
    // Шаг 4: Создание видео через ShortGPT
    console.log('🎬 Создаем видео через ShortGPT...');
    const videoResult = await shortGptService.createVideo(
      contentResult.voiceoverText.content, 
      videoId, 
      { language, ...options }
    );
    
    if (videoResult.success) {
      // Финальное обновление статуса
      dataService.updateVideo(videoId, {
        status: 'video_generated',
        videoFile: path.basename(videoResult.videoPath),
        videoPath: videoResult.videoPath,
        videoGeneratedAt: new Date().toISOString(),
        videoSize: videoResult.fileSize
      });
      
      res.json({
        message: 'Полное видео успешно создано',
        videoId: videoId,
        content: contentResult,
        voiceover: {
          filename: voiceoverResult.filename,
          fileSize: voiceoverResult.fileSize
        },
        video: {
          path: videoResult.videoPath,
          fileSize: videoResult.fileSize
        },
        status: 'success'
      });
    } else {
      res.status(500).json({
        error: 'Ошибка создания видео',
        videoId: videoId,
        content: contentResult,
        voiceover: {
          filename: voiceoverResult.filename,
          fileSize: voiceoverResult.fileSize
        },
        status: 'error'
      });
    }
    
  } catch (error) {
    console.error('Error in full video generation:', error);
    res.status(500).json({
      error: error.message,
      status: 'error'
    });
  }
});

// ==================== НОВЫЕ ENDPOINTS ДЛЯ УЛУЧШЕННОГО ПАЙПЛАЙНА ====================

// POST /api/pipeline/generate-full-video - Полный пайплайн генерации видео
app.post('/api/pipeline/generate-full-video', async (req, res) => {
  try {
    const { topic, language = 'ru', options = {} } = req.body;

    if (!topic) {
      return res.status(400).json({
        error: 'Тема видео обязательна',
        status: 'error'
      });
    }

    console.log(`🚀 Запуск полного пайплайна для темы: ${topic}`);
    
    const result = await videoPipelineService.generateFullVideo(topic, language, options);
    
    if (result.success) {
      res.json({
        success: true,
        videoId: result.videoId,
        videoUrl: result.videoUrl,
        audioUrl: result.audioUrl,
        duration: result.duration,
        message: 'Видео успешно создано через полный пайплайн'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        videoId: result.videoId
      });
    }
  } catch (error) {
    console.error('Error in full pipeline:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    });
  }
});

// GET /api/pipeline/status/:videoId - Статус видео в пайплайне
app.get('/api/pipeline/status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const result = await videoPipelineService.getVideoStatus(videoId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error getting video status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    });
  }
});

// POST /api/pipeline/check-services - Проверка доступности всех сервисов
app.post('/api/pipeline/check-services', async (req, res) => {
  try {
    const result = await videoPipelineService.checkAllServices();
    res.json(result);
  } catch (error) {
    console.error('Error checking services:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    });
  }
});

// POST /api/pexels/search - Поиск видео в Pexels
app.post('/api/pexels/search', async (req, res) => {
  try {
    const { query, options = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Поисковый запрос обязателен',
        status: 'error'
      });
    }

    const result = await pexelsService.searchVideos(query, options);
    res.json(result);
  } catch (error) {
    console.error('Error searching Pexels:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    });
  }
});

// POST /api/creatomate/create-render - Создание рендера в Creatomate
app.post('/api/creatomate/create-render', async (req, res) => {
  try {
    const { templateId, modifications } = req.body;

    if (!templateId || !modifications) {
      return res.status(400).json({
        error: 'templateId и modifications обязательны',
        status: 'error'
      });
    }

    const result = await creatomateService.createRender(templateId, modifications);
    res.json(result);
  } catch (error) {
    console.error('Error creating Creatomate render:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    });
  }
});

// GET /api/creatomate/render-status/:renderId - Статус рендера в Creatomate
app.get('/api/creatomate/render-status/:renderId', async (req, res) => {
  try {
    const { renderId } = req.params;
    
    const result = await creatomateService.getRenderStatus(renderId);
    res.json(result);
  } catch (error) {
    console.error('Error getting render status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    });
  }
});

// POST /api/perplexity/detailed-script - Генерация детального сценария
app.post('/api/perplexity/detailed-script', async (req, res) => {
  try {
    const { topic, language = 'ru' } = req.body;

    if (!topic) {
      return res.status(400).json({
        error: 'Тема обязательна',
        status: 'error'
      });
    }

    const result = await perplexityService.generateDetailedScript(topic, language);
    res.json(result);
  } catch (error) {
    console.error('Error generating detailed script:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    });
  }
});

// POST /api/perplexity/select-video - Выбор лучшего видео для сцены
app.post('/api/perplexity/select-video', async (req, res) => {
  try {
    const { scene, videoOptions } = req.body;

    if (!scene || !videoOptions) {
      return res.status(400).json({
        error: 'scene и videoOptions обязательны',
        status: 'error'
      });
    }

    const result = await perplexityService.selectBestVideo(scene, videoOptions);
    res.json(result);
  } catch (error) {
    console.error('Error selecting video:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    });
  }
});

// Обработка ошибок 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    status: 'error'
  });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    status: 'error'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 API доступно по адресу: http://localhost:${PORT}`);
  console.log(`📚 Документация: http://localhost:${PORT}/`);
  console.log(`\n🔧 Для генерации контента используйте:`);
  console.log(`   POST http://localhost:${PORT}/api/generate`);
  console.log(`   Body: {"topic": "ваша тема", "language": "ru"}`);
});

module.exports = app;

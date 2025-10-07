const PerplexityService = require('./perplexityService');
const ElevenLabsService = require('./elevenLabsService');
const PexelsService = require('./pexelsService');
const CreatomateService = require('./creatomateService');
const DataService = require('./dataService');
const fs = require('fs-extra');
const path = require('path');

class VideoPipelineService {
  constructor() {
    this.perplexityService = new PerplexityService();
    this.elevenLabsService = new ElevenLabsService();
    this.pexelsService = new PexelsService();
    this.creatomateService = new CreatomateService();
    this.dataService = new DataService();
  }

  // Главный метод пайплайна
  async generateFullVideo(topic, language = 'ru', options = {}) {
    const videoId = this.generateVideoId();
    const startTime = Date.now();
    
    console.log(`🚀 Начинаем полный пайплайн генерации видео`);
    console.log(`📝 Тема: ${topic}`);
    console.log(`🌍 Язык: ${language}`);
    console.log(`🆔 ID видео: ${videoId}`);

    try {
      // Этап 1: Генерация детального сценария
      console.log(`\n📋 ЭТАП 1: Генерация детального сценария`);
      const scriptResult = await this.perplexityService.generateDetailedScript(topic, language);
      
      if (!scriptResult.success) {
        throw new Error(`Ошибка генерации сценария: ${scriptResult.error}`);
      }

      const script = scriptResult.script;
      console.log(`✅ Сценарий создан: ${script.title}`);
      console.log(`📊 Количество сцен: ${script.scenes.length}`);

      // Этап 2: Поиск видео для каждой сцены
      console.log(`\n🎬 ЭТАП 2: Поиск видео через Pexels`);
      const videoSearchResult = await this.pexelsService.searchVideosForScenes(script.scenes, language);
      
      if (!videoSearchResult.success) {
        throw new Error(`Ошибка поиска видео: ${videoSearchResult.error}`);
      }

      console.log(`✅ Найдены видео для всех сцен`);

      // Этап 3: Умный отбор лучших видео
      console.log(`\n🎯 ЭТАП 3: Умный отбор видео через Perplexity`);
      const selectedVideos = [];
      
      for (let i = 0; i < videoSearchResult.results.length; i++) {
        const sceneData = videoSearchResult.results[i];
        const scene = sceneData.scene;
        const videoOptions = sceneData.videos;
        
        if (videoOptions.length === 0) {
          console.log(`⚠️ Нет видео для сцены ${i + 1}, пропускаем`);
          continue;
        }

        // Добавляем ключевое слово поиска к каждому видео
        const videosWithKeywords = videoOptions.map(video => ({
          ...video,
          searchKeyword: sceneData.searchKeywords[0] // Берем первое ключевое слово
        }));

        const selectionResult = await this.perplexityService.selectBestVideo(scene, videosWithKeywords);
        
        if (selectionResult.success) {
          selectedVideos.push({
            scene: scene,
            selectedVideo: selectionResult.selectedVideo,
            reasoning: selectionResult.reasoning,
            allOptions: selectionResult.allOptions
          });
          console.log(`✅ Выбрано видео для сцены ${i + 1}: ${selectionResult.selectedVideo.id}`);
        } else {
          // Fallback на первое видео
          selectedVideos.push({
            scene: scene,
            selectedVideo: videosWithKeywords[0],
            reasoning: 'Fallback на первое доступное видео',
            allOptions: videosWithKeywords
          });
          console.log(`⚠️ Fallback на первое видео для сцены ${i + 1}`);
        }
      }

      // Этап 4: Генерация аудио
      console.log(`\n🎵 ЭТАП 4: Генерация аудио через ElevenLabs`);
      const fullVoiceoverText = script.scenes.map(scene => scene.voiceoverText).join(' ');
      
      const audioResult = await this.elevenLabsService.generateAndSaveVoiceover(
        fullVoiceoverText,
        videoId,
        language
      );

      if (!audioResult.success) {
        throw new Error(`Ошибка генерации аудио: ${audioResult.error}`);
      }

      console.log(`✅ Аудио создано: ${audioResult.filename}`);

      // Этап 5: Создание видео через Creatomate
      console.log(`\n🎬 ЭТАП 5: Создание финального видео через Creatomate`);
      
      // Подготавливаем данные для Creatomate
      const scenesForCreatomate = selectedVideos.map(sceneData => ({
        scene: sceneData.scene,
        selectedVideo: {
          ...sceneData.selectedVideo,
          videoUrl: this.pexelsService.getVideoFileUrl(sceneData.selectedVideo)
        }
      }));

      const creatomateResult = await this.creatomateService.createVideo(
        scenesForCreatomate,
        audioResult.filePath, // Путь к аудио файлу
        options.templateId
      );

      if (!creatomateResult.success) {
        throw new Error(`Ошибка создания видео в Creatomate: ${creatomateResult.error}`);
      }

      console.log(`✅ Финальное видео создано: ${creatomateResult.url}`);

      // Сохраняем результат в базу данных
      const videoData = {
        id: videoId,
        topic: topic,
        language: language,
        title: script.title,
        description: script.description,
        script: script,
        scenes: selectedVideos,
        audio: {
          filename: audioResult.filename,
          filePath: audioResult.filePath,
          fileSize: audioResult.fileSize,
          generatedAt: audioResult.generatedAt
        },
        video: {
          url: creatomateResult.url,
          status: creatomateResult.status,
          createdAt: creatomateResult.createdAt
        },
        pipeline: {
          totalDuration: Date.now() - startTime,
          stages: {
            scriptGeneration: 'completed',
            videoSearch: 'completed',
            videoSelection: 'completed',
            audioGeneration: 'completed',
            videoCreation: 'completed'
          }
        },
        createdAt: new Date().toISOString()
      };

      await this.dataService.saveVideo(videoData);

      console.log(`\n🎉 ПАЙПЛАЙН ЗАВЕРШЕН УСПЕШНО!`);
      console.log(`⏱️ Общее время: ${Math.round((Date.now() - startTime) / 1000)} секунд`);
      console.log(`🎬 Видео: ${creatomateResult.url}`);

      return {
        success: true,
        videoId: videoId,
        videoData: videoData,
        videoUrl: creatomateResult.url,
        audioUrl: audioResult.filePath,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error(`❌ Ошибка в пайплайне: ${error.message}`);
      
      // Сохраняем ошибку в базу данных
      const errorData = {
        id: videoId,
        topic: topic,
        language: language,
        error: error.message,
        pipeline: {
          totalDuration: Date.now() - startTime,
          stages: {
            scriptGeneration: 'failed',
            videoSearch: 'failed',
            videoSelection: 'failed',
            audioGeneration: 'failed',
            videoCreation: 'failed'
          }
        },
        createdAt: new Date().toISOString()
      };

      await this.dataService.saveVideo(errorData);

      return {
        success: false,
        error: error.message,
        videoId: videoId
      };
    }
  }

  // Генерация ID для видео
  generateVideoId() {
    return 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Проверка доступности всех сервисов
  async checkAllServices() {
    console.log(`🔍 Проверяем доступность всех сервисов...`);
    
    const checks = {
      perplexity: await this.perplexityService.checkAvailability(),
      elevenlabs: await this.elevenLabsService.checkAvailability(),
      pexels: await this.pexelsService.checkAvailability(),
      creatomate: await this.creatomateService.checkAvailability()
    };

    const allAvailable = Object.values(checks).every(status => status === true);
    
    console.log(`📊 Результаты проверки:`);
    console.log(`  Perplexity: ${checks.perplexity ? '✅' : '❌'}`);
    console.log(`  ElevenLabs: ${checks.elevenlabs ? '✅' : '❌'}`);
    console.log(`  Pexels: ${checks.pexels ? '✅' : '❌'}`);
    console.log(`  Creatomate: ${checks.creatomate ? '✅' : '❌'}`);
    
    return {
      allAvailable,
      services: checks
    };
  }

  // Получить статус видео по ID
  async getVideoStatus(videoId) {
    try {
      const video = await this.dataService.getVideoById(videoId);
      
      if (!video) {
        return {
          success: false,
          error: 'Видео не найдено'
        };
      }

      return {
        success: true,
        video: video,
        status: video.pipeline?.stages || {}
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = VideoPipelineService;

const PerplexityService = require('./perplexityService');
const ElevenLabsService = require('./elevenLabsService');
const PexelsService = require('./pexelsService');
const ShotstackService = require('./shotstackService');
const DataService = require('./dataService');
const fs = require('fs-extra');
const path = require('path');

class VideoPipelineService {
  constructor() {
    this.perplexityService = new PerplexityService();
    this.elevenLabsService = new ElevenLabsService();
    this.pexelsService = new PexelsService();
    this.shotstackService = new ShotstackService();
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

    // Создаем базовую запись в базе данных
    let videoData = {
      id: videoId,
      topic: topic,
      language: language,
      status: 'started',
      pipeline: {
        totalDuration: 0,
        stages: {
          scriptGeneration: 'pending',
          videoSearch: 'pending',
          videoSelection: 'pending',
          audioGeneration: 'pending',
          videoCreation: 'pending'
        }
      },
      createdAt: new Date().toISOString()
    };

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

      // Сохраняем результат этапа 1
      videoData.script = script;
      videoData.title = script.title;
      videoData.description = script.description;
      videoData.pipeline.stages.scriptGeneration = 'completed';
      await this.dataService.saveVideo(videoData);
      console.log(`💾 Результат этапа 1 сохранен в базу данных`);

      // Этап 2: Поиск видео для каждой сцены
      console.log(`\n🎬 ЭТАП 2: Поиск видео через Pexels`);
      const videoSearchResult = await this.pexelsService.searchVideosForScenes(script.scenes, language);
      
      if (!videoSearchResult.success) {
        throw new Error(`Ошибка поиска видео: ${videoSearchResult.error}`);
      }

      console.log(`✅ Найдены видео для всех сцен`);

      // Сохраняем результат этапа 2
      videoData.videoSearchResults = videoSearchResult.results;
      videoData.pipeline.stages.videoSearch = 'completed';
      await this.dataService.saveVideo(videoData);
      console.log(`💾 Результат этапа 2 сохранен в базу данных`);

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

      // Сохраняем результат этапа 3
      videoData.selectedVideos = selectedVideos;
      videoData.pipeline.stages.videoSelection = 'completed';
      await this.dataService.saveVideo(videoData);
      console.log(`💾 Результат этапа 3 сохранен в базу данных`);

      // Этап 4: Генерация аудио
console.log(`\n🎵 ЭТАП 4: Генерация аудио через ElevenLabs`);
const fullVoiceoverText = script.scenes.map(scene => scene.voiceoverText).join(' ');

let audioResult;
try {
  audioResult = await this.elevenLabsService.generateAndSaveVoiceover(
    fullVoiceoverText,
    videoId,
    language
  );
  console.log(`✅ Аудио создано: ${audioResult.filename}`);
} catch (error) {
  throw new Error(`Ошибка генерации аудио: ${error.message}`);
}

// Сохраняем результат этапа 4
videoData.audio = {
  filename: audioResult.filename,
  filePath: audioResult.filePath,
  fileSize: audioResult.fileSize,
  generatedAt: audioResult.generatedAt
};
videoData.pipeline.stages.audioGeneration = 'completed';
await this.dataService.saveVideo(videoData);
console.log(`💾 Результат этапа 4 сохранен в базу данных`);


      // Этап 5: Создание видео через Shotstack
      console.log(`\n🎬 ЭТАП 5: Создание финального видео через Shotstack`);
      
      // Подготавливаем данные для Shotstack
      const scenesForShotstack = selectedVideos.map(sceneData => ({
        scene: sceneData.scene,
        selectedVideo: {
          ...sceneData.selectedVideo,
          videoUrl: this.pexelsService.getVideoFileUrl(sceneData.selectedVideo)
        }
      }));

      const shotstackResult = await this.shotstackService.createVideo(
        scenesForShotstack,
        audioResult.filePath, // Путь к аудио файлу
        options
      );

      if (!shotstackResult.success) {
        console.log(`⚠️ Ошибка Shotstack: ${shotstackResult.error}`);
        console.log(`📝 Сохраняем видео без финального рендера`);
        
        // Сохраняем как частично завершенное видео
        videoData.status = 'partial_complete';
        videoData.video = {
          error: shotstackResult.error,
          status: 'shotstack_failed'
        };
        videoData.pipeline.stages.videoCreation = 'failed';
        videoData.pipeline.totalDuration = Date.now() - startTime;
        await this.dataService.saveVideo(videoData);
        
        return {
          success: true,
          videoId: videoId,
          videoData: videoData,
          videoUrl: null,
          audioUrl: audioResult.filePath,
          duration: Date.now() - startTime,
          warning: 'Видео создано без финального рендера из-за ошибки Shotstack'
        };
      }

      console.log(`✅ Финальное видео создано: ${shotstackResult.url}`);

      // Обновляем финальные данные
      videoData.video = {
        url: shotstackResult.url,
        status: shotstackResult.status,
        createdAt: shotstackResult.createdAt
      };
      videoData.status = 'completed';
      videoData.pipeline.stages.videoCreation = 'completed';
      videoData.pipeline.totalDuration = Date.now() - startTime;

      await this.dataService.saveVideo(videoData);
      console.log(`💾 Финальный результат сохранен в базу данных`);

      console.log(`\n🎉 ПАЙПЛАЙН ЗАВЕРШЕН УСПЕШНО!`);
      console.log(`⏱️ Общее время: ${Math.round((Date.now() - startTime) / 1000)} секунд`);
      console.log(`🎬 Видео: ${shotstackResult.url}`);

      return {
        success: true,
        videoId: videoId,
        videoData: videoData,
        videoUrl: shotstackResult.url,
        audioUrl: audioResult.filePath,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error(`❌ Ошибка в пайплайне: ${error.message}`);
      
      // Обновляем существующие данные с ошибкой
      videoData.status = 'failed';
      videoData.error = error.message;
      videoData.pipeline.totalDuration = Date.now() - startTime;
      
      // Определяем на каком этапе произошла ошибка
      if (videoData.pipeline.stages.scriptGeneration === 'completed' && 
          videoData.pipeline.stages.videoSearch === 'pending') {
        videoData.pipeline.stages.videoSearch = 'failed';
      } else if (videoData.pipeline.stages.videoSearch === 'completed' && 
                 videoData.pipeline.stages.videoSelection === 'pending') {
        videoData.pipeline.stages.videoSelection = 'failed';
      } else if (videoData.pipeline.stages.videoSelection === 'completed' && 
                 videoData.pipeline.stages.audioGeneration === 'pending') {
        videoData.pipeline.stages.audioGeneration = 'failed';
      } else if (videoData.pipeline.stages.audioGeneration === 'completed' && 
                 videoData.pipeline.stages.videoCreation === 'pending') {
        videoData.pipeline.stages.videoCreation = 'failed';
      }

      await this.dataService.saveVideo(videoData);
      console.log(`💾 Ошибка сохранена в базу данных`);

      return {
        success: false,
        error: error.message,
        videoId: videoId,
        videoData: videoData
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
      shotstack: await this.shotstackService.checkAvailability()
    };

    const allAvailable = Object.values(checks).every(status => status === true);
    
    console.log(`📊 Результаты проверки:`);
    console.log(`  Perplexity: ${checks.perplexity ? '✅' : '❌'}`);
    console.log(`  ElevenLabs: ${checks.elevenlabs ? '✅' : '❌'}`);
    console.log(`  Pexels: ${checks.pexels ? '✅' : '❌'}`);
    console.log(`  Shotstack: ${checks.shotstack ? '✅' : '❌'}`);
    
    return {
      allAvailable,
      services: checks
    };
  }

  // Продолжить пайплайн с существующим видео
  async continueVideoPipeline(videoId) {
    try {
      const video = await this.dataService.getVideoById(videoId);
      
      if (!video) {
        return {
          success: false,
          error: 'Видео не найдено'
        };
      }

      console.log(`🔄 Продолжаем пайплайн для видео: ${videoId}`);
      console.log(`📝 Тема: ${video.topic}`);
      console.log(`🌍 Язык: ${video.language}`);

      const startTime = Date.now();
      let videoData = video;

      // Проверяем, на каком этапе остановились
      const stages = video.pipeline?.stages || {};
      
      try {
        // Этап 2: Поиск видео (если не завершен)
        if (stages.videoSearch !== 'completed') {
          console.log(`\n🎬 ЭТАП 2: Поиск видео через Pexels`);
          const videoSearchResult = await this.pexelsService.searchVideosForScenes(video.script.scenes, video.language);
          
          if (!videoSearchResult.success) {
            throw new Error(`Ошибка поиска видео: ${videoSearchResult.error}`);
          }

          console.log(`✅ Найдены видео для всех сцен`);

          // Сохраняем результат этапа 2
          videoData.videoSearchResults = videoSearchResult.results;
          videoData.pipeline.stages.videoSearch = 'completed';
          await this.dataService.saveVideo(videoData);
          console.log(`💾 Результат этапа 2 сохранен в базу данных`);
        }

        // Этап 3: Умный отбор видео (если не завершен)
        if (stages.videoSelection !== 'completed') {
          console.log(`\n🎯 ЭТАП 3: Умный отбор видео через Perplexity`);
          const selectedVideos = [];
          
          for (let i = 0; i < videoData.videoSearchResults.length; i++) {
            const sceneData = videoData.videoSearchResults[i];
            const scene = sceneData.scene;
            const videoOptions = sceneData.videos;
            
            if (videoOptions.length === 0) {
              console.log(`⚠️ Нет видео для сцены ${i + 1}, пропускаем`);
              continue;
            }

            // Добавляем ключевое слово поиска к каждому видео
            const videosWithKeywords = videoOptions.map(video => ({
              ...video,
              searchKeyword: sceneData.searchKeywords[0]
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

          // Сохраняем результат этапа 3
          videoData.selectedVideos = selectedVideos;
          videoData.pipeline.stages.videoSelection = 'completed';
          await this.dataService.saveVideo(videoData);
          console.log(`💾 Результат этапа 3 сохранен в базу данных`);
        }

        // Этап 4: Генерация аудио (если не завершен)
        if (stages.audioGeneration !== 'completed') {
          console.log(`\n🎵 ЭТАП 4: Генерация аудио через ElevenLabs`);
          const fullVoiceoverText = video.script.scenes.map(scene => scene.voiceoverText).join(' ');

          let audioResult;
          try {
            audioResult = await this.elevenLabsService.generateAndSaveVoiceover(
              fullVoiceoverText,
              videoId,
              video.language
            );
            console.log(`✅ Аудио создано: ${audioResult.filename}`);
          } catch (error) {
            throw new Error(`Ошибка генерации аудио: ${error.message}`);
          }

          // Сохраняем результат этапа 4
          videoData.audio = {
            filename: audioResult.filename,
            filePath: audioResult.filePath,
            fileSize: audioResult.fileSize,
            generatedAt: audioResult.generatedAt
          };
          videoData.pipeline.stages.audioGeneration = 'completed';
          await this.dataService.saveVideo(videoData);
          console.log(`💾 Результат этапа 4 сохранен в базу данных`);
        }

        // Этап 5: Создание видео через Shotstack (если не завершен)
        if (stages.videoCreation !== 'completed') {
          console.log(`\n🎬 ЭТАП 5: Создание финального видео через Shotstack`);
          
          // Подготавливаем данные для Shotstack
          const scenesForShotstack = videoData.selectedVideos.map(sceneData => ({
            scene: sceneData.scene,
            selectedVideo: {
              ...sceneData.selectedVideo,
              videoUrl: this.pexelsService.getVideoFileUrl(sceneData.selectedVideo)
            }
          }));

          const shotstackResult = await this.shotstackService.createVideo(
            scenesForShotstack,
            videoData.audio.filePath,
            {}
          );

          if (!shotstackResult.success) {
            console.log(`⚠️ Ошибка Shotstack: ${shotstackResult.error}`);
            console.log(`📝 Сохраняем видео без финального рендера`);
            
            // Сохраняем как частично завершенное видео
            videoData.status = 'partial_complete';
            videoData.video = {
              error: shotstackResult.error,
              status: 'shotstack_failed'
            };
            videoData.pipeline.stages.videoCreation = 'failed';
            videoData.pipeline.totalDuration = Date.now() - startTime;
            await this.dataService.saveVideo(videoData);
            
            return {
              success: true,
              videoId: videoId,
              videoData: videoData,
              videoUrl: null,
              audioUrl: videoData.audio.filePath,
              duration: Date.now() - startTime,
              warning: 'Видео создано без финального рендера из-за ошибки Shotstack'
            };
          }

          console.log(`✅ Финальное видео создано: ${shotstackResult.url}`);

          // Обновляем финальные данные
          videoData.video = {
            url: shotstackResult.url,
            status: shotstackResult.status,
            createdAt: shotstackResult.createdAt
          };
          videoData.status = 'completed';
          videoData.pipeline.stages.videoCreation = 'completed';
          videoData.pipeline.totalDuration = Date.now() - startTime;

          await this.dataService.saveVideo(videoData);
          console.log(`💾 Финальный результат сохранен в базу данных`);

          console.log(`\n🎉 ПАЙПЛАЙН ЗАВЕРШЕН УСПЕШНО!`);
          console.log(`⏱️ Общее время: ${Math.round((Date.now() - startTime) / 1000)} секунд`);
          console.log(`🎬 Видео: ${shotstackResult.url}`);

          return {
            success: true,
            videoId: videoId,
            videoData: videoData,
            videoUrl: shotstackResult.url,
            audioUrl: videoData.audio.filePath,
            duration: Date.now() - startTime
          };
        }

        return {
          success: true,
          videoId: videoId,
          videoData: videoData,
          message: 'Пайплайн уже завершен'
        };

      } catch (error) {
        console.error(`❌ Ошибка в пайплайне: ${error.message}`);
        
        // Обновляем существующие данные с ошибкой
        videoData.status = 'failed';
        videoData.error = error.message;
        videoData.pipeline.totalDuration = Date.now() - startTime;
        
        await this.dataService.saveVideo(videoData);
        console.log(`💾 Ошибка сохранена в базу данных`);

        return {
          success: false,
          error: error.message,
          videoId: videoId,
          videoData: videoData
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
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

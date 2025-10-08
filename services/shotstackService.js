const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class ShotstackService {
  constructor() {
    this.apiKeys = this.loadApiKeys();
    this.baseUrl = 'https://api.shotstack.io/edit/stage';
    this.serveUrl = 'https://api.shotstack.io/serve/stage';
  }

  loadApiKeys() {
    try {
      const configPath = path.join(__dirname, '../config/apiKeys.json');
      const config = fs.readJsonSync(configPath);
      return {
        shotstack: config.shotstack
      };
    } catch (error) {
      console.error('❌ Ошибка загрузки конфигурации Shotstack:', error);
      return { shotstack: null };
    }
  }

  getApiKey() {
    if (!this.apiKeys.shotstack || this.apiKeys.shotstack === 'your-shotstack-api-key') {
      throw new Error('Shotstack API ключ не настроен');
    }
    return this.apiKeys.shotstack;
  }

  // Создание рендера
  async createRender(timeline, output = {}) {
    try {
      console.log(`🎬 Создаем рендер в Shotstack`);
      
      const renderData = {
        timeline,
        output: {
          format: 'mp4',
          size: {
            width: 1080,
            height: 1920
          },
          fps: 30,
          ...output
        }
      };

      console.log(`📝 Конфигурация рендера:`, JSON.stringify(renderData, null, 2));
      
      const response = await axios.post(`${this.baseUrl}/render`, renderData, {
        headers: {
          'x-api-key': this.getApiKey(),
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log(`✅ Рендер создан: ${response.data.response.id}`);
      
      return {
        success: true,
        renderId: response.data.response.id,
        message: response.data.message,
        status: 'queued'
      };

    } catch (error) {
      console.error('❌ Ошибка создания рендера в Shotstack:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Проверка статуса рендера
  async getRenderStatus(renderId) {
    try {
      const response = await axios.get(`${this.baseUrl}/render/${renderId}`, {
        headers: {
          'x-api-key': this.getApiKey()
        },
        timeout: 30000
      });

      return {
        success: true,
        renderId: renderId,
        status: response.data.response.status,
        url: response.data.response.url,
        thumbnail: response.data.response.thumbnail,
        createdAt: response.data.response.created,
        updatedAt: response.data.response.updated
      };

    } catch (error) {
      console.error('❌ Ошибка получения статуса рендера:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Ожидание завершения рендера
  async waitForRender(renderId, maxWaitTime = 300000) { // 5 минут максимум
    console.log(`⏳ Ожидаем завершения рендера: ${renderId}`);
    
    const startTime = Date.now();
    const pollInterval = 5000; // Проверяем каждые 5 секунд
    
    while (Date.now() - startTime < maxWaitTime) {
      const statusResult = await this.getRenderStatus(renderId);
      
      if (!statusResult.success) {
        return statusResult;
      }
      
      console.log(`📊 Статус рендера: ${statusResult.status}`);
      
      if (statusResult.status === 'done') {
        console.log(`✅ Рендер завершен успешно!`);
        return statusResult;
      }
      
      if (statusResult.status === 'failed') {
        console.log(`❌ Рендер завершился с ошибкой`);
        return {
          success: false,
          error: 'Render failed',
          status: 'failed'
        };
      }
      
      // Ждем перед следующей проверкой
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    console.log(`⏰ Превышено время ожидания рендера`);
    return {
      success: false,
      error: 'Render timeout',
      status: 'timeout'
    };
  }

  // Создание timeline для видео с аудио и сценами
createTimeline(scenes, audioUrl, options = {}) {
  const totalDuration = scenes.reduce((total, scene) => total + (scene.duration || 15), 0);
  
  console.log(`📊 Создаем timeline: ${scenes.length} сцен, общая длительность: ${totalDuration} сек`);
  
  const timeline = {
    soundtrack: audioUrl ? {
      src: audioUrl,
      effect: 'fadeOut'
    } : undefined,
    tracks: [
      {
        clips: []
      }
    ]
  };

  let currentTime = 0;

  // Добавляем каждую сцену как клип
  scenes.forEach((sceneData, index) => {
    const scene = sceneData.scene || sceneData; // Поддержка обеих структур
    const selectedVideo = sceneData.selectedVideo || sceneData.video;
    const duration = scene.duration || 15;

    // Фоновое видео
    if (selectedVideo && selectedVideo.videoUrl) {
      timeline.tracks[0].clips.push({
        asset: {
          type: 'video',
          src: selectedVideo.videoUrl,
          trim: 0
        },
        start: currentTime,
        length: duration,
        transition: {
          in: 'fade',
          out: 'fade'
        }
      });
    }

    // Текст поверх видео
    if (scene.voiceoverText) {
      timeline.tracks.push({
        clips: [{
          asset: {
            type: 'text',
            text: scene.voiceoverText,
            font: {
              family: 'Arial',
              color: '#ffffff',
              size: 48
            },
            background: {
              color: '#000000',
              borderRadius: 10,
              padding: 20,
              opacity: 0.7
            },
            alignment: {
              horizontal: 'center',
              vertical: 'bottom'
            },
            width: 1000,
            height: 400
          },
          start: currentTime,
          length: duration,
          transition: {
            in: 'fade',
            out: 'fade'
          }
        }]
      });
    }

    currentTime += duration;
  });

  return timeline;
}


  // Полный процесс создания видео
  async createVideo(scenes, audioUrl, options = {}) {
    try {
      console.log(`🎬 Начинаем создание видео в Shotstack`);
      console.log(`📊 Количество сцен: ${scenes.length}`);
      console.log(`🎵 Аудио URL: ${audioUrl}`);
      
      // Создаем timeline
      const timeline = this.createTimeline(scenes, audioUrl, options);
      
      // Создаем рендер
      const renderResult = await this.createRender(timeline, options.output);
      
      if (!renderResult.success) {
        return renderResult;
      }
      
      // Ждем завершения рендера
      const finalResult = await this.waitForRender(renderResult.renderId);
      
      if (finalResult.success) {
        console.log(`🎉 Видео готово: ${finalResult.url}`);
      }
      
      return finalResult;

    } catch (error) {
      console.error('❌ Ошибка создания видео в Shotstack:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Проверить доступность API
  async checkAvailability() {
    try {
      // Простой запрос для проверки доступности API
      const response = await axios.get(`${this.baseUrl}/templates`, {
        headers: {
          'x-api-key': this.getApiKey()
        },
        timeout: 10000
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('❌ Shotstack API недоступен:', error.message);
      return false;
    }
  }

  // Создать шаблон
  async createTemplate(name, timeline, output = {}) {
    try {
      const templateData = {
        name,
        timeline,
        output: {
          format: 'mp4',
          size: {
            width: 1080,
            height: 1920
          },
          fps: 30,
          ...output
        }
      };

      const response = await axios.post(`${this.baseUrl}/templates`, templateData, {
        headers: {
          'x-api-key': this.getApiKey(),
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return {
        success: true,
        templateId: response.data.response.id,
        message: response.data.message
      };

    } catch (error) {
      console.error('❌ Ошибка создания шаблона:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Рендерить шаблон
  async renderTemplate(templateId, merge = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/templates/render`, {
        id: templateId,
        merge
      }, {
        headers: {
          'x-api-key': this.getApiKey(),
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return {
        success: true,
        renderId: response.data.response.id,
        message: response.data.message
      };

    } catch (error) {
      console.error('❌ Ошибка рендеринга шаблона:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = ShotstackService;

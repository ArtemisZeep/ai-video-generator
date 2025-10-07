const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class CreatomateService {
  constructor() {
    this.apiKeys = this.loadApiKeys();
    this.baseUrl = 'https://api.creatomate.com/v2';
  }

  loadApiKeys() {
    try {
      const configPath = path.join(__dirname, '../config/apiKeys.json');
      const config = fs.readJsonSync(configPath);
      return {
        creatomate: config.creatomate
      };
    } catch (error) {
      console.error('❌ Ошибка загрузки конфигурации Creatomate:', error);
      return { creatomate: null };
    }
  }

  getApiKey() {
    if (!this.apiKeys.creatomate || this.apiKeys.creatomate === 'your-creatomate-key') {
      throw new Error('Creatomate API ключ не настроен');
    }
    return this.apiKeys.creatomate;
  }

  async createRender(templateId, modifications) {
    try {
      console.log(`🎬 Создаем рендер в Creatomate с шаблоном: ${templateId}`);
      console.log(`📝 Модификации:`, JSON.stringify(modifications, null, 2));
      
      const response = await axios.post(`${this.baseUrl}/renders`, {
        template_id: templateId,
        modifications: modifications
      }, {
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log(`✅ Рендер создан: ${response.data[0].id}`);
      
      return {
        success: true,
        renderId: response.data[0].id,
        status: response.data[0].status,
        url: response.data[0].url,
        snapshotUrl: response.data[0].snapshot_url,
        createdAt: response.data[0].created_at
      };

    } catch (error) {
      console.error('❌ Ошибка создания рендера в Creatomate:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getRenderStatus(renderId) {
    try {
      const response = await axios.get(`${this.baseUrl}/renders/${renderId}`, {
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`
        },
        timeout: 30000
      });

      return {
        success: true,
        renderId: response.data.id,
        status: response.data.status,
        url: response.data.url,
        snapshotUrl: response.data.snapshot_url,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at
      };

    } catch (error) {
      console.error('❌ Ошибка получения статуса рендера:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

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
      
      if (statusResult.status === 'succeeded') {
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

  // Создать модификации для шаблона на основе сцен и аудио
  createModifications(scenes, audioUrl, templateId) {
    const modifications = {};
    
    // Добавляем аудио
    if (audioUrl) {
      modifications['Music.source'] = audioUrl;
    }
    
    // Добавляем фоновые видео и тексты для каждой сцены
    scenes.forEach((sceneData, index) => {
      const sceneNumber = index + 1;
      
      // Фоновое видео
      if (sceneData.selectedVideo) {
        modifications[`Background-${sceneNumber}.source`] = sceneData.selectedVideo.videoUrl;
      }
      
      // Текст сцены
      if (sceneData.scene.voiceoverText) {
        modifications[`Text-${sceneNumber}.text`] = sceneData.scene.voiceoverText;
      }
      
      // Длительность сцены (если поддерживается шаблоном)
      if (sceneData.scene.duration) {
        modifications[`Scene-${sceneNumber}.duration`] = sceneData.scene.duration;
      }
    });
    
    return modifications;
  }

  // Полный процесс создания видео
  async createVideo(scenes, audioUrl, templateId = 'f193560a-e643-4cf2-93a6-0b0f2a5e08f7') {
    try {
      console.log(`🎬 Начинаем создание видео в Creatomate`);
      console.log(`📊 Количество сцен: ${scenes.length}`);
      console.log(`🎵 Аудио URL: ${audioUrl}`);
      
      // Создаем модификации
      const modifications = this.createModifications(scenes, audioUrl, templateId);
      
      // Создаем рендер
      const renderResult = await this.createRender(templateId, modifications);
      
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
      console.error('❌ Ошибка создания видео в Creatomate:', error);
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
          'Authorization': `Bearer ${this.getApiKey()}`
        },
        timeout: 10000
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('❌ Creatomate API недоступен:', error.message);
      return false;
    }
  }
}

module.exports = CreatomateService;

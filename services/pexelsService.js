const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');

class PexelsService {
  constructor() {
    this.apiKeys = this.loadApiKeys();
    this.currentKeyIndex = 0;
    this.baseUrl = 'https://api.pexels.com/videos';
    
    // Настройка прокси
    const proxyUrl = 'http://b5Cb94Vedc:uN3LHuCUjZ@45.150.35.132:37199';
    this.proxyAgent = new HttpsProxyAgent(proxyUrl);
    
    console.log('🌐 Настроен прокси для Pexels API');
  }

  loadApiKeys() {
    try {
      const configPath = path.join(__dirname, '../config/apiKeys.json');
      const config = fs.readJsonSync(configPath);
      return {
        pexels: config.pexels
      };
    } catch (error) {
      console.error('❌ Ошибка загрузки конфигурации Pexels:', error);
      return { pexels: null };
    }
  }

  getCurrentApiKey() {
    if (!this.apiKeys.pexels || this.apiKeys.pexels === 'your-pexels-key') {
      throw new Error('Pexels API ключ не настроен');
    }
    return this.apiKeys.pexels;
  }

  async searchVideos(query, options = {}) {
    const {
      orientation = 'portrait',
      size = 'large',
      per_page = 80, // Увеличено с 10 до максимума
      page = 1,
      min_duration = 5,
      max_duration = 30,
      locale = 'en-US' // Добавлен параметр локали
    } = options;
  
    try {
      console.log(`🔍 Ищем видео в Pexels для запроса: "${query}" (locale: ${locale})`);
      
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: {
          'Authorization': this.getCurrentApiKey()
        },
        params: {
          query,
          orientation,
          size,
          per_page,
          page,
          min_duration,
          max_duration,
          locale // Добавлено
        },
        httpsAgent: this.proxyAgent,
        httpAgent: this.proxyAgent,
        timeout: 30000
      });
  
      console.log(`✅ Найдено ${response.data.videos.length} видео для "${query}"`);
  
      return {
        success: true,
        videos: response.data.videos.map(video => ({
          id: video.id,
          width: video.width,
          height: video.height,
          url: video.url,
          image: video.image,
          duration: video.duration,
          user: video.user,
          videoFiles: video.video_files.map(file => ({
            id: file.id,
            quality: file.quality,
            fileType: file.file_type,
            width: file.width,
            height: file.height,
            link: file.link
          }))
        })),
        totalResults: response.data.total_results,
        page: response.data.page,
        perPage: response.data.per_page
      };
  
    } catch (error) {
      console.error('❌ Ошибка поиска видео в Pexels:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        videos: []
      };
    }
  }
  

  async searchVideosForScenes(scenes, language = 'en') {
    console.log(`🎬 Ищем видео для ${scenes.length} сцен (язык: ${language})`);
    
    // Определяем локаль
    const localeMap = {
      'ru': 'ru-RU',
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };
    
    const locale = localeMap[language] || 'en-US';
    
    const results = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`\n📝 Сцена ${i + 1}: ${scene.title || `Сцена ${i + 1}`}`);
      console.log(`🔍 Ключевые слова: ${scene.searchKeywords.join(', ')}`);
      
      let bestResults = [];
      
      for (const keyword of scene.searchKeywords) {
        // Сначала пробуем с локалью
        let searchResult = await this.searchVideos(keyword, {
          orientation: 'portrait',
          per_page: 80,
          min_duration: 3,
          max_duration: 20,
          locale: locale
        });
        
        // Если результатов мало и язык не английский, пробуем английский
        if ((!searchResult.success || searchResult.videos.length < 5) && locale !== 'en-US') {
          console.log(`⚠️ Мало результатов для "${keyword}" на ${locale}, пробуем английский`);
          searchResult = await this.searchVideos(keyword, {
            orientation: 'portrait',
            per_page: 80,
            min_duration: 3,
            max_duration: 20,
            locale: 'en-US'
          });
        }
        
        if (searchResult.success && searchResult.videos.length > 0) {
          // Фильтруем по соотношению сторон 9:16 (вертикальное видео)
          const verticalVideos = searchResult.videos.filter(video => {
            const aspectRatio = video.width / video.height;
            // Проверяем соотношение 9:16 = 0.5625 с допуском ±0.05
            return aspectRatio >= 0.51 && aspectRatio <= 0.61;
          });
          
          if (verticalVideos.length > 0) {
            bestResults = [...bestResults, ...verticalVideos];
            console.log(`✅ Найдено ${verticalVideos.length} вертикальных видео для "${keyword}"`);
            if (bestResults.length >= 10) break; // Достаточно видео
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      results.push({
        sceneIndex: i,
        scene: scene,
        videos: bestResults.slice(0, 10),
        searchKeywords: scene.searchKeywords
      });
      
      console.log(`📊 Итого найдено ${bestResults.length} видео для сцены ${i + 1}`);
    }
    
    return {
      success: true,
      results: results,
      totalScenes: scenes.length
    };
  }
  

  // Получить прямую ссылку на видео файл
  getVideoFileUrl(video) {
    // Ищем HD файл с вертикальной ориентацией (9:16)
    const hdVertical = video.videoFiles.find(file => {
      const aspectRatio = file.width / file.height;
      return file.quality === 'hd' && aspectRatio >= 0.51 && aspectRatio <= 0.61;
    });
    
    if (hdVertical) return hdVertical.link;
    
    // Ищем любой HD файл
    const hdFile = video.videoFiles.find(file => file.quality === 'hd');
    if (hdFile) return hdFile.link;
    
    // Ищем любой вертикальный файл
    const verticalFile = video.videoFiles.find(file => {
      const aspectRatio = file.width / file.height;
      return aspectRatio >= 0.51 && aspectRatio <= 0.61;
    });
    
    if (verticalFile) return verticalFile.link;
    
    // В крайнем случае берем первый доступный
    return video.videoFiles[0]?.link;
  }
  

  // Проверить доступность API
  async checkAvailability() {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: {
          'Authorization': this.getCurrentApiKey()
        },
        params: {
          query: 'test',
          per_page: 1
        },
        httpsAgent: this.proxyAgent,
        httpAgent: this.proxyAgent,
        timeout: 10000
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('❌ Pexels API недоступен:', error.message);
      return false;
    }
  }
}

module.exports = PexelsService;

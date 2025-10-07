const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');

class ElevenLabsService {
  constructor() {
    this.apiKeys = this.loadApiKeys();
    this.currentKeyIndex = 0;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    
    // Настройка прокси
    const proxyUrl = 'http://b5Cb94Vedc:uN3LHuCUjZ@45.150.35.132:37199';
    this.proxyAgent = new HttpsProxyAgent(proxyUrl);
    
    console.log('🌐 Настроен прокси для ElevenLabs API');
  }

  loadApiKeys() {
    try {
      const keysPath = path.join(__dirname, '../config/apiKeys.json');
      const keysData = fs.readFileSync(keysPath, 'utf8');
      const { elevenLabsKeys } = JSON.parse(keysData);
      
      if (!elevenLabsKeys || elevenLabsKeys.length === 0) {
        throw new Error('No ElevenLabs API keys found in config file');
      }
      
      return elevenLabsKeys;
    } catch (error) {
      console.error('Error loading ElevenLabs API keys:', error.message);
      throw error;
    }
  }

  getNextApiKey() {
    const key = this.apiKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  async getVoices() {
    try {
      const apiKey = this.getNextApiKey();
      console.log('🔑 Используем API ключ ElevenLabs:', apiKey.substring(0, 10) + '...');
      console.log('🌐 Запрос к ElevenLabs API:', `${this.baseUrl}/voices`);
      
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': apiKey
        },
        maxRedirects: 5, // Позволяем редиректы
        timeout: 30000,
        httpsAgent: this.proxyAgent,
        httpAgent: this.proxyAgent
      });
      
      console.log('✅ ElevenLabs API ответ успешный:', response.status);
      console.log('📊 Количество голосов:', response.data.voices?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка ElevenLabs API:');
      console.error('   Статус:', error.response?.status);
      console.error('   Сообщение:', error.message);
      console.error('   URL:', error.config?.url);
      console.error('   Headers:', error.config?.headers);
      if (error.response?.data) {
        console.error('   Данные ответа:', error.response.data);
      }
      throw error;
    }
  }

  async generateSpeech(text, voiceId = 'pNInz6obpgDQGcFmaJgB', options = {}) {
    try {
      const apiKey = this.getNextApiKey();
      console.log('🔑 Используем API ключ ElevenLabs для генерации речи:', apiKey.substring(0, 10) + '...');
      console.log('🎤 Voice ID:', voiceId);
      console.log('📝 Длина текста:', text.length, 'символов');
      
      const requestData = {
        text: text,
        model_id: options.modelId || 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability || 0.75,
          similarity_boost: options.similarityBoost || 0.85,
          style: options.style || 0.0,
          use_speaker_boost: options.useSpeakerBoost !== undefined ? options.useSpeakerBoost : true
        }
      };
  
      console.log('🌐 Отправляем POST запрос к ElevenLabs API:', `${this.baseUrl}/text-to-speech/${voiceId}`);
      console.log('📊 Параметры запроса:', {
        model_id: requestData.model_id,
        voice_settings: requestData.voice_settings
      });
  
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        requestData,
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 60000,
          maxRedirects: 5, // Позволяем axios следовать редиректам
          httpsAgent: this.proxyAgent,
          httpAgent: this.proxyAgent,
          validateStatus: function (status) {
            // Разрешаем статус 200-399, чтобы избежать выброса ошибки при 302
            return status >= 200 && status < 400;
          }
        }
      );
  
      console.log('✅ ElevenLabs API ответ успешный:', response.status);
      console.log('📊 Размер аудио данных:', response.data.length, 'байт');
  
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка генерации речи ElevenLabs:');
      console.error('   Статус:', error.response?.status);
      console.error('   Сообщение:', error.message);
      console.error('   URL:', error.config?.url);
      console.error('   Headers:', error.config?.headers);
      if (error.response?.data) {
        console.error('   Данные ответа:', error.response.data);
      }
      throw error;
    }
  }
  

  async generateVideoVoiceover(voiceoverText, language = 'ru', options = {}) {
    try {
      console.log(`Генерация озвучки для текста длиной ${voiceoverText.length} символов`);
      
      // Выбираем голос в зависимости от языка
      const voiceId = this.getVoiceForLanguage(language);
      
      // Добавляем аудио-теги для улучшения качества озвучки
      const enhancedText = this.enhanceTextWithAudioTags(voiceoverText, language);
      
      // Генерируем речь
      const audioBuffer = await this.generateSpeech(enhancedText, voiceId, {
        stability: 0.75,
        similarityBoost: 0.85,
        style: 0.2,
        useSpeakerBoost: true,
        ...options
      });

      return {
        audioBuffer,
        voiceId,
        originalText: voiceoverText,
        enhancedText: enhancedText,
        language: language
      };

    } catch (error) {
      console.error('Error generating video voiceover:', error);
      throw error;
    }
  }

  getVoiceForLanguage(language) {
    // Предустановленные голоса для разных языков
    const voiceMap = {
      'ru': 'IKne3meq5aSn9XLyUdCD', // Charlie (энергичный австралийский мужской)
      'en': 'FGY2WhTYpPnrIDTdsKH5', // Laura (энергичная американская женская)
      'es': 'IKne3meq5aSn9XLyUdCD', // Charlie (энергичный, многоязычный)
      'fr': 'IKne3meq5aSn9XLyUdCD', // Charlie (энергичный, многоязычный)
      'de': 'IKne3meq5aSn9XLyUdCD', // Charlie (энергичный, многоязычный)
      'it': 'IKne3meq5aSn9XLyUdCD', // Charlie (энергичный, многоязычный)
      'pt': 'IKne3meq5aSn9XLyUdCD', // Charlie (энергичный, многоязычный)
      'zh': 'IKne3meq5aSn9XLyUdCD', // Charlie (энергичный, многоязычный)
      'ja': 'IKne3meq5aSn9XLyUdCD', // Charlie (энергичный, многоязычный)
      'ko': 'IKne3meq5aSn9XLyUdCD'  // Charlie (энергичный, многоязычный)
    };

    return voiceMap[language] || voiceMap['en'];
  }

  enhanceTextWithAudioTags(text, language) {
    // ElevenLabs не поддерживает теги в квадратных скобках, поэтому просто возвращаем чистый текст
    // Убираем все существующие теги если они есть
    let cleanText = text.replace(/\[[^\]]+\]/g, '').trim();
    
    // Добавляем естественные паузы через знаки препинания
    cleanText = cleanText
      .replace(/\./g, '. ')
      .replace(/\?/g, '? ')
      .replace(/!/g, '! ')
      .replace(/\s+/g, ' ') // Убираем лишние пробелы
      .trim();

    return cleanText;
  }

  async saveAudioFile(audioBuffer, filename) {
    try {
      const audioDir = path.join(__dirname, '../data/audio');
      await fs.ensureDir(audioDir);
      
      const filePath = path.join(audioDir, filename);
      await fs.writeFile(filePath, audioBuffer);
      
      console.log(`Audio file saved: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error saving audio file:', error);
      throw error;
    }
  }

  async generateAndSaveVoiceover(voiceoverText, videoId, language = 'ru') {
    try {
      // Генерируем озвучку
      const voiceoverData = await this.generateVideoVoiceover(voiceoverText, language);
      
      // Создаем имя файла
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `voiceover_${videoId}_${timestamp}.mp3`;
      
      // Сохраняем аудио файл
      const filePath = await this.saveAudioFile(voiceoverData.audioBuffer, filename);
      
      return {
        ...voiceoverData,
        filename: filename,
        filePath: filePath,
        fileSize: voiceoverData.audioBuffer.length,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating and saving voiceover:', error);
      throw error;
    }
  }

  async checkAvailability() {
    try {
      // Простой тестовый запрос для проверки доступности API
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.getCurrentApiKey()
        },
        httpsAgent: this.proxyAgent,
        httpAgent: this.proxyAgent,
        timeout: 10000
      });
      
      console.log(`✅ ElevenLabs API доступен. Статус: ${response.status}`);
      return response.status === 200;
    } catch (error) {
      console.error('❌ ElevenLabs API недоступен:', error.message);
      return false;
    }
  }
}

module.exports = ElevenLabsService;

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class PerplexityService {
  constructor() {
    this.apiKeys = this.loadApiKeys();
    this.currentKeyIndex = 0;
  }

  loadApiKeys() {
    try {
      const keysPath = path.join(__dirname, '../config/apiKeys.json');
      const keysData = fs.readFileSync(keysPath, 'utf8');
      const { perplexityKeys } = JSON.parse(keysData);
      
      if (!perplexityKeys || perplexityKeys.length === 0) {
        throw new Error('No Perplexity API keys found in config file');
      }
      
      return perplexityKeys;
    } catch (error) {
      console.error('Error loading API keys:', error.message);
      throw error;
    }
  }

  getNextApiKey() {
    const key = this.apiKeys[this.currentKeyIndex];
    console.log(`🔑 Используем Perplexity API ключ: ${key.substring(0, 20)}...`);
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  parsePerplexityResponse(content) {
    // Разделяем блок <think> и основной контент
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>\s*([\s\S]*)/);
    
    if (thinkMatch) {
      return {
        thinking: thinkMatch[1].trim(),
        content: thinkMatch[2].trim()
      };
    }
    
    // Если нет блока <think>, возвращаем весь контент
    return {
      thinking: '',
      content: content.trim()
    };
  }

  async makeRequest(prompt, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const apiKey = this.getNextApiKey();
        
        const response = await axios.post(
          'https://api.perplexity.ai/chat/completions',
          {
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'Ты - эксперт по созданию видеоконтента. Создавай качественный, структурированный контент для YouTube видео.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 4000,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000 // Увеличиваем таймаут до 60 секунд
          }
        );

        const fullContent = response.data.choices[0].message.content;
        return this.parsePerplexityResponse(fullContent);
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw new Error(`All API requests failed. Last error: ${lastError.message}`);
  }

  async generateVideoContent(topic, language = 'ru') {
    try {
      console.log(`Генерация контента для темы: "${topic}" на языке: ${language}`);
      
      // Генерируем сценарий
      const scriptPrompt = `Создай подробный сценарий для YouTube видео на тему "${topic}" на языке ${language}. 
      Сценарий должен включать:
      1. Вступление (приветствие, представление темы)
      2. Основную часть (3-5 ключевых пунктов с подробным описанием)
      3. Заключение (резюме, призыв к действию)
      
      Сценарий должен быть готов для озвучки, с естественными переходами между частями.`;

      const scriptResponse = await this.makeRequest(scriptPrompt);
      const script = scriptResponse.content;

      // Генерируем название
      const titlePrompt = `Создай привлекательное название для YouTube видео на тему "${topic}" на языке ${language}. 
      Название должно быть:
      - Цепляющим и интересным
      - Содержать ключевые слова
      - Длиной 50-60 символов
      - В стиле популярных YouTube каналов
      
      Верни только название, без дополнительного текста.`;

      const titleResponse = await this.makeRequest(titlePrompt);
      const title = titleResponse.content;

      // Генерируем описание
      const descriptionPrompt = `Создай описание для YouTube видео с названием "${title}" на тему "${topic}" на языке ${language}.
      Описание должно включать:
      1. Краткое введение в тему (2-3 предложения)
      2. Что зритель узнает из видео (список из 3-5 пунктов)
      3. Призыв к действию (подписка, лайк, комментарий)
      4. Хештеги (5-7 релевантных)
      
      Общая длина: 200-300 слов.`;

      const descriptionResponse = await this.makeRequest(descriptionPrompt);
      const description = descriptionResponse.content;

      // Генерируем ключевые слова
      const keywordsPrompt = `Создай список ключевых слов для YouTube видео "${title}" на тему "${topic}" на языке ${language}.
      Верни 10-15 ключевых слов через запятую, которые помогут в поиске и рекомендациях YouTube.
      Включи как общие термины, так и специфические для темы.`;

      const keywordsResponse = await this.makeRequest(keywordsPrompt);
      const keywords = keywordsResponse.content;

      // Генерируем текст для озвучки
      const voiceoverPrompt = `Создай краткий текст для озвучки YouTube видео "${title}" на тему "${topic}" на языке ${language}.
      Текст должен быть:
      - Готов для голосового воспроизведения
      - Естественным и разговорным
      - Длительностью 45-60 секунд при чтении (короткое видео)
      - Без технических терминов, которые сложно произносить
      - Сжатым и по существу
      
      Структура:
      1. Быстрое приветствие и представление темы (5-10 сек)
      2. 2-3 главных совета или факта (30-40 сек)
      3. Краткое заключение с призывом к действию (5-10 сек)
      
      Пиши так, как будто разговариваешь с другом. Будь кратким и конкретным.`;

      const voiceoverResponse = await this.makeRequest(voiceoverPrompt);
      const voiceoverText = voiceoverResponse.content;

      return {
        topic,
        language,
        title: title.trim(),
        description: description.trim(),
        script: script.trim(),
        keywords: keywords.trim(),
        voiceoverText: voiceoverText.trim(),
        thinking: {
          script: scriptResponse.thinking,
          title: titleResponse.thinking,
          description: descriptionResponse.thinking,
          keywords: keywordsResponse.thinking,
          voiceover: voiceoverResponse.thinking
        },
        generatedAt: new Date().toISOString(),
        status: 'success'
      };

    } catch (error) {
      console.error('Error generating video content:', error);
      return {
        topic,
        language,
        error: error.message,
        generatedAt: new Date().toISOString(),
        status: 'error'
      };
    }
  }

  async generateDetailedScript(topic, language = 'ru') {
    try {
      console.log(`🎬 Генерируем детальный сценарий для видео: "${topic}" на языке: ${language}`);
      
      const prompt = `Создай детальный сценарий для короткого видео (45-60 секунд) на тему "${topic}" на языке ${language}.

Требования:
- Видео должно быть вертикальным (1080x1920) для TikTok/YouTube Shorts
- Разбей на 3-5 сцен по 10-15 секунд каждая
- Для каждой сцены укажи: длительность, текст для озвучки, описание визуала, ключевые слова для поиска видео
- Используй динамичные переходы между сценами

Верни ответ в формате JSON:
{
  "title": "Название видео",
  "description": "Краткое описание",
  "totalDuration": 60,
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": 15,
      "title": "Название сцены",
      "voiceoverText": "Текст для озвучки",
      "visualDescription": "Описание того, что должно быть на экране",
      "searchKeywords": ["ключевое", "слово", "для", "поиска"],
      "transitionType": "cut"
    }
  ]
}`;

      const response = await this.makeRequest(prompt);
      
      if (!response || !response.content) {
        return {
          success: false,
          error: 'Ошибка получения ответа от Perplexity API'
        };
      }

      // Пытаемся распарсить JSON из ответа
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const scriptData = JSON.parse(jsonMatch[0]);
          
          return {
            success: true,
            script: scriptData,
            rawResponse: response.content
          };
        } else {
          throw new Error('JSON не найден в ответе');
        }
      } catch (parseError) {
        console.error('❌ Ошибка парсинга JSON сценария:', parseError);
        return {
          success: false,
          error: 'Не удалось распарсить JSON сценарий',
          rawResponse: response.content
        };
      }

    } catch (error) {
      console.error('❌ Ошибка генерации детального сценария:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async selectBestVideo(scene, videoOptions) {
    try {
      console.log(`🎯 Выбираем лучшее видео для сцены: ${scene.title}`);
      console.log(`📊 Доступно вариантов: ${videoOptions.length}`);
      
      const prompt = `Проанализируй и выбери лучшее видео для сцены из короткого видео.

Сцена:
- Название: ${scene.title}
- Описание визуала: ${scene.visualDescription}
- Текст озвучки: ${scene.voiceoverText}
- Ключевые слова: ${scene.searchKeywords.join(', ')}

Доступные видео:
${videoOptions.map((video, index) => `
${index + 1}. ID: ${video.id}
   - Длительность: ${video.duration} сек
   - Размер: ${video.width}x${video.height}
   - Ключевое слово поиска: ${video.searchKeyword || 'не указано'}
`).join('')}

Выбери номер лучшего видео (1-${videoOptions.length}) и кратко объясни почему.

Формат ответа:
Выбранное видео: [номер]
Обоснование: [краткое объяснение]`;

      const response = await this.makeRequest(prompt);
      
      if (!response || !response.content) {
        return {
          success: false,
          error: 'Ошибка получения ответа от Perplexity API',
          selectedVideo: videoOptions[0] // Fallback на первое видео
        };
      }

      // Парсим выбор
      const selectedMatch = response.content.match(/Выбранное видео:\s*(\d+)/);
      const selectedIndex = selectedMatch ? parseInt(selectedMatch[1]) - 1 : 0;
      
      const selectedVideo = videoOptions[selectedIndex] || videoOptions[0];
      
      return {
        success: true,
        selectedVideo: selectedVideo,
        selectedIndex: selectedIndex,
        reasoning: response.content,
        allOptions: videoOptions
      };

    } catch (error) {
      console.error('❌ Ошибка выбора видео:', error);
      return {
        success: false,
        error: error.message,
        selectedVideo: videoOptions[0] // Fallback на первое видео
      };
    }
  }

  // Получение синонимов и переводов для улучшения поиска видео
  async getSearchSynonyms(keywords, language = 'ru') {
    try {
      const prompt = `Для поиска видео в Pexels мне нужны синонимы и переводы следующих ключевых слов: ${keywords.join(', ')}.

Язык контента: ${language}

Пожалуйста, предоставь:
1. Переводы на английский язык
2. Синонимы на английском языке
3. Связанные термины на английском языке
4. Более общие термины на английском языке

Формат ответа (только список слов через запятую, без объяснений):
word1, word2, word3, word4, word5`;

      const response = await this.makeRequest(prompt);
      
      if (response.success) {
        // Парсим ответ и извлекаем слова
        const content = response.content.toLowerCase();
        const words = content
          .split(/[,\n\r]+/)
          .map(word => word.trim())
          .filter(word => word.length > 2 && word.length < 20)
          .slice(0, 8); // Ограничиваем до 8 слов
        
        console.log(`🔍 Perplexity предложил синонимы: ${words.join(', ')}`);
        return words;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Ошибка получения синонимов:', error.message);
      return [];
    }
  }

  async checkAvailability() {
    try {
      // Простой тестовый запрос для проверки доступности API
      const response = await this.makeRequest('Тест доступности API');
      return response.success;
    } catch (error) {
      console.error('❌ Perplexity API недоступен:', error.message);
      return false;
    }
  }
}

module.exports = PerplexityService;

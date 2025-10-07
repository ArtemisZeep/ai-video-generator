const axios = require('axios');

async function testElevenLabsDirect() {
  const apiKey = 'sk_51b2f83ecfd251cfa0886d30158507d2c56b86ac3596660b';
  const baseUrl = 'https://api.elevenlabs.io/v1';
  
  console.log('🧪 Тестируем ElevenLabs API напрямую...');
  console.log('🔑 API ключ:', apiKey.substring(0, 10) + '...');
  console.log('🌐 Базовый URL:', baseUrl);
  
  try {
    // Тест 1: Получение голосов
    console.log('\n📋 Тест 1: Получение списка голосов...');
    const voicesResponse = await axios.get(`${baseUrl}/voices`, {
      headers: {
        'xi-api-key': apiKey
      },
      timeout: 30000,
      maxRedirects: 5
    });
    
    console.log('✅ Голоса получены успешно!');
    console.log('📊 Статус:', voicesResponse.status);
    console.log('📊 Количество голосов:', voicesResponse.data.voices?.length || 0);
    
    if (voicesResponse.data.voices && voicesResponse.data.voices.length > 0) {
      console.log('🎤 Первый голос:', voicesResponse.data.voices[0].name);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при получении голосов:');
    console.error('   Статус:', error.response?.status);
    console.error('   Сообщение:', error.message);
    console.error('   URL:', error.config?.url);
    if (error.response?.data) {
      console.error('   Данные ответа:', error.response.data);
    }
  }
  
  try {
    // Тест 2: Генерация речи
    console.log('\n🎤 Тест 2: Генерация речи...');
    const text = 'Привет! Это тест ElevenLabs API.';
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
    
    const speechResponse = await axios.post(`${baseUrl}/text-to-speech/${voiceId}`, {
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.85,
        style: 0.0,
        use_speaker_boost: true
      }
    }, {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      timeout: 60000,
      maxRedirects: 5
    });
    
    console.log('✅ Речь сгенерирована успешно!');
    console.log('📊 Статус:', speechResponse.status);
    console.log('📊 Размер аудио:', speechResponse.data.length, 'байт');
    
  } catch (error) {
    console.error('❌ Ошибка при генерации речи:');
    console.error('   Статус:', error.response?.status);
    console.error('   Сообщение:', error.message);
    console.error('   URL:', error.config?.url);
    if (error.response?.data) {
      console.error('   Данные ответа:', error.response.data);
    }
  }
}

testElevenLabsDirect();

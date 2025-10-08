const BackblazeService = require('./services/backblazeService');

async function testBackblaze() {
  try {
    const b2Service = new BackblazeService();
    
    console.log('🔍 Проверяем доступность Backblaze B2...');
    const isAvailable = await b2Service.checkAvailability();
    console.log(`📊 Backblaze B2 доступен: ${isAvailable}`);
    
    if (isAvailable) {
      console.log('📤 Тестируем загрузку файла...');
      const result = await b2Service.uploadFile(
        './data/audio/voiceover_video_1759915536683_6r0bzdkao_2025-10-08T18-26-22-892Z.mp3'
      );
      
      console.log('✅ Результат загрузки:', result);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testBackblaze();

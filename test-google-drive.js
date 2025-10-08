const GoogleDriveService = require('./services/googleDriveService');

async function testGoogleDrive() {
  try {
    const driveService = new GoogleDriveService();
    
    console.log('🔍 Проверяем доступность Google Drive...');
    const isAvailable = await driveService.checkAvailability();
    console.log(`📊 Google Drive доступен: ${isAvailable}`);
    
    if (isAvailable) {
      console.log('📤 Тестируем загрузку файла...');
      const result = await driveService.uploadFile(
        './data/audio/voiceover_video_1759915536683_6r0bzdkao_2025-10-08T18-26-22-892Z.mp3'
      );
      
      console.log('✅ Результат загрузки:', result);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testGoogleDrive();

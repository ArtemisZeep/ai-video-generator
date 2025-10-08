const VideoPipelineService = require('./services/videoPipelineService');

async function testRender() {
  try {
    const pipelineService = new VideoPipelineService();
    
    console.log('🎬 Тестируем рендер видео...');
    
    const result = await pipelineService.renderVideo('video_1759915536683_6r0bzdkao');
    
    console.log('✅ Результат:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRender();

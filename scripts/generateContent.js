#!/usr/bin/env node

const readline = require('readline');
const PerplexityService = require('../services/perplexityService');
const DataService = require('../services/dataService');

class ContentGenerator {
  constructor() {
    this.perplexityService = new PerplexityService();
    this.dataService = new DataService();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async selectLanguage() {
    console.log('\n🌍 Выберите язык для генерации контента:');
    console.log('1. Русский (ru)');
    console.log('2. English (en)');
    console.log('3. Español (es)');
    console.log('4. Français (fr)');
    console.log('5. Deutsch (de)');
    console.log('6. Italiano (it)');
    console.log('7. Português (pt)');
    console.log('8. 中文 (zh)');
    console.log('9. 日本語 (ja)');
    console.log('10. 한국어 (ko)');

    const choice = await this.askQuestion('\nВведите номер языка (1-10) или код языка: ');
    
    const languageMap = {
      '1': 'ru', '2': 'en', '3': 'es', '4': 'fr', '5': 'de',
      '6': 'it', '7': 'pt', '8': 'zh', '9': 'ja', '10': 'ko'
    };

    return languageMap[choice] || choice.toLowerCase();
  }

  async getVideoTopic() {
    console.log('\n🎬 Генератор контента для видео');
    console.log('=====================================');
    
    const topic = await this.askQuestion('\nВведите тему для видео: ');
    
    if (!topic) {
      console.log('❌ Тема не может быть пустой!');
      return await this.getVideoTopic();
    }
    
    return topic;
  }

  async generateContent() {
    try {
      console.clear();
      console.log('🚀 Запуск генератора контента...\n');

      // Получаем тему видео
      const topic = await this.getVideoTopic();
      
      // Выбираем язык
      const language = await this.selectLanguage();
      
      console.log(`\n📝 Генерация контента для темы: "${topic}"`);
      console.log(`🌍 Язык: ${language}`);
      console.log('\n⏳ Обработка запроса...');

      // Генерируем контент
      const startTime = Date.now();
      const result = await this.perplexityService.generateVideoContent(topic, language);
      const endTime = Date.now();

      if (result.status === 'error') {
        console.log('❌ Ошибка при генерации контента:');
        console.log(result.error);
        return;
      }

      // Сохраняем результат
      const savedVideo = await this.dataService.saveVideo(result);

      // Выводим результат
      console.log('\n✅ Контент успешно сгенерирован!');
      console.log(`⏱️  Время генерации: ${(endTime - startTime) / 1000} секунд`);
      console.log(`🆔 ID видео: ${savedVideo.id}`);
      
      console.log('\n📋 Результат:');
      console.log('=====================================');
      console.log(`🎬 Название: ${result.title}`);
      console.log(`\n📝 Описание:\n${result.description}`);
      console.log(`\n🔑 Ключевые слова: ${result.keywords}`);
      console.log(`\n📜 Сценарий:\n${result.script}`);

      // Предлагаем дополнительные действия
      await this.showAdditionalOptions(savedVideo.id);

    } catch (error) {
      console.error('\n❌ Критическая ошибка:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async showAdditionalOptions(videoId) {
    console.log('\n🔧 Дополнительные действия:');
    console.log('1. Просмотреть все сохраненные видео');
    console.log('2. Найти видео по теме');
    console.log('3. Найти видео по языку');
    console.log('4. Сгенерировать еще одно видео');
    console.log('5. Выход');

    const choice = await this.askQuestion('\nВыберите действие (1-5): ');

    switch (choice) {
      case '1':
        await this.showAllVideos();
        break;
      case '2':
        await this.searchByTopic();
        break;
      case '3':
        await this.searchByLanguage();
        break;
      case '4':
        await this.generateContent();
        break;
      case '5':
        console.log('\n👋 До свидания!');
        process.exit(0);
        break;
      default:
        console.log('❌ Неверный выбор!');
        await this.showAdditionalOptions(videoId);
    }
  }

  async showAllVideos() {
    try {
      const videos = await this.dataService.getAllVideos();
      
      if (videos.length === 0) {
        console.log('\n📭 Нет сохраненных видео');
        return;
      }

      console.log(`\n📚 Всего видео: ${videos.length}`);
      console.log('=====================================');
      
      videos.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.title}`);
        console.log(`   Тема: ${video.topic}`);
        console.log(`   Язык: ${video.language}`);
        console.log(`   Создано: ${new Date(video.createdAt).toLocaleString()}`);
        console.log(`   ID: ${video.id}`);
      });

    } catch (error) {
      console.error('❌ Ошибка при загрузке видео:', error.message);
    }
  }

  async searchByTopic() {
    const topic = await this.askQuestion('\nВведите тему для поиска: ');
    if (!topic) return;

    try {
      const videos = await this.dataService.searchVideos(topic);
      
      if (videos.length === 0) {
        console.log('\n🔍 Видео по данной теме не найдены');
        return;
      }

      console.log(`\n🔍 Найдено видео: ${videos.length}`);
      videos.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.title}`);
        console.log(`   Тема: ${video.topic}`);
        console.log(`   Язык: ${video.language}`);
      });

    } catch (error) {
      console.error('❌ Ошибка при поиске:', error.message);
    }
  }

  async searchByLanguage() {
    const language = await this.askQuestion('\nВведите код языка (ru, en, es, etc.): ');
    if (!language) return;

    try {
      const videos = await this.dataService.getVideosByLanguage(language);
      
      if (videos.length === 0) {
        console.log(`\n🔍 Видео на языке ${language} не найдены`);
        return;
      }

      console.log(`\n🌍 Видео на языке ${language}: ${videos.length}`);
      videos.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.title}`);
        console.log(`   Тема: ${video.topic}`);
      });

    } catch (error) {
      console.error('❌ Ошибка при поиске:', error.message);
    }
  }
}

// Запуск генератора
if (require.main === module) {
  const generator = new ContentGenerator();
  generator.generateContent().catch(console.error);
}

module.exports = ContentGenerator;

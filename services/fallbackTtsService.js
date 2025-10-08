const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class FallbackTtsService {
  constructor() {
    this.outputDir = path.join(__dirname, '../data/audio');
    this.ensureOutputDir();
  }

  async ensureOutputDir() {
    await fs.ensureDir(this.outputDir);
  }

  // Проверяем доступность системного TTS
  async checkAvailability() {
    try {
      // Проверяем доступность say (macOS) или espeak (Linux)
      const { stdout } = await execAsync('which say || which espeak || which festival');
      return stdout.trim().length > 0;
    } catch (error) {
      console.log('⚠️ Системный TTS недоступен:', error.message);
      return false;
    }
  }

  // Генерируем аудио с помощью системного TTS
  async generateSpeech(text, outputPath, language = 'ru') {
    try {
      console.log(`🔊 Генерируем аудио через системный TTS: ${text.substring(0, 50)}...`);
      
      // Определяем команду TTS в зависимости от системы
      let ttsCommand;
      if (process.platform === 'darwin') {
        // macOS - используем say
        ttsCommand = `say -v "Yuri" -r 200 -o "${outputPath}" "${text}"`;
      } else if (process.platform === 'linux') {
        // Linux - используем espeak
        const voice = language === 'ru' ? 'ru' : 'en';
        ttsCommand = `espeak -v ${voice} -s 150 -w "${outputPath}" "${text}"`;
      } else {
        // Windows - используем PowerShell
        ttsCommand = `powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).SetOutputToWaveFile('${outputPath}'); (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${text.replace(/'/g, "''")}')"`;
      }

      console.log(`🎤 Выполняем команду: ${ttsCommand}`);
      await execAsync(ttsCommand);
      
      // Проверяем, что файл создан
      if (await fs.pathExists(outputPath)) {
        const stats = await fs.stat(outputPath);
        console.log(`✅ Аудио создано: ${outputPath} (${stats.size} байт)`);
        return {
          success: true,
          filePath: outputPath,
          fileSize: stats.size
        };
      } else {
        throw new Error('Файл аудио не был создан');
      }
    } catch (error) {
      console.error('❌ Ошибка системного TTS:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Генерируем и сохраняем озвучку для видео
  async generateAndSaveVoiceover(text, videoId, language = 'ru') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `voiceover_${videoId}_${timestamp}.wav`;
      const filePath = path.join(this.outputDir, filename);

      console.log(`🎵 Генерируем озвучку через системный TTS`);
      console.log(`📝 Текст: ${text.substring(0, 100)}...`);
      console.log(`💾 Сохраняем в: ${filePath}`);

      const result = await this.generateSpeech(text, filePath, language);
      
      if (result.success) {
        return {
          success: true,
          filename: filename,
          filePath: filePath,
          fileSize: result.fileSize,
          generatedAt: new Date().toISOString()
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Ошибка генерации озвучки через системный TTS:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FallbackTtsService;

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class ShortGptService {
  constructor() {
    this.pythonPath = path.join(__dirname, '../python');
    this.configPath = path.join(this.pythonPath, 'config.json');
    this.videoScriptPath = path.join(this.pythonPath, 'video_creator.py');
    this.venvPythonPath = path.join(this.pythonPath, 'venv', 'bin', 'python');
    
    // Создаем директории если их нет
    this.ensureDirectories();
  }

  ensureDirectories() {
    const videoDir = path.join(__dirname, '../data/videos');
    fs.ensureDirSync(videoDir);
  }

  /**
   * Обновляет конфигурацию ShortGPT
   */
  async updateConfig(config) {
    try {
      const configData = {
        openai_key: config.openai_key || '',
        elevenlabs_key: config.elevenlabs_key || '',
        pexels_key: config.pexels_key || '',
        voice_name: config.voice_name || 'Charlie',
        language: config.language || 'ru',
        background_music_url: config.background_music_url || '',
        watermark: config.watermark || null,
        video_settings: {
          isVerticalFormat: true,
          resolution: '1080x1920',
          fps: 30,
          bitrate: '2M'
        },
        audio_settings: {
          sample_rate: 44100,
          bitrate: '128k'
        }
      };

      await fs.writeJson(this.configPath, configData, { spaces: 2 });
      console.log('✅ Конфигурация ShortGPT обновлена');
      return true;
    } catch (error) {
      console.error('❌ Ошибка обновления конфигурации:', error.message);
      throw error;
    }
  }

  /**
   * Создает видео используя ShortGPT
   */
  async createVideo(scriptText, videoId, options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`🎬 Создаем видео с ID: ${videoId}`);
      console.log(`📝 Длина скрипта: ${scriptText.length} символов`);

      // Подготавливаем аргументы для Python скрипта
      const args = [
        this.videoScriptPath,
        this.configPath,
        scriptText,
        videoId
      ];

      console.log(`🐍 Запускаем Python скрипт: python ${args.join(' ')}`);

      // Определяем путь к Python (виртуальное окружение или системный)
      const pythonExecutable = fs.existsSync(this.venvPythonPath) ? this.venvPythonPath : 'python3';
      
      // Запускаем Python скрипт
      const pythonProcess = spawn(pythonExecutable, args, {
        cwd: this.pythonPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      // Собираем вывод
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`📋 Python: ${output.trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        console.error(`❌ Python Error: ${error.trim()}`);
      });

      // Обрабатываем завершение процесса
      pythonProcess.on('close', (code) => {
        console.log(`🐍 Python процесс завершен с кодом: ${code}`);

        if (code === 0) {
          try {
            // Парсим JSON результат из stdout
            const lines = stdout.split('\n');
            let jsonResult = null;

            // Ищем JSON в выводе
            for (const line of lines) {
              if (line.trim().startsWith('{') || line.trim().startsWith('[')) {
                try {
                  jsonResult = JSON.parse(line.trim());
                  break;
                } catch (e) {
                  // Продолжаем поиск
                }
              }
            }

            if (jsonResult) {
              if (jsonResult.status === 'success') {
                console.log('✅ Видео успешно создано!');
                resolve({
                  success: true,
                  videoId: videoId,
                  videoPath: jsonResult.video_path,
                  fileSize: jsonResult.file_size,
                  message: jsonResult.message
                });
              } else {
                console.error('❌ Ошибка создания видео:', jsonResult.error);
                reject(new Error(jsonResult.error));
              }
            } else {
              console.error('❌ Не удалось распарсить результат Python скрипта');
              reject(new Error('Не удалось распарсить результат Python скрипта'));
            }
          } catch (error) {
            console.error('❌ Ошибка парсинга результата:', error.message);
            reject(error);
          }
        } else {
          const errorMsg = `Python скрипт завершился с ошибкой (код: ${code})\nSTDERR: ${stderr}`;
          console.error('❌', errorMsg);
          reject(new Error(errorMsg));
        }
      });

      // Обрабатываем ошибки процесса
      pythonProcess.on('error', (error) => {
        console.error('❌ Ошибка запуска Python процесса:', error.message);
        reject(error);
      });

      // Таймаут для безопасности (10 минут)
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Таймаут создания видео (10 минут)'));
      }, 10 * 60 * 1000);

      pythonProcess.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Проверяет доступность ShortGPT
   */
  async checkShortGptAvailability() {
    return new Promise((resolve) => {
      console.log('🔍 Проверяем доступность ShortGPT...');

      // Определяем путь к Python (виртуальное окружение или системный)
      const pythonExecutable = fs.existsSync(this.venvPythonPath) ? this.venvPythonPath : 'python3';
      
      const pythonProcess = spawn(pythonExecutable, ['-c', 'import moviepy; import PIL; print("Video creation libraries доступны")'], {
        cwd: this.pythonPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && stdout.includes('Video creation libraries доступны')) {
          console.log('✅ Библиотеки для создания видео доступны');
          resolve(true);
        } else {
          console.log('❌ Библиотеки для создания видео недоступны:', stderr);
          resolve(false);
        }
      });

      pythonProcess.on('error', () => {
        console.log('❌ Ошибка проверки ShortGPT');
        resolve(false);
      });
    });
  }

  /**
   * Устанавливает зависимости Python
   */
  async installDependencies() {
    return new Promise((resolve, reject) => {
      console.log('📦 Устанавливаем Python зависимости...');

      // Определяем путь к pip (виртуальное окружение или системный)
      const pipExecutable = fs.existsSync(this.venvPythonPath) ? 
        path.join(this.pythonPath, 'venv', 'bin', 'pip') : 'pip3';
      
      const pipProcess = spawn(pipExecutable, ['install', '-r', 'requirements.txt'], {
        cwd: this.pythonPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pipProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`📦 pip: ${data.toString().trim()}`);
      });

      pipProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`❌ pip error: ${data.toString().trim()}`);
      });

      pipProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Python зависимости установлены');
          resolve(true);
        } else {
          console.error('❌ Ошибка установки зависимостей:', stderr);
          reject(new Error(stderr));
        }
      });

      pipProcess.on('error', (error) => {
        console.error('❌ Ошибка запуска pip:', error.message);
        reject(error);
      });
    });
  }

  /**
   * Получает информацию о видео
   */
  async getVideoInfo(videoId) {
    try {
      const videoPath = path.join(__dirname, '../data/videos', videoId, `${videoId}.mp4`);
      
      if (await fs.pathExists(videoPath)) {
        const stats = await fs.stat(videoPath);
        return {
          exists: true,
          path: videoPath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      } else {
        return { exists: false };
      }
    } catch (error) {
      console.error('❌ Ошибка получения информации о видео:', error.message);
      throw error;
    }
  }

  /**
   * Удаляет видео
   */
  async deleteVideo(videoId) {
    try {
      const videoDir = path.join(__dirname, '../data/videos', videoId);
      
      if (await fs.pathExists(videoDir)) {
        await fs.remove(videoDir);
        console.log(`🗑️ Видео ${videoId} удалено`);
        return true;
      } else {
        console.log(`⚠️ Видео ${videoId} не найдено`);
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка удаления видео:', error.message);
      throw error;
    }
  }
}

module.exports = ShortGptService;

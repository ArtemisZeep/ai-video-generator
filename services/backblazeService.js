const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs-extra');
const path = require('path');

class BackblazeService {
  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, '../config/apiKeys.json');
      const config = fs.readJsonSync(configPath);
      
      // Создаем S3 клиент для Backblaze B2
      this.s3 = new S3Client({
        endpoint: config.backblaze.endpoint, // например: https://s3.us-west-004.backblazeb2.com
        region: config.backblaze.region,      // например: us-west-004
        credentials: {
          accessKeyId: config.backblaze.keyId,
          secretAccessKey: config.backblaze.applicationKey
        }
      });
      
      this.bucketName = config.backblaze.bucketName;
      this.publicUrl = config.backblaze.publicUrl; // например: https://f004.backblazeb2.com/file/your-bucket
      
      console.log('✅ Backblaze B2 сервис инициализирован');
    } catch (error) {
      console.error('❌ Ошибка загрузки конфигурации Backblaze:', error);
    }
  }

  async uploadFile(filePath) {
    try {
      if (!this.s3) {
        throw new Error('Backblaze B2 не инициализирован');
      }

      console.log(`📤 Загружаем файл в Backblaze B2: ${filePath}`);
      
      const fileName = `audio/${Date.now()}-${path.basename(filePath)}`;
      const fileBuffer = await fs.readFile(filePath);
      
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: 'audio/mpeg'
      }));
      
      // Создаем presigned URL для публичного доступа
      const presignedUrl = await this.getPresignedUrl(fileName);
      console.log(`✅ Файл загружен: ${presignedUrl}`);
      
      return presignedUrl;
    } catch (error) {
      console.error('❌ Ошибка загрузки в Backblaze B2:', error);
      throw error;
    }
  }

  async deleteFile(fileUrl) {
    try {
      if (!this.s3) {
        throw new Error('Backblaze B2 не инициализирован');
      }

      // Извлекаем ключ файла из URL
      const fileName = fileUrl.split(`${this.publicUrl}/`)[1];
      
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      }));
      
      console.log(`✅ Файл удален из Backblaze B2: ${fileName}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка удаления файла:', error);
      return { success: false, error: error.message };
    }
  }

  async getPresignedUrl(fileName, expiresIn = 3600) {
    try {
      if (!this.s3) {
        throw new Error('Backblaze B2 не инициализирован');
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName
      });

      const presignedUrl = await getSignedUrl(this.s3, command, { expiresIn });
      console.log(`🔗 Presigned URL создан: ${presignedUrl}`);
      
      return presignedUrl;
    } catch (error) {
      console.error('❌ Ошибка создания presigned URL:', error);
      throw error;
    }
  }

  async checkAvailability() {
    try {
      if (!this.s3) {
        return false;
      }
      
      // Простая проверка - пытаемся получить список объектов
      await this.s3.send(new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1
      }));
      
      return true;
    } catch (error) {
      console.error('❌ Backblaze B2 недоступен:', error.message);
      return false;
    }
  }
}

module.exports = BackblazeService;

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DataService {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.videosFile = path.join(this.dataDir, 'videos.json');
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async loadVideos() {
    try {
      if (!fs.existsSync(this.videosFile)) {
        return [];
      }
      const data = await fs.readFile(this.videosFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading videos data:', error);
      return [];
    }
  }

  async saveVideos(videos) {
    try {
      await fs.writeFile(this.videosFile, JSON.stringify(videos, null, 2));
      console.log(`Saved ${videos.length} videos to database`);
    } catch (error) {
      console.error('Error saving videos data:', error);
      throw error;
    }
  }

  async saveVideo(videoData) {
    try {
      const videos = await this.loadVideos();
      
      const video = {
        id: uuidv4(),
        ...videoData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      videos.push(video);
      await this.saveVideos(videos);
      
      console.log(`Video saved with ID: ${video.id}`);
      return video;
    } catch (error) {
      console.error('Error saving video:', error);
      throw error;
    }
  }

  async getVideoById(id) {
    try {
      const videos = await this.loadVideos();
      return videos.find(video => video.id === id);
    } catch (error) {
      console.error('Error getting video by ID:', error);
      return null;
    }
  }

  async getAllVideos() {
    try {
      return await this.loadVideos();
    } catch (error) {
      console.error('Error getting all videos:', error);
      return [];
    }
  }

  async updateVideo(id, updateData) {
    try {
      const videos = await this.loadVideos();
      const videoIndex = videos.findIndex(video => video.id === id);
      
      if (videoIndex === -1) {
        throw new Error(`Video with ID ${id} not found`);
      }

      videos[videoIndex] = {
        ...videos[videoIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      await this.saveVideos(videos);
      return videos[videoIndex];
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }

  async deleteVideo(id) {
    try {
      const videos = await this.loadVideos();
      const filteredVideos = videos.filter(video => video.id !== id);
      
      if (videos.length === filteredVideos.length) {
        throw new Error(`Video with ID ${id} not found`);
      }

      await this.saveVideos(filteredVideos);
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  async searchVideos(query) {
    try {
      const videos = await this.loadVideos();
      const searchTerm = query.toLowerCase();
      
      return videos.filter(video => 
        video.title?.toLowerCase().includes(searchTerm) ||
        video.topic?.toLowerCase().includes(searchTerm) ||
        video.keywords?.toLowerCase().includes(searchTerm) ||
        video.description?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching videos:', error);
      return [];
    }
  }

  async getVideosByLanguage(language) {
    try {
      const videos = await this.loadVideos();
      return videos.filter(video => video.language === language);
    } catch (error) {
      console.error('Error getting videos by language:', error);
      return [];
    }
  }

  async getVideosByTopic(topic) {
    try {
      const videos = await this.loadVideos();
      const searchTerm = topic.toLowerCase();
      return videos.filter(video => 
        video.topic?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error getting videos by topic:', error);
      return [];
    }
  }
}

module.exports = DataService;

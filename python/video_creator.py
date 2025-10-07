#!/usr/bin/env python3
"""
ShortGPT Video Creator
Создает видео на основе текстового скрипта используя ShortGPT
"""

import sys
import json
import os
import traceback
from pathlib import Path

def create_video(script_text, video_id, config):
    """
    Создает видео на основе текстового скрипта
    
    Args:
        script_text: текст для озвучки
        video_id: уникальный ID видео
        config: конфигурация (API ключи, настройки)
    
    Returns:
        dict: результат создания видео
    """
    try:
        # Импорты для создания видео
        from PIL import Image, ImageDraw, ImageFont
        import subprocess
        import tempfile
        
        print(f"🎬 Начинаем создание видео для ID: {video_id}")
        print(f"📝 Длина скрипта: {len(script_text)} символов")
        
        # Создание директории для видео
        # Получаем абсолютный путь к директории проекта
        project_root = Path(__file__).parent.parent
        output_dir = project_root / "data" / "videos" / video_id
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print("🎨 Создаем простое видео с текстом...")
        
        # Создаем простое изображение с текстом
        # Размеры для вертикального видео (TikTok/Shorts)
        width, height = 1080, 1920
        
        # Создаем изображение
        img = Image.new('RGB', (width, height), color=(30, 30, 30))
        draw = ImageDraw.Draw(img)
        
        # Пытаемся использовать системный шрифт
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 50)
        except:
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 50)
            except:
                font = ImageFont.load_default()
        
        # Подготавливаем текст
        text = script_text[:200] + "..." if len(script_text) > 200 else script_text
        
        # Разбиваем текст на строки
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            text_width = bbox[2] - bbox[0]
            
            if text_width <= width - 100:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    lines.append(word)
        
        if current_line:
            lines.append(' '.join(current_line))
        
        # Рисуем текст
        y_offset = (height - len(lines) * 60) // 2
        for line in lines[:10]:  # Максимум 10 строк
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (width - text_width) // 2
            draw.text((x, y_offset), line, fill='white', font=font)
            y_offset += 60
        
        # Сохраняем изображение
        image_path = output_dir / f"{video_id}.png"
        img.save(image_path)
        
        # Создаем простое видео из изображения с помощью FFmpeg
        video_path = output_dir / f"{video_id}.mp4"
        
        # Команда FFmpeg для создания видео из изображения
        ffmpeg_cmd = [
            'ffmpeg',
            '-loop', '1',
            '-i', str(image_path),
            '-c:v', 'libx264',
            '-t', '10',  # 10 секунд
            '-pix_fmt', 'yuv420p',
            '-y',  # Перезаписать файл
            str(video_path)
        ]
        
        print(f"🎬 Создаем видео с помощью FFmpeg...")
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"FFmpeg error: {result.stderr}")
        
        # Удаляем временное изображение
        image_path.unlink()
        
        print(f"✅ Видео создано: {video_path}")
        
        return {
            'status': 'success',
            'video_path': str(video_path),
            'video_id': video_id,
            'file_size': os.path.getsize(video_path),
            'message': 'Простое видео успешно создано'
        }
        
    except ImportError as e:
        error_msg = f"Ошибка импорта библиотек: {str(e)}\n"
        error_msg += "Убедитесь, что все зависимости установлены: pip install -r requirements.txt"
        return {
            'status': 'error',
            'error': error_msg,
            'video_id': video_id
        }
        
    except Exception as e:
        error_msg = f"Ошибка создания видео: {str(e)}\n"
        error_msg += f"Traceback: {traceback.format_exc()}"
        print(f"❌ {error_msg}")
        return {
            'status': 'error',
            'error': error_msg,
            'video_id': video_id
        }

def main():
    """Основная функция для запуска из Node.js"""
    try:
        # Чтение аргументов из Node.js
        if len(sys.argv) < 4:
            print(json.dumps({
                'status': 'error',
                'error': 'Недостаточно аргументов. Использование: python video_creator.py <config_path> <script_text> <video_id>'
            }))
            sys.exit(1)
        
        config_path = sys.argv[1]
        script_text = sys.argv[2]
        video_id = sys.argv[3]
        
        print(f"🔧 Загружаем конфигурацию из: {config_path}")
        
        # Загрузка конфигурации
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # Создание видео
        result = create_video(script_text, video_id, config)
        
        # Вывод результата в JSON формате для Node.js
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        error_result = {
            'status': 'error',
            'error': f'Критическая ошибка: {str(e)}',
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()

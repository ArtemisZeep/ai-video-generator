#!/bin/bash

echo "🎬 Установка ShortGPT для AI Video Generator"
echo "=============================================="

# Проверяем Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден. Установите Python 3.x"
    exit 1
fi

echo "✅ Python3 найден: $(python3 --version)"

# Проверяем pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 не найден. Установите pip3"
    exit 1
fi

echo "✅ pip3 найден: $(pip3 --version)"

# Устанавливаем системные зависимости
echo "📦 Устанавливаем системные зависимости..."

# Для macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &> /dev/null; then
        echo "🍺 Устанавливаем через Homebrew..."
        brew install ffmpeg imagemagick
    else
        echo "⚠️ Homebrew не найден. Установите FFmpeg и ImageMagick вручную:"
        echo "   - FFmpeg: https://ffmpeg.org/download.html"
        echo "   - ImageMagick: https://imagemagick.org/script/download.php"
    fi
# Для Ubuntu/Debian
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Устанавливаем через apt..."
    sudo apt-get update
    sudo apt-get install -y ffmpeg imagemagick
# Для других систем
else
    echo "⚠️ Автоматическая установка не поддерживается для вашей ОС."
    echo "   Установите FFmpeg и ImageMagick вручную:"
    echo "   - FFmpeg: https://ffmpeg.org/download.html"
    echo "   - ImageMagick: https://imagemagick.org/script/download.php"
fi

# Переходим в директорию Python
cd "$(dirname "$0")/../python"

echo "📦 Создаем виртуальное окружение Python..."

# Создаем виртуальное окружение
python3 -m venv venv

# Активируем виртуальное окружение
source venv/bin/activate

echo "📦 Устанавливаем Python зависимости в виртуальное окружение..."

# Обновляем pip в виртуальном окружении
python -m pip install --upgrade pip

# Устанавливаем зависимости
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python зависимости установлены успешно"
else
    echo "❌ Ошибка установки Python зависимостей"
    exit 1
fi

# Проверяем установку ShortGPT
echo "🔍 Проверяем установку ShortGPT..."
python3 -c "import shortgpt; print('✅ ShortGPT успешно установлен')"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ShortGPT успешно установлен!"
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Настройте API ключи в config/apiKeys.json"
    echo "2. Обновите конфигурацию ShortGPT:"
    echo "   curl -X POST http://localhost:3000/api/shortgpt/config \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"openai_key\": \"your-key\", \"elevenlabs_key\": \"your-key\", \"pexels_key\": \"your-key\"}'"
    echo "3. Проверьте доступность:"
    echo "   curl -X POST http://localhost:3000/api/shortgpt/check"
    echo ""
    echo "🚀 Готово к созданию видео!"
else
    echo "❌ Ошибка установки ShortGPT"
    exit 1
fi

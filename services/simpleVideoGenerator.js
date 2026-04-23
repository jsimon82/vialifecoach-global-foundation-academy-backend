const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class SimpleVideoGenerator {
    constructor() {
        this.outputDir = path.join(__dirname, '../generated_videos');
        this.tempDir = path.join(__dirname, '../temp_videos');
        
        // Ensure directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async generateVideoFromScript(scriptData, courseTitle, lessonNumber) {
        console.log(`🎬 Starting video generation for: ${courseTitle} - Lesson ${lessonNumber}`);
        
        try {
            // Step 1: Create simple slides using HTML/CSS approach
            const slides = await this.createSimpleSlides(scriptData, courseTitle);
            console.log(`✅ Created ${slides.length} slides`);
            
            // Step 2: Generate placeholder audio files (we'll add real TTS later)
            const audioFiles = await this.generatePlaceholderAudio(slides);
            console.log(`✅ Generated ${audioFiles.length} audio files`);
            
            // Step 3: Combine into video using FFmpeg
            const finalVideo = await this.combineWithFFmpeg(slides, audioFiles, courseTitle, lessonNumber);
            console.log(`✅ Created final video: ${finalVideo}`);
            
            // Step 4: Clean up temp files
            this.cleanupTempFiles();
            
            return {
                success: true,
                videoPath: finalVideo,
                duration: slides.length * 5 // Estimate 5 seconds per slide
            };
            
        } catch (error) {
            console.error('❌ Video generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createSimpleSlides(scriptData, courseTitle) {
        const slides = [];
        
        for (let i = 0; i < scriptData.slides.length; i++) {
            const slideData = scriptData.slides[i];
            const slidePath = path.join(this.tempDir, `slide_${i + 1}.html`);
            
            // Create HTML slide
            const htmlContent = this.createSlideHTML(slideData, courseTitle, i + 1);
            fs.writeFileSync(slidePath, htmlContent);
            
            slides.push({
                path: slidePath,
                text: slideData.text,
                duration: this.estimateAudioDuration(slideData.text),
                title: slideData.title || `Slide ${i + 1}`
            });
        }
        
        return slides;
    }

    createSlideHTML(slideData, courseTitle, slideNumber) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1F4E8C 0%, #2C5282 100%);
            font-family: Arial, sans-serif;
            overflow: hidden;
        }
        .slide {
            width: 1920px;
            height: 1080px;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            text-align: center;
        }
        .title {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .content {
            font-size: 32px;
            max-width: 80%;
            line-height: 1.4;
            margin-bottom: 40px;
        }
        .branding {
            position: absolute;
            bottom: 40px;
            font-size: 20px;
            color: #FFD700;
            font-weight: bold;
        }
        .slide-number {
            position: absolute;
            top: 40px;
            right: 40px;
            font-size: 24px;
            background: rgba(255, 215, 0, 0.2);
            padding: 10px 20px;
            border-radius: 25px;
        }
    </style>
</head>
<body>
    <div class="slide">
        <div class="slide-number">Lesson ${slideNumber}</div>
        <div class="title">${slideData.title || courseTitle}</div>
        <div class="content">${this.truncateText(slideData.text, 200)}</div>
        <div class="branding">Vialifecoach Academy</div>
    </div>
</body>
</html>`;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    async generatePlaceholderAudio(slides) {
        const audioFiles = [];
        
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const audioPath = path.join(this.tempDir, `audio_${i + 1}.wav`);
            
            // Generate silent audio placeholder (5 seconds per slide)
            const silentAudio = this.generateSilentAudio(5);
            fs.writeFileSync(audioPath, silentAudio);
            
            audioFiles.push({
                path: audioPath,
                duration: 5,
                text: slide.text
            });
        }
        
        return audioFiles;
    }

    generateSilentAudio(durationSeconds) {
        // Generate a simple WAV file with silence
        const sampleRate = 44100;
        const bitsPerSample = 16;
        const numChannels = 1;
        const bytesPerSample = bitsPerSample / 8;
        const blockAlign = numChannels * bytesPerSample;
        const numSamples = sampleRate * durationSeconds;
        const numBytes = numSamples * blockAlign;
        
        const header = Buffer.alloc(44);
        header.write('RIFF', 0);
        header.writeUInt32LE(36 + numBytes, 4);
        header.write('WAVE', 8);
        header.write('fmt ', 12);
        header.writeUInt16LE(1, 16); // PCM
        header.writeUInt16LE(numChannels, 20);
        header.writeUInt32LE(sampleRate, 24);
        header.writeUInt32LE(sampleRate * blockAlign, 28);
        header.writeUInt16LE(blockAlign, 32);
        header.writeUInt16LE(bitsPerSample, 34);
        header.write('data', 36);
        header.writeUInt32LE(numBytes, 40);
        
        const buffer = Buffer.alloc(numBytes, 0);
        return Buffer.concat([header, buffer]);
    }

    async combineWithFFmpeg(slides, audioFiles, courseTitle, lessonNumber) {
        const videoPath = path.join(this.outputDir, `${courseTitle}_Lesson_${lessonNumber}.mp4`);
        
        // Create FFmpeg command to combine HTML slides and audio
        let ffmpegCommand = 'ffmpeg -y';
        
        // Add each slide with duration
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const audioFile = audioFiles[i];
            const duration = audioFile.duration || 5;
            
            // Convert HTML to image using a simple approach
            // For now, we'll create a color background slide
            ffmpegCommand += ` -f lavfi -i color=#1F4E8C:size=1920x1080:duration=${duration} -i "${audioFile.path}"`;
        }
        
        // Concatenate all videos
        const filterInputs = [];
        for (let i = 0; i < slides.length; i++) {
            filterInputs.push(`[${i}:v][${i}:a]`);
        }
        filterInputs.push(`concat=n=${slides.length}:v=1:a=1[out]`);
        
        const filterComplex = filterInputs.join(';');
        
        ffmpegCommand += ` -filter_complex "${filterComplex}" -c:v libx264 -c:a aac -shortest "${videoPath}"`;
        
        console.log('🎬 Executing FFmpeg command:', ffmpegCommand);
        
        return new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error('FFmpeg error:', stderr);
                    reject(error);
                } else {
                    console.log('✅ Video created successfully');
                    resolve(videoPath);
                }
            });
        });
    }

    estimateAudioDuration(text) {
        // Rough estimate: 150 words per minute = 2.5 words per second
        const wordsPerSecond = 2.5;
        const words = text.split(' ').length;
        return Math.ceil(words / wordsPerSecond);
    }

    cleanupTempFiles() {
        try {
            if (fs.existsSync(this.tempDir)) {
                fs.rmSync(this.tempDir, { recursive: true, force: true });
                console.log('🧹 Cleaned up temporary files');
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

module.exports = SimpleVideoGenerator;

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class VideoGenerator {
    constructor() {
        this.speechKey = process.env.AZURE_SPEECH_KEY || 'YOUR_AZURE_KEY_HERE';
        this.serviceRegion = process.env.AZURE_REGION || 'eastus';
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
            // Step 1: Create slides
            const slides = await this.createSlides(scriptData, courseTitle);
            console.log(`✅ Created ${slides.length} slides`);
            
            // Step 2: Generate audio for each slide
            const audioFiles = await this.generateAudioForSlides(slides);
            console.log(`✅ Generated ${audioFiles.length} audio files`);
            
            // Step 3: Combine slides and audio into video
            const finalVideo = await this.combineSlidesAndAudio(slides, audioFiles, courseTitle, lessonNumber);
            console.log(`✅ Created final video: ${finalVideo}`);
            
            // Step 4: Clean up temp files
            this.cleanupTempFiles();
            
            return {
                success: true,
                videoPath: finalVideo,
                duration: await this.getVideoDuration(finalVideo)
            };
            
        } catch (error) {
            console.error('❌ Video generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createSlides(scriptData, courseTitle) {
        const slides = [];
        
        for (let i = 0; i < scriptData.slides.length; i++) {
            const slideData = scriptData.slides[i];
            const slidePath = path.join(this.tempDir, `slide_${i + 1}.png`);
            
            // Create slide image
            await this.createSlideImage(slideData, slidePath, courseTitle, i + 1);
            
            slides.push({
                path: slidePath,
                text: slideData.text,
                duration: this.estimateAudioDuration(slideData.text),
                title: slideData.title || `Slide ${i + 1}`
            });
        }
        
        return slides;
    }

    async createSlideImage(slideData, outputPath, courseTitle, slideNumber) {
        const { createCanvas, loadImage } = require('canvas');
        const canvas = createCanvas(1920, 1080);
        const ctx = canvas.getContext('2d');
        
        // Vialifecoach brand colors
        const backgroundColor = '#1F4E8C';
        const textColor = '#FFFFFF';
        const accentColor = '#FFD700';
        
        // Background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, 1920, 1080);
        
        // Add gradient overlay
        const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
        gradient.addColorStop(0, 'rgba(31, 78, 140, 0.9)');
        gradient.addColorStop(1, 'rgba(31, 78, 140, 0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1920, 1080);
        
        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(slideData.title || courseTitle, 960, 200);
        
        // Slide number
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Lesson ${slideNumber}`, 960, 250);
        
        // Content text (word wrap)
        ctx.fillStyle = textColor;
        ctx.font = '32px Arial';
        const lines = this.wrapText(slideData.text, 60);
        const lineHeight = 40;
        const startY = 400;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, 960, startY + (index * lineHeight));
        });
        
        // Vialifecoach branding
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Vialifecoach Academy', 960, 980);
        
        // Save slide
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
    }

    wrapText(text, maxLength) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            if ((currentLine + word).length <= maxLength) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    async generateAudioForSlides(slides) {
        const audioFiles = [];
        
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const audioPath = path.join(this.tempDir, `audio_${i + 1}.wav`);
            
            // Generate audio using Azure TTS
            await this.generateTTSAudio(slide.text, audioPath);
            
            audioFiles.push({
                path: audioPath,
                duration: slide.duration,
                text: slide.text
            });
        }
        
        return audioFiles;
    }

    async generateTTSAudio(text, outputPath) {
        // For now, we'll use a placeholder. In production, this would call Azure TTS
        console.log(`🎙️ Generating audio for: "${text.substring(0, 50)}..."`);
        
        // Create a simple audio file placeholder
        // In production, replace with actual Azure TTS call
        const audioData = this.generateSilentAudio(5); // 5 seconds placeholder
        fs.writeFileSync(outputPath, audioData);
        
        return outputPath;
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
        
        const buffer = Buffer.alloc(numBytes, 0);
        
        // WAV header
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
        
        return Buffer.concat([header, buffer]);
    }

    async combineSlidesAndAudio(slides, audioFiles, courseTitle, lessonNumber) {
        const videoPath = path.join(this.outputDir, `${courseTitle}_Lesson_${lessonNumber}.mp4`);
        
        // Create FFmpeg command to combine slides and audio
        let ffmpegCommand = 'ffmpeg -y';
        
        // Add each slide with duration
        slides.forEach((slide, index) => {
            const audioFile = audioFiles[index];
            const duration = audioFile.duration || 5;
            
            ffmpegCommand += ` -loop 1 -t ${duration} -i "${slide.path}"`;
        });
        
        // Add audio inputs
        audioFiles.forEach((audioFile, index) => {
            ffmpegCommand += ` -i "${audioFile.path}"`;
        });
        
        // Filter complex to combine everything
        let filterComplex = '';
        slides.forEach((slide, index) => {
            if (index > 0) filterComplex += ';';
            filterComplex += `[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,fps=24[v${index}]`;
        });
        
        // Concatenate videos
        filterComplex += ';';
        for (let i = 0; i < slides.length; i++) {
            if (i > 0) filterComplex += ';';
            filterComplex += `[v${i}][${i + slides.length}:a]`;
        }
        filterComplex += `concat=n=${slides.length}:v=1:a=1[out]`;
        
        ffmpegCommand += ` -filter_complex "${filterComplex}" -map "[out]" -c:v libx264 -c:a aac -shortest "${videoPath}"`;
        
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

    async getVideoDuration(videoPath) {
        return new Promise((resolve) => {
            exec(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`, (error, stdout) => {
                if (error) {
                    resolve(0);
                } else {
                    const duration = parseFloat(stdout.split(',')[1]);
                    resolve(duration);
                }
            });
        });
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

module.exports = VideoGenerator;

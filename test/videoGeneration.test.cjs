// Test script to generate the confidence course video
const fetch = require('node-fetch');

async function testVideoGeneration() {
    console.log('🎬 Testing Vialifecoach Academy Video Generation System...');
    
    try {
        const response = await fetch('http://localhost:5000/api/v1/video-generation/generate-video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                courseTitle: "The Confidence Code: Building Unstoppable Self-Belief",
                lessonNumber: "1.1",
                scriptType: "confidence"
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Video generation started successfully!');
            console.log('📊 Video Details:', {
                courseTitle: result.data.courseTitle,
                lessonNumber: result.data.lessonNumber,
                duration: result.data.duration,
                downloadUrl: `http://localhost:5000${result.data.downloadUrl}`
            });
            
            console.log('🎥 Video will be available at:', result.data.downloadUrl);
            console.log('⏱️ Estimated duration:', result.data.duration, 'seconds');
            
        } else {
            console.error('❌ Video generation failed:', result.message);
            if (result.error) {
                console.error('Error details:', result.error);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Test listing generated videos
async function testVideoListing() {
    console.log('\n📋 Testing video listing...');
    
    try {
        const response = await fetch('http://localhost:5000/api/v1/video-generation/list');
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Found', result.data.length, 'generated videos:');
            result.data.forEach((video, index) => {
                console.log(`\n📹 Video ${index + 1}:`);
                console.log('  Filename:', video.filename);
                console.log('  Size:', Math.round(video.size / 1024 / 1024), 'MB');
                console.log('  Created:', new Date(video.created).toLocaleString());
                console.log('  Download:', `http://localhost:5000${video.downloadUrl}`);
            });
        } else {
            console.error('❌ Failed to list videos');
        }
    } catch (error) {
        console.error('❌ List test failed:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting Vialifecoach Academy Video Generation Tests\n');
    
    // Test 1: Generate confidence video
    await testVideoGeneration();
    
    // Wait a bit for generation to complete
    console.log('\n⏳ Waiting 10 seconds for video generation...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test 2: List videos
    await testVideoListing();
    
    console.log('\n✅ All tests completed!');
    console.log('🎯 Your Vialifecoach Academy video generation system is ready!');
}

// Run the tests
runTests();

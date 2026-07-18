const { spawn } = require("child_process")

function processVideo(resolution, inputFilePath, outputFolder) {
  return new Promise((resolve, reject) => {
    // 1. Corrected spawn: Use an array of arguments, not a single string
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', inputFilePath,
      '-vf', `scale=-2:${resolution}`,
      '-c:v', 'libx264', // Standard web codec
      '-crf', '23',      // Good balance of quality/size
      '-preset', 'veryfast', 
      `${outputFolder}/${resolution}.mp4`
    ]);

    // 2. Error handling: If FFmpeg fails to start
    ffmpegProcess.on('error', (err) => {
      console.error(`Failed to start FFmpeg for ${resolution}p:`, err);
      reject(err);
    });

    /*
    ffmpegProcess.stderr.on('data', (data) => {
      console.log(`FFmpeg Log: ${data}`);
    });
    */

    
    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Successfully finished ${resolution}p`);
        resolve();

      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

module.exports = { processVideo };
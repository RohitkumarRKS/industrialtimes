const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// --- AI Image Moderation Helper (Gemini API) ---
const checkImageSafety = (fileBuffer, mimeType, uploadType, expectedAadharNumber = '', expectedAccountName = '') => {
  return new Promise((resolve) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.warn("⚠️ GEMINI_API_KEY not configured. Skipping image safety check.");
      return resolve({ safe: true });
    }

    const https = require('https');
    const base64Data = fileBuffer.toString('base64');

    let prompt = "Analyze this image. Does it contain nudity, explicit 18+ adult content, graphic violence, pornography, or racy content? " +
                 "You must respond with a JSON object in this exact format: {\"safe\": true/false, \"reason\": \"reason description if unsafe\"}. " +
                 "Return only the raw JSON. Do not wrap it in markdown block formatting.";

    if (uploadType === 'passbook') {
      prompt = "Analyze this image. First, verify if it contains nudity, explicit 18+ content, pornography, or violence (if yes, respond with safe: false).\n" +
               "Second, verify if the image is a photo of a bank passbook. It must be a bank passbook showing account details (account name, account number, IFSC).\n" +
               "Third, read the account holder's name written on the bank passbook. Compare it with the expected account holder name: \"" + expectedAccountName + "\". The names must match or be highly similar (e.g. spelling variants, initials are fine).\n" +
               "It MUST NOT be a cancelled check (or cancelled cheque). If it is a cancelled check, you must respond with safe: false and reason: 'Cancelled cheques are not accepted. Please upload a clear photo of the bank passbook front page.'\n" +
               "It MUST NOT be a screenshot of a video, a face, scenery, graphics, or any other random photo.\n" +
               "If the image is not a passbook, or if the name on the passbook is completely different from the expected name \"" + expectedAccountName + "\", respond with {\"safe\": false, \"reason\": \"A details mismatch was found. The name on the passbook does not match the account holder name entered.\"}.\n" +
               "You must respond with a JSON object in this exact format: {\"safe\": true/false, \"reason\": \"reason description if unsafe/invalid/mismatched\"}.\n" +
               "Return only the raw JSON. Do not wrap it in markdown block formatting.";
    } else if (uploadType === 'aadhar') {
      prompt = "Analyze this image. First, verify if it contains nudity, explicit 18+ content, pornography, or violence (if yes, respond with safe: false).\n" +
               "Second, verify if the image is a photo of an Indian Aadhar card (front, back, or letter format).\n" +
               "Third, read the 12-digit Aadhaar number from the image (usually grouped like XXXX XXXX XXXX or XXXXXXXXXXXX) and compare it with the expected Aadhaar number: \"" + expectedAadharNumber + "\". They must match exactly.\n" +
               "Fourth, read the holder's name written on the Aadhaar card and compare it with the expected name: \"" + expectedAccountName + "\". The names must match or be highly similar.\n" +
               "It MUST NOT be a cancelled check, a screenshot of a video, a face, scenery, graphics, or any other random photo.\n" +
               "If the image is not an Aadhaar card, or if the Aadhaar number does not match \"" + expectedAadharNumber + "\", or if the name on the card is completely different from \"" + expectedAccountName + "\", respond with {\"safe\": false, \"reason\": \"A details mismatch was found. Please ensure the Aadhaar card details match the entered form values.\"}.\n" +
               "You must respond with a JSON object in this exact format: {\"safe\": true/false, \"reason\": \"reason description if unsafe/invalid/mismatched\"}.\n" +
               "Return only the raw JSON. Do not wrap it in markdown block formatting.";
    }

    const postData = JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const reqApi = https.request(options, (resApi) => {
      let body = '';
      resApi.on('data', (chunk) => body += chunk);
      resApi.on('end', () => {
        try {
          const data = JSON.parse(body);
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!responseText) {
            console.warn("⚠️ Gemini safety check returned empty response.");
            return resolve({ safe: true });
          }

          const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanText);
          resolve({
            safe: parsed.safe !== false,
            reason: parsed.reason || 'Image violates safety guidelines.'
          });
        } catch (err) {
          console.error("⚠️ Failed to parse Gemini safety check response:", err);
          resolve({ safe: true });
        }
      });
    });

    reqApi.on('error', (err) => {
      console.error("⚠️ Gemini safety check network error:", err);
      resolve({ safe: true });
    });

    reqApi.write(postData);
    reqApi.end();
  });
};

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage so we can compress before saving to disk
const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max for images
});

// Upload an image (with automatic compression)
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Strictly enforce only image files for KYC uploads
  if (req.query.type === 'passbook' || req.query.type === 'aadhar') {
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files (JPG, PNG, WEBP) are allowed for KYC verification.' });
    }
  }

  // Check image safety before compression or storage
  const safety = await checkImageSafety(
    req.file.buffer, 
    req.file.mimetype, 
    req.query.type, 
    req.query.aadharNumber, 
    req.query.accountName
  );
  if (!safety.safe) {
    return res.status(400).json({ message: `❌ Upload Blocked: ${safety.reason}` });
  }

  try {
    const filename = `${Date.now()}${path.extname(req.file.originalname)}`;
    const outputPath = path.join(uploadDir, filename);

    // Only compress image files, not videos
    if (req.file.mimetype.startsWith('image/')) {
      let sharp;
      try {
        sharp = require('sharp');
      } catch (e) {
        // sharp not installed — save raw file without compression
        console.warn('⚠️ sharp not installed, saving image without compression. Run: npm install sharp');
        fs.writeFileSync(outputPath, req.file.buffer);
        return res.status(200).json({
          message: 'Image uploaded successfully (uncompressed)',
          imageUrl: `/uploads/${filename}`
        });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      let sharpInstance = sharp(req.file.buffer)
        .resize({
          width: 1200,
          height: 1200,
          fit: 'inside',
          withoutEnlargement: true
        });

      if (ext === '.png') {
        sharpInstance = sharpInstance.png({ quality: 80, compressionLevel: 8 });
      } else if (ext === '.webp') {
        sharpInstance = sharpInstance.webp({ quality: 75 });
      } else {
        // Default: convert to JPEG for best compression
        sharpInstance = sharpInstance.jpeg({ quality: 80, mozjpeg: true });
      }

      await sharpInstance.toFile(outputPath);

      const originalSize = req.file.buffer.length;
      const compressedSize = fs.statSync(outputPath).size;
      const savedPercent = Math.round((1 - compressedSize / originalSize) * 100);
      console.log(`✅ Image compressed: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (saved ${savedPercent}%)`);
    } else {
      // Non-image file (shouldn't happen on this route, but handle gracefully)
      fs.writeFileSync(outputPath, req.file.buffer);
    }

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: `/uploads/${filename}`
    });
  } catch (err) {
    console.error('Image upload/compression error:', err);
    // Fallback: save raw file if compression fails
    try {
      const fallbackName = `${Date.now()}${path.extname(req.file.originalname)}`;
      fs.writeFileSync(path.join(uploadDir, fallbackName), req.file.buffer);
      return res.status(200).json({
        message: 'Image uploaded (compression skipped)',
        imageUrl: `/uploads/${fallbackName}`
      });
    } catch (fallbackErr) {
      return res.status(500).json({ message: 'Failed to upload image' });
    }
  }
});

// Upload a video file (no compression — stored as-is)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

const videoUpload = multer({
  storage: diskStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max
});

router.post('/video', videoUpload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No video file uploaded' });
  }
  res.status(200).json({
    message: 'Video uploaded successfully',
    videoUrl: `/uploads/${req.file.filename}`
  });
});

module.exports = router;

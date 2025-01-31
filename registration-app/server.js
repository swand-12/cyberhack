const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Canvas, Image } = require('canvas');
const faceapi = require('face-api.js');

const app = express();
const port = 3000;

// Set up face-api.js
faceapi.env.monkeyPatch({ Canvas, Image });
const MODEL_PATH = path.join(__dirname, 'weights');

// Load face-api.js models
(async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
})();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Serve static files
app.use(express.static('public'));

// Route to handle registration
app.post('/register', upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    const imagePath = req.file.path;

    // Validate input
    if (!name || !imagePath) {
      throw new Error('Name and image are required.');
    }

    // Read prominent users
    const prominentUsers = fs.readFileSync('prominent_users.txt', 'utf8').split('\n').map(user => user.trim());

    // Check if the name is in the prominent users list
    if (prominentUsers.includes(name)) {
      // Perform facial matching
      const isMatch = await performFacialMatching(name, imagePath);

      if (isMatch) {
        // Deny registration if face matches
        fs.unlinkSync(imagePath); // Delete the uploaded image
        return res.status(400).send('Registration denied: Face matches a prominent user.');
      }
    }

    // Allow registration
    res.send('Registration successful!');
  } catch (error) {
    console.error('Error during registration:', error.message);

    // Clean up uploaded file in case of error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).send('An error occurred during registration. Please try again.');
  }
});

// Function to perform facial matching
async function performFacialMatching(name, imagePath) {
  try {
    // Load the prominent user's image
    const prominentImagePath = path.join(__dirname, 'prominent_images', `${name}.jpg`);
    if (!fs.existsSync(prominentImagePath)) {
      throw new Error(`No image found for the prominent user: ${name}`);
    }

    // Load images
    const prominentImage = await faceapi.bufferToImage(fs.readFileSync(prominentImagePath));
    const uploadedImage = await faceapi.bufferToImage(fs.readFileSync(imagePath));

    // Detect faces
    const prominentDescriptor = await faceapi.detectSingleFace(prominentImage).withFaceLandmarks().withFaceDescriptor();
    const uploadedDescriptor = await faceapi.detectSingleFace(uploadedImage).withFaceLandmarks().withFaceDescriptor();

    if (!prominentDescriptor || !uploadedDescriptor) {
      throw new Error('No face detected in one or both images.');
    }

    // Calculate face distance
    const distance = faceapi.euclideanDistance(prominentDescriptor.descriptor, uploadedDescriptor.descriptor);

    // Threshold for face matching (set to 0.75)
    const threshold = 0.75;
    return distance < threshold;
  } catch (error) {
    console.error('Error during facial matching:', error.message);
    throw error; // Re-throw the error for handling in the main route
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
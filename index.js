const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const apiToken = 'd80b712c-028b-4ba7-a9cf-111f59fb1e7b';

app.post('/upscale', async (req, res) => {
  const { imageUrl, imageData, resize = 2, model = 'ESRGAN_4x' } = req.body;

  if (!imageUrl && !imageData) {
    return res.status(400).send('Missing required parameters: imageUrl or imageData');
  }

  try {
    const response = await axios.post('https://api.prodia.com/v1/upscale', {
      resize,
      model,
      imageUrl,
      imageData
    }, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apiToken
      }
    });

    const imagePath = path.join(__dirname, 'cache', 'upscaled_image.png');
    const imageStream = response.data;
    const fileStream = fs.createWriteStream(imagePath);

    if (!fs.existsSync(path.dirname(imagePath))) {
      fs.mkdirSync(path.dirname(imagePath), { recursive: true });
    }

    imageStream.pipe(fileStream);

    fileStream.on('finish', () => {
      res.sendFile(imagePath);
    });

    fileStream.on('error', (err) => {
      console.error("Stream error:", err);
      res.status(500).send('Error processing image.');
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing the image.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

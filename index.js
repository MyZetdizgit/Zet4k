const express = require('express');
const request = require('request');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const upscaleModels = [
  "ESRGAN_4x",
  "RealESRGAN_4x",
  "ESRGAN_SRx4"
];

app.get('/upscale', (req, res) => {
  const { imageUrl, modelIndex = 0, resize = 2 } = req.query;

  if (!imageUrl) {
    return res.status(400).send('Missing required parameter: imageUrl');
  }

  const parsedModelIndex = parseInt(modelIndex, 10);
  if (isNaN(parsedModelIndex) || parsedModelIndex < 0 || parsedModelIndex >= upscaleModels.length) {
    return res.status(400).send('Invalid model index');
  }

  const options = {
    method: 'POST',
    url: 'https://api.prodia.com/v1/upscale',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: {
      resize: parseInt(resize, 10),
      model: upscaleModels[parsedModelIndex],
      imageUrl
    },
    json: true
  };

  request(options, function (error, response, body) {
    if (error) {
      console.error(error);
      return res.status(500).send("An error occurred during the upscaling process");
    }

    if (body && body.url) {
      const imagePath = path.join(__dirname, 'cache', 'upscaled.png');
      request(body.url)
        .pipe(fs.createWriteStream(imagePath))
        .on('close', () => res.sendFile(imagePath));
    } else {
      console.error("Failed to upscale the image");
      res.status(500).send("Upscaling failed");
    }
  });
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});

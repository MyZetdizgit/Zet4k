const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Prodia } = require('prodia.js');

const app = express();
const port = 3000;

const upscaleModels = [
  "ESRGAN_4x",
  "RealESRGAN_4x",
  "ESRGAN_SRx4"
];

app.get('/upscale', async (req, res) => {
  const { imageUrl, modelIndex = 0, resize = 2 } = req.query;

  if (!imageUrl) {
    return res.status(400).send('Missing required parameter: imageUrl');
  }

  const parsedModelIndex = parseInt(modelIndex, 10);
  if (isNaN(parsedModelIndex) || parsedModelIndex < 0 || parsedModelIndex >= upscaleModels.length) {
    return res.status(400).send('Invalid model index');
  }

  try {
    const { upscale } = Prodia("d80b712c-028b-4ba7-a9cf-111f59fb1e7b");

    const upscaleResult = await upscale({
      resize: parseInt(resize, 10),
      model: upscaleModels[parsedModelIndex],
      imageUrl
    });

    if (upscaleResult.status !== "succeeded") {
      console.error("Upscaling failed");
      return res.status(500).send("Upscaling failed");
    }

    const imagePath = path.join(__dirname, 'cache', 'upscaled.png');
    const response = await axios.get(upscaleResult.imageUrl, { responseType: 'stream' });

    response.data.pipe(fs.createWriteStream(imagePath))
      .on('finish', () => {
        return res.sendFile(imagePath);
      });

  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the image upscaling");
  }
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});

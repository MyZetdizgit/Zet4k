const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Prodia } = require('prodia.js');

const app = express();
const port = 3000;

app.get('/generate', async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl ) {
    return res.status(400).send('Missing required parameters: imageUrl');
  }

  try {
    const { upscale, wait } = Prodia("3e6e7115-8f3c-486e-aaa8-63840d0b41f5");
    const generate = await upscale({
      imageUrl,
      resize : 4,
       model : "R-ESRGAN 4x+"
    });

    while (generate.status !== "succeeded" && generate.status !== "failed") {
      await new Promise(resolve => setTimeout(resolve, 250));
      const job = await wait(generate);

      if (job.status === "succeeded") {
        const imagePath = path.join(__dirname, 'cache', 'generated.png');
        const response = await axios.get(job.imageUrl, { responseType: 'stream' });
        response.data.pipe(fs.createWriteStream(imagePath))
          .on('finish', () => {
            return res.sendFile(imagePath);
          });
        return;
      }
    }

    console.error("Image transformation failed");
    res.status(500).send("Image transformation failed");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the image transformation");
  }
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});

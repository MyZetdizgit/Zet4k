const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const upscaleTokens = [
  "6046cf8e-2eb8-487d-99a8-e18f62675328",
  "20d6877b-f6a2-4501-adee-27cec8206641",
  // Ajoutez d'autres tokens si nécessaire
];

let upscaleTokenIndex = 0;

app.post('/upscale-image', async (req, res) => {
  const { imageUrl, imageData, resize = 2, model = 'ESRGAN_4x' } = req.body;

  if (!imageUrl && !imageData) {
    return res.status(400).send('Either imageUrl or imageData is required.');
  }

  try {
    let response;
    let success = false;

    const currentToken = upscaleTokens[upscaleTokenIndex];

    while (!success) {
      try {
        response = await axios.post('https://api.prodia.com/v1/upscale', {
          imageUrl,
          imageData,
          resize,
          model,
        }, {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });

        success = true;
      } catch (error) {
        if (error.response && error.response.status === 403) {
          console.log("Token expired. Trying with the next token...");
          upscaleTokenIndex = (upscaleTokenIndex + 1) % upscaleTokens.length;
        } else {
          throw new Error(error.message);
        }
      }
    }

    if (success) {
      res.json(response.data);
    } else {
      res.status(500).send('Error upscaling image.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

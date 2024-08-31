require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const { Prodia } = require("prodia.js");
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

const models = [
    "anythingV5_PrtRE.safetensors [893e49b9]",
    "breakdomain_I2428.safetensors [43cc7d2f]",
    "breakdomain_M2150.safetensors [15f7afca]",
    "childrensStories_v1ToonAnime.safetensors [2ec7b88b]",
    "Counterfeit_v30.safetensors [9e2a8f19]",
    "cuteyukimixAdorable_midchapter3.safetensors [04bdffe6]",
    "dreamlike-anime-1.0.safetensors [4520e090]",
    "meinamix_meinaV9.safetensors [2ec66ab0]",
    "meinamix_meinaV11.safetensors [b56ce717]",
    "pastelMixStylizedAnime_pruned_fp16.safetensors [793a26e8]",
    "toonyou_beta6.safetensors [980f6b15]",
    "mechamix_v10.safetensors [ee685731]",
    "cetusMix_Version35.safetensors [de2f2560]",
    "dalcefo_v4.safetensors [425952fe]",
    "AOM3A3_orangemixs.safetensors [9600da17]",
    "theallys-mix-ii-churned.safetensors [5d9225a4]",
    "aniverse_v30.safetensors [579e6f85]"
];

const cfgs = {
    0: 1,
    1: 2,
    2: 3,
    3: 4,
    4: 5,
    5: 6,
    6: 7,
    7: 8,
    8: 9,
    9: 10
};

const ratios = ["portrait", "landscape", "square"];

const prodia = Prodia(API_KEY);

app.use(express.json());

app.get('/generate', async (req, res) => {
    const { prompt, modelIndex = 2, ratioIndex = 0, cfgIndex = 5 } = req.query;

    if (!prompt) {
        return res.status(400).send('The prompt parameter is required.');
    }

    if (isNaN(modelIndex) || modelIndex < 0 || modelIndex >= models.length) {
        return res.status(400).send('Invalid model index!');
    }

    if (isNaN(ratioIndex) || ratioIndex < 0 || ratioIndex >= ratios.length) {
        return res.status(400).send('Invalid ratio index!');
    }

    if (isNaN(cfgIndex) || cfgIndex < 0 || cfgIndex >= Object.keys(cfgs).length) {
        return res.status(400).send('Invalid cfg index!');
    }

    const model = models[modelIndex];
    const aspectRatio = ratios[ratioIndex];
    const cfg = cfgs[cfgIndex];

    try {
        const generate = await prodia.generateImage({
            prompt: `${prompt} ((best quality, masterpiece)), (HDR:1.3, 8k, 4k)`,
            negative_prompt: "(worst quality, bad quality:2.0), (bad-hands-5, badhandv4:1.0), (easynegativev2:1.2), (bad-artist-anime, bad-artist, bad_prompt, bad-picture-chill-75v, bad_prompt_version2, bad_quality, bad-picture-chill-75v, bad-image-v2-39000, NG_DeepNegative_V1_4T, DRD_PNTE768:0.8), (deformed iris, deformed pupils, bad eyes, semi-realistic:1.4), ugly, deformed, worst quality, (face asymmetry, eyes asymmetry, deformed eyes), (cropped, lowres, text, watermark, logo, signature, jpeg artifacts, username, artist name, trademark, title, multiple view, Reference sheet, long neck, logo, tattoos, wires, ear rings, dirty face, monochrome, grayscale:1.2), deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, text, close up, cropped, out of frame, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck",
            model: model,
            aspect_ratio: aspectRatio,
            upscale: true,
            seed: -1,
            steps: 50,
            cfg_scale: cfg
        });

        while (generate.status !== "succeeded" && generate.status !== "failed") {
            await new Promise(resolve => setTimeout(resolve, 250));
            const job = await prodia.wait(generate);

            if (job.status === "succeeded") {
                const cacheDir = path.join(__dirname, 'cache');
                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir);
                }

                const imagePath = path.join(cacheDir, 'generated.png');
                const response = await axios.get(job.imageUrl, { responseType: "arraybuffer" });
                fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));
                return res.sendFile(imagePath);
            }
        }

        console.error("Image generation failed");
        return res.status(500).send("Image generation failed");
    } catch (e) {
        console.error("Error generating image:", e.message);
        return res.status(500).send(e.message);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

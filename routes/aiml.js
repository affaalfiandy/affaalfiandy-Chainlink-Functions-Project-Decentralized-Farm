const express = require("express");
const router = express.Router();
const tf = require('@tensorflow/tfjs-node');

// Library body parser
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

//setting firebase
const admin = require('firebase-admin');
const serviceAccount = require('../firestore.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://test-20b09-default-rtdb.asia-southeast1.firebasedatabase.app/', // Replace with your database URL
});

const db = admin.database();


async function loadModel(modelPath) {
    const model = await tf.loadLayersModel(`file://${modelPath}`);
    return model;
}

async function preprocessImageBase64(imageBase64, targetSize) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const decodedImage = tf.node.decodeImage(imageBuffer);
    const processedImage = tf.image.resizeBilinear(decodedImage, targetSize);
    const expandedImage = processedImage.expandDims(0);

    return expandedImage.toFloat().div(255.0);
}

async function predict(model, imageBase64, targetSize) {
    const processedImage = await preprocessImageBase64(imageBase64, targetSize);
    const predictions = model.predict(processedImage);

    const results = Array.from(predictions.dataSync());
    const topPrediction = results.indexOf(Math.max(...results));

    return {
    class: topPrediction,
    probabilities: results,
    };
}

router.get("/fruitquality", jsonParser, async (req, res) => {
    try {
        const ref = db.ref('image');
        ref.once('value', async (snapshot) => {
            const data = snapshot.val();
            console.log(data[0])
            const modelPath = 'models/fruitquality/model.json';
            const targetSize = [224, 224];
            const model = await loadModel(modelPath);
            const predictions = await predict(model, data[0], targetSize);
            const classNames = ["Bad", "Good"]
            res.send({name:classNames[predictions["class"]]});
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
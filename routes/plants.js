const express = require("express");
const router = express.Router();
const fs = require("fs");
const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
const { v4: uuidv4 } = require('uuid');

// Library body parser
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

// Read ABI from file
const rawData = fs.readFileSync("plantsABI.json");
const plantsContractABI = JSON.parse(rawData);

// Configure Web3 and contract
const privateKey = process.env.PRIVATE_KEY;
const plantsContractAddress = process.env.PLANT_CONTRACT_ADDRESS;
const rpcurl = "https://rpc-mumbai.maticvigil.com";
const senderAddress = process.env.SENDER_ADDRESS;

const provider = new Provider(privateKey, rpcurl);
const web3 = new Web3(provider);
const plantsContract = new web3.eth.Contract(plantsContractABI, plantsContractAddress);

router.get("/", jsonParser, async (req, res) => {
    try {
        const result = await plantsContract.methods.getAllPlants().call({ from: senderAddress });
        res.json(result);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/", jsonParser, async (req, res) => {
    try {
        const { name, price, planted } = req.body;
        const idPlant = uuidv4();

        const gas = 3000000;
        const gasPrice = '10000000000';

        const transactionData = plantsContract.methods.addPlant(idPlant, name, price, planted).encodeABI();

        const signedTransaction = await web3.eth.accounts.signTransaction({
            to: plantsContractAddress,
            data: transactionData,
            gas,
            gasPrice,
            nonce: await web3.eth.getTransactionCount(senderAddress),
        }, privateKey);

        const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
        res.json({ success: true, idPlant });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/sell", jsonParser, async (req, res) => {
    try {
        const { idPlant, price } = req.body;

        const gas = 3000000;
        const gasPrice = '10000000000';

        const transactionData = plantsContract.methods.sellPlant(idPlant, price).encodeABI();

        const signedTransaction = await web3.eth.accounts.signTransaction({
            to: plantsContractAddress,
            data: transactionData,
            gas,
            gasPrice,
            nonce: await web3.eth.getTransactionCount(senderAddress),
        }, privateKey);

        const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
        res.json({ success: true, idPlant });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/buy", jsonParser, async (req, res) => {
    try {
        const { idPlant, idUser, userName } = req.body;

        const gas = 3000000;
        const gasPrice = '10000000000';

        const transactionData = plantsContract.methods.buyPlant(idPlant, idUser, userName).encodeABI();

        const signedTransaction = await web3.eth.accounts.signTransaction({
            to: plantsContractAddress,
            data: transactionData,
            gas,
            gasPrice,
            nonce: await web3.eth.getTransactionCount(senderAddress),
        }, privateKey);

        const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
        res.json({ success: true, idPlant });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;

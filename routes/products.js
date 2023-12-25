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
const rawFruitData = fs.readFileSync("fruitqualityABI.json");
const fruitQualityABI = JSON.parse(rawFruitData);
const rawMarketplaceData = fs.readFileSync("marketplaceABI.json");
const marketplaceABI = JSON.parse(rawMarketplaceData);

// Configure Web3 and contract
const privateKey = process.env.PRIVATE_KEY;
const fruitqualityAddress = process.env.FRUIT_QUALITY_ADDRESS;
const marketplaceAddress = process.env.MARKETPLACE_ADDRESS;
const rpcurl = "https://rpc-mumbai.maticvigil.com";
const senderAddress = process.env.SENDER_ADDRESS;

const provider = new Provider(privateKey, rpcurl);
const web3 = new Web3(provider);
const fruitqualityContract = new web3.eth.Contract(fruitQualityABI, fruitqualityAddress);
const marketplaceContract = new web3.eth.Contract(marketplaceABI, marketplaceAddress);

router.get("/quality", jsonParser, async (req, res) => {
    try {
        const subscriptionId = process.env.SUBSCRIPTION_ID;
        const gas = 3000000;
        const gasPrice = '10000000000';
        const transactionData = fruitqualityContract.methods.sendRequest(subscriptionId, ["1"]).encodeABI();

        const signedTransaction = await web3.eth.accounts.signTransaction({
            to: fruitqualityAddress,
            data: transactionData,
            gas,
            gasPrice,
            nonce: await web3.eth.getTransactionCount(senderAddress),
        }, privateKey);

        const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        setTimeout(async ()=>{
            const result = await fruitqualityContract.methods.character().call({ from: senderAddress });
            res.send(result)
        },20000)

    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/", jsonParser, async (req, res) => {
    try {
        const result = await marketplaceContract.methods.getAllProducts().call({ from: senderAddress });
        res.json(result);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/detail", jsonParser, async (req, res) => {
    try {
        const idProduct = req.query.id
        const result = await marketplaceContract.methods.products(idProduct).call({ from: senderAddress });
        res.json(result);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/", jsonParser, async (req, res) => {
    try {
        const subscriptionId = process.env.SUBSCRIPTION_ID;
        const gas = 3000000;
        const gasPrice = '10000000000';
        const transactionData = fruitqualityContract.methods.sendRequest(subscriptionId, ["1"]).encodeABI();

        const signedTransaction = await web3.eth.accounts.signTransaction({
            to: fruitqualityAddress,
            data: transactionData,
            gas,
            gasPrice,
            nonce: await web3.eth.getTransactionCount(senderAddress),
        }, privateKey);

        const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        setTimeout(async ()=>{
            const result = await fruitqualityContract.methods.character().call({ from: senderAddress });
            console.log(result)
            let idProduct = uuidv4();
            idProduct = idProduct.replaceAll("-","")
            const {idUser, name, price, image} = req.body;

            const gas = 3000000;
            const gasPrice = '10000000000';

            const transactionData = marketplaceContract.methods.addProduct(idProduct ,idUser, name, price, result).encodeABI();

            const signedTransaction = await web3.eth.accounts.signTransaction({
                to: marketplaceAddress,
                data: transactionData,
                gas,
                gasPrice,
                nonce: await web3.eth.getTransactionCount(senderAddress),
            }, privateKey);

            const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
            console.log(idProduct)
            res.json({ success: true, idProduct });
        },20000)
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
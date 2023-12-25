const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
const { v4: uuidv4 } = require('uuid');
const ethers = require("ethers");

// Library body parser
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

// Read ABI from file
const rawMarketplaceData = fs.readFileSync("marketplaceABI.json");
const marketplaceABI = JSON.parse(rawMarketplaceData);

// Configure Web3 and contract
const privateKey = process.env.PRIVATE_KEY;
const marketplaceAddress = process.env.MARKETPLACE_ADDRESS;
const rpcurl = "https://rpc-mumbai.maticvigil.com";
const senderAddress = process.env.SENDER_ADDRESS;

const provider = new Provider(privateKey, rpcurl);
const web3 = new Web3(provider);
const marketplaceContract = new web3.eth.Contract(marketplaceABI, marketplaceAddress);



router.post("/regist", jsonParser, async (req, res) => {
    try {
        const { name, password, isSeller } = req.body;
        const idUser = uuidv4();

        const gas = 3000000;
        const gasPrice = '10000000000';

        const transactionData = marketplaceContract.methods.registerUser(idUser, name, password, isSeller).encodeABI();

        const signedTransaction = await web3.eth.accounts.signTransaction({
            to: marketplaceAddress,
            data: transactionData,
            gas,
            gasPrice,
            nonce: await web3.eth.getTransactionCount(senderAddress),
        }, privateKey);

        const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
        res.json({ success: true, idUser });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.post("/", jsonParser, async (req, res) => {
    try {
        const idUser = req.body.idUser;
        const result = await marketplaceContract.methods.users(idUser).call({ from: senderAddress });
        res.json(result);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/login", jsonParser, async (req, res) => {
    try {
        const {idUser, password} = req.body;
        const result = await marketplaceContract.methods.users(idUser).call({ from: senderAddress });
        if(result["password"]==password){
            res.json(result);
        } else {
            res.send("wrong password")
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
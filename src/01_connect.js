require('dotenv').config();
const Web3 = require('web3');
const axios = require('axios');

const RPC_URL = process.env.RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const web3 = new Web3(RPC_URL); // Create Web3 instance of the RPC Node

async function main() {
    console.log(`RPC URL: ${RPC_URL}`);

    console.log('==== POST with Axios ====');
    // curl -X POST --data '{ "jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1 }' https://data-seed-prebsc-1-s1.binance.org:8545/
    const reqData = { "jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1 };
    const blockNumAxios = await axios.post(RPC_URL, reqData);
    console.log(`Request Data: ${JSON.stringify(reqData)}`);
    console.log(`Response Body: ${JSON.stringify(blockNumAxios.data)}`);
    console.log(`Block Number: ${Number(blockNumAxios.data.result)}`);

    console.log('==== Web3 ====');
    const blockNumWeb3 = await web3.eth.getBlockNumber();
    console.log(`Block Number: ${blockNumWeb3}`);
}

try {
    main();
} catch (err) {
    console.log(err);
    process.exit(1);
}
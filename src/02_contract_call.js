require('dotenv').config();
const Web3 = require('web3');
const axios = require('axios');

const RPC_URL = process.env.RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const web3 = new Web3(RPC_URL);

const ContractAddress = require('./constant/contract_address.json').bsc_testnet;
const Pair = require('./abi/Pair.json'); // JSON ABI of the contract

const busdWbnbPair = new web3.eth.Contract(Pair, ContractAddress.BUSDBNBPair); // Create the contract instance using the address and ABI

async function main() {
    console.log(`RPC URL: ${RPC_URL}`);

    const blocknum_web3 = await web3.eth.getBlockNumber();
    console.log(`Block Number: ${blocknum_web3}`);

    console.log('==== POST with Axios ====');
    // curl -X POST --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x85EcDcdd01EbE0BfD0Aba74B81Ca6d7F4A53582b","data":"0x0902f1ac"},"latest"],"id":1}' https://data-seed-prebsc-1-s1.binance.org:8545/
    const params = { "to": ContractAddress.BUSDBNBPair, "data": web3.eth.abi.encodeFunctionSignature("getReserves()") }
    const reqData = { "jsonrpc": "2.0", "method": "eth_call", "params": [params, "latest"], "id": 1 };
    const resultData = await axios.post(RPC_URL, reqData);
    console.log(`Request Data: ${JSON.stringify(reqData)}`);
    console.log(`Response Body: ${JSON.stringify(resultData.data)}`);
    console.log(web3.eth.abi.decodeParameters(['uint112', 'uint112', 'uint32'], resultData.data.result));

    console.log('==== Web3 ====');
    const reserves = await busdWbnbPair.methods.getReserves().call();
    console.log(reserves);
}

try {
    main();
} catch (err) {
    console.log(err);
    process.exit(1);
}
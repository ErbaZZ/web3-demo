require('dotenv').config();
const Web3 = require('web3');
const abiDecoder = require('abi-decoder'); // For decoding transaction data

const RPC_URL = 'wss://data-seed-prebsc-1-s2.binance.org:8545';
const web3 = new Web3(RPC_URL);

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    console.log('PRIVATE_KEY is not set!');
    process.exit(1);
}
const account = web3.eth.accounts.wallet.add(PRIVATE_KEY);

const BN = web3.utils.BN;

const ContractAddress = require('./constant/contract_address.json').bsc_testnet;
const ERC20 = require('./abi/ERC20.json');
const Pair = require('./abi/Pair.json');
const Router = require('./abi/Router.json');

abiDecoder.addABI(ERC20); // Adding ABIs to the decoder
abiDecoder.addABI(Pair);
abiDecoder.addABI(Router);

const busd = new web3.eth.Contract(ERC20, ContractAddress.BUSD);
const router = new web3.eth.Contract(Router, ContractAddress.PCSRouter);

async function main() {
    console.log(`RPC URL:\t${RPC_URL}`);
    console.log(`Wallet Address:\t${account.address}\n`);

    // https://web3js.readthedocs.io/en/v1.5.2/web3-eth-subscribe.html
    const blockSubscription = web3.eth.subscribe('newBlockHeaders'); // Subscribe to block event
    blockSubscription.on('data', async (block, error) => {
        console.log(`Block:\t${block.number}`);
    });

    const logSubscription = web3.eth.subscribe('logs', { // Subscribe to logs event
        topics: ['0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'] // Swap
    });
    logSubscription.on('data', async (log, error) => {
        const decodedLog = abiDecoder.decodeLogs([log]); // Decode log using previously added ABI
        console.log(decodedLog);
    });

    const pendingSubscription = web3.eth.subscribe('pendingTransactions'); // Subscribe to new pending transactions
    pendingSubscription.on('data', async (txHash, error) => {
        const tx = await web3.eth.getTransaction(txHash); // Get transaction data
        if (tx.to !== ContractAddress.PCSRouter) return; // Skip unwanted transactions
        
        const txData = abiDecoder.decodeMethod(tx.input); // Decode data using previously added ABI
        console.log(txData);
    });
}

try {
    main();
} catch (err) {
    console.log(err);
    process.exit(1);
}
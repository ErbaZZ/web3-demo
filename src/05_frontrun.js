require('dotenv').config();
const Web3 = require('web3');
const abiDecoder = require('abi-decoder');

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

abiDecoder.addABI(ERC20);
abiDecoder.addABI(Pair);
abiDecoder.addABI(Router);

const busd = new web3.eth.Contract(ERC20, ContractAddress.BUSD);
const router = new web3.eth.Contract(Router, ContractAddress.PCSRouter);
const TARGET_ADDRESS = '0x538a9844DCEb256de0D5e2F92F060F28755dD0C3';

async function main() {
    console.log(`RPC URL:\t${RPC_URL}`);
    console.log(`Wallet Address:\t${account.address}\n`);
    await web3.eth.getBlockNumber();

    console.log(`Monitoring transactions from ${TARGET_ADDRESS}`);
    const pendingSubscription = web3.eth.subscribe('pendingTransactions'); // Subscribe to new pending transactions
    pendingSubscription.on('data', async (txHash, error) => {
        const tx = await web3.eth.getTransaction(txHash); // Get transaction data

        if (tx.to !== ContractAddress.PCSRouter) return; // Skip unwanted transactions
        if (tx.from !== TARGET_ADDRESS) return; // Target only one address

        const txData = abiDecoder.decodeMethod(tx.input); // Decode data using previously added ABI

        if (txData.name !== 'swapExactETHForTokens') return; // Skip other methods
        if (txData.params[1].value[0] !== ContractAddress.WBNB.toLowerCase() || txData.params[1].value[1] !== ContractAddress.BUSD.toLowerCase()) return; // Skip swapping of other tokens

        // ---- Start Front-Running ----

        console.log("Target Tx Found!")
        // console.log(txData)

        const gasPrice = new BN(tx.gasPrice).add(new BN('1')); // Set higher gas price than the target transaction
        const swapAmount = web3.utils.toWei('0.1', 'ether'); // Should calculate to match the target's amountOutMin in the real scenario
        const amountOutMin = '0'; // BAD EXAMPLE, just for demo purpose, can easily be frontrun by others

        let frontrunHash;
        await router.methods.swapExactETHForTokens(amountOutMin, [ContractAddress.WBNB, ContractAddress.BUSD], account.address, Math.floor(Date.now() / 1000) + 60).send({
            value: swapAmount,
            gasPrice: gasPrice,
            gas: '200000',
            from: account.address
        }).on('transactionHash', function (transactionHash) {
            frontrunHash = transactionHash;
            console.log(`Swapping Token: https://testnet.bscscan.com/tx/${frontrunHash}`);
        })
        const receipt = await web3.eth.getTransactionReceipt(frontrunHash);
        const txLogs = abiDecoder.decodeLogs(receipt.logs);
        // console.log(txLogs[3].events);

        console.log("Done!");
    });
}

try {
    main();
} catch (err) {
    console.log(err);
    process.exit(1);
}
require('dotenv').config();
const Web3 = require('web3');

const RPC_URL = process.env.RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const web3 = new Web3(RPC_URL);

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    console.log('PRIVATE_KEY is not set!');
    process.exit(1);
}
const account = web3.eth.accounts.wallet.add(PRIVATE_KEY); // Add a wallet account to the Web3 instance

const BN = web3.utils.BN; // For large number calculations

const ContractAddress = require('./constant/contract_address.json').bsc_testnet;
const ERC20 = require('./abi/ERC20.json');
const Router = require('./abi/Router.json');

const busd = new web3.eth.Contract(ERC20, ContractAddress.BUSD);
const router = new web3.eth.Contract(Router, ContractAddress.PCSRouter);

async function main() {
    console.log(`RPC URL:\t${RPC_URL}`);
    console.log(`Wallet Address:\t${account.address}\n`);
    
    const walletBalance = await web3.eth.getBalance(account.address);
    const busdBalance = await busd.methods.balanceOf(account.address).call();

    console.log(`BNB Balance:\t${walletBalance} wei (${web3.utils.fromWei(walletBalance, 'ether')} BNB)`);
    console.log(`BUSD Balance:\t${busdBalance} wei (${web3.utils.fromWei(busdBalance, 'ether')} BUSD)\n`);

    const swapAmount = new BN(walletBalance).mul(new BN('1')).div(new BN('100')); // Convert to BN for calculations of large numbers
    console.log(`Swap Amount:\t${swapAmount} wei (${web3.utils.fromWei(swapAmount, 'ether')} BNB)`);

    const amountsOut = await router.methods.getAmountsOut(swapAmount, [ContractAddress.WBNB, ContractAddress.BUSD]).call();
    console.log(`Expected Out:\t${amountsOut[1]} wei (${web3.utils.fromWei(amountsOut[1], 'ether')} BUSD)\n`);

    const amountOutMin = new BN(amountsOut[1]).mul(new BN('99')).div(new BN('100'));

    // https://pancake.kiemtienonline360.com/#/swap
    const receipt = await router.methods.swapExactETHForTokens(amountOutMin, [ContractAddress.WBNB, ContractAddress.BUSD], account.address, Math.floor(Date.now() / 1000) + 60).send({
        value: swapAmount, // Native token amount (BNB for BSC, ETH for Ethereum)
        gasPrice: web3.utils.toWei('10', 'gwei'),
        gas: '200000',
        from: account.address
    }).on('transactionHash', function (transactionHash) {
        console.log(`Swapping Token: https://testnet.bscscan.com/tx/${transactionHash}`);
    })

    console.log("Swapping Done!");

    const walletBalanceNew = await web3.eth.getBalance(account.address);
    const busdBalanceNew = await busd.methods.balanceOf(account.address).call();

    const bnbSpent = new BN(walletBalance).sub(new BN(walletBalanceNew));
    const busdReceived = new BN(busdBalanceNew).sub(new BN(busdBalance));
    console.log(`BNB Spent:\t${bnbSpent} wei (${web3.utils.fromWei(bnbSpent, 'ether')} BNB)`);
    console.log(`BUSD Received:\t${busdReceived} wei (${web3.utils.fromWei(busdReceived, 'ether')} BUSD)\n`);

    console.log(`BNB Balance:\t${walletBalanceNew} wei (${web3.utils.fromWei(walletBalanceNew, 'ether')} BNB)`);
    console.log(`BUSD Balance:\t${busdBalanceNew} wei (${web3.utils.fromWei(busdBalanceNew, 'ether')} BUSD)`);
}

try {
    main();
} catch (err) {
    console.log(err);
    process.exit(1);
}
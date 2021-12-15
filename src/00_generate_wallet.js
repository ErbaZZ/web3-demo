const Web3  = require('web3');
const web3 = new Web3();

const acc = web3.eth.accounts.create();
console.log(`Address:\t${acc.address}\nPrivate Key:\t${acc.privateKey}`);
console.log('Get Testnet BNB from https://testnet.binance.org/faucet-smart')

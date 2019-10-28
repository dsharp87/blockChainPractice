
const { BlockChain, Transaction} = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('9fa9c7f1a372438832124f44b4c2a202a8f6d77ef461a4c42');
const myWalletAddress = myKey.getPublic('hex');

let dannyCoin = new BlockChain();

const tx1 = new Transaction(myWalletAddress, 'public key goes here', 10);
tx1.signTransaction(myKey);
dannyCoin.addTransaction(tx1);

console.log('\n Starting the miner...');
dannyCoin.mindPendingTransactions(myWalletAddress)

console.log('\nBalance of danny is', dannyCoin.getBalanceOfAddress(myWalletAddress));

dannyCoin.mindPendingTransactions(myWalletAddress)
console.log('\nBalance of danny is', dannyCoin.getBalanceOfAddress(myWalletAddress));

console.log(dannyCoin.isChainValid())



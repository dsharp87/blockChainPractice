const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

//this class defines a specific exchange of currency between two addresses
class Transaction {
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    //create hash of transaction object
    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    //validate the from address and sign this transaction
    signTransaction(signingKey){
        if(signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error('You cannot sign transactions for other wallets!');
        }
        
        //creates signiture hash
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    //validates the transaction
    isValid(){
        //mining rewards transactions auto validate
        if(this.fromAddress === null) return true;

        //signiture is missing
        if(!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction')
        }

        //return validated public key
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

//This defines a block that is added to a chain, it contains many transactions
class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    //returns hash of this object and all its properties
    calculateHash() {
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString();
    }

    //central mining method that tries to create valid hash
    mineBlock(difficulty){
        while(this.hash.substring(0,difficulty) !== Array(difficulty + 1).join("0")){
            //this is a junk number that is used to cause generated hash to change each loop
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash);
    }

    //will call isValid method on all transactions in the block
    hasValidTransactions() {
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }

        return true;
    }
}

//parent blockchain class
class BlockChain{
    constructor(){
        this.chain = [this.createGenisisBlock()];
        this.difficulty = 2
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    //all blockchains must have starting block
    createGenisisBlock() {
        return new Block("01/01/2019", "Genisis block", "0");
    }

    //returns most recent block in the chain
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    //runs the mining method, and if successful pushes new block into chain
    mindPendingTransactions(miningRewardAddress) {
        let block = new Block(Date.now(), this.pendingTransactions);
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);

        //upon success, push rewards transaction into new empty tranasctions
        //this is not be reflected in current block, but reward will be abaiable in next mined block
        this.pendingTransactions = [
            new Transaction(null, miningRewardAddress, this.miningReward)
        ]
    }

    //validates a transaction has sender/receiver before pushing into pending array
    addTransaction(transaction) {
        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error('Transaction must include a from and to address')
        }

        if(!transaction.isValid()){
            throw new Error('Cannot add invalid transaction to chain');
        }

        this.pendingTransactions.push(transaction);
    }

    //will return current avaiable balance specifced address
    getBalanceOfAddress(address) {
        let balance = 0;

        //iteration through all blocks
        for(const block of this.chain) {
            //iteration through all transaction in block
            for(const trans of block.transactions) {
                //matching address with +/- balance amount
                if(trans.fromAddress == address) {
                    balance -= trans.amount;
                }

                if(trans.toAddress === address ){
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    //validates the chain
    isChainValid() {
        for(let i=1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            //does this block have valid transactions
            if(!currentBlock.hasValidTransactions()){
                return false;
            }

            //does this block record match if you hash it again
            if(currentBlock.hash !== currentBlock.calculateHash()){
                return false;
            }

            //does this block point to a valid previous block
            if(currentBlock.previousHash !== previousBlock.hash){
                return false;
            }
        }

        return true;
    }
}

module.exports.BlockChain = BlockChain;
module.exports.Transaction = Transaction;
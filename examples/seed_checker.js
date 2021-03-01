/*
 * Quick example of how a seed checker could be implemented
 * It will get the balance from a node and also check if the address has been used already
 * How to use:
 *    1) Replace with proper seed
 *    2) Set a proper node
 *    3) Adjust the addressesToCheck if you need to check more than 100 addresses
 *    4) Run the script
 */
const iotakeccak = require('../iota.keccak.js');
const config={
    node:"https://node.example.com:443",
    seed:"99EXAMPLESEEDEXAMPLESEEDEXAMPLESEEDEXAMPLESEEDEXAMPLESEEDEXAMPLESEEDEXAMPLESEED99",
    seedSecurityLevel:2,
    addressesToCheck:100,
    chunkSize:25
};

if(config.node=="https://node.example.com:443"){
    console.log("!!! Please set proper node !!!");
    process.exit(0);
}

console.log(getPrintableTime()+" - Creating "+config.addressesToCheck+" addresses for seed");
const addresses=iotakeccak.getAddressFromSeedKeccak(config.seed,0,config.addressesToCheck,{secLevel:config.seedSecurityLevel,quick:true});
console.log(getPrintableTime()+" - Done creating "+config.addressesToCheck+" addresses for seed");
checkBalances(addresses);

async function checkBalances(addresses){
    for (let i=0,j=addresses.length; i<j; i+=config.chunkSize) {
        let curChunk=addresses.slice(i,i+config.chunkSize);
        let balances = await iotakeccak.getBalances(config.node,curChunk);
        let used = await iotakeccak.wereAddressesSpentFrom(config.node,curChunk);
        for (var k = 0, l = curChunk.length; k < l; k++) {
            console.log("Index:"+(i+k)+" is "+(used.states[k]===true?"USED":"unused")+" and has "+(balances.balances[k]>0?formatBalance(balances.balances[k])+" iota":"no balance")+" on it -> Address: "+curChunk[k]);
        }
    }
    
}

function getPrintableTime(){
    // simple timestamp printer
    var currentdate = new Date(); 
    return ("0"+currentdate.getHours()).slice(-2) + ":"  
                    + ("0"+currentdate.getMinutes()).slice(-2) + ":" 
                    + ("0"+currentdate.getSeconds()).slice(-2);
}

function formatBalance(balance){
    return balance.toString().replace(/./g, function(c, i, a) {
            return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
        });
}
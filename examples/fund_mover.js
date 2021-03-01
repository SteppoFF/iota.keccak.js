/*
 * This tool can be used to move funds from one or multiple address from any number of seeds.
 * It is designed to allow to specify the address indexes for seeds and will it take all the funds from these addresses - there is NO automatic "send all funds from seed" feature (yet).
 * 
 * Furthermore it can iterate through the seeds and inspect the addresses to display all the indexes with funds. 
 * 
 * IMPORTANT: Be careful using this script for moving real funds and avoid multiple executings while sending transactions to the tangle -> this will lead to lost funds
 * 
 * How to:
 *  1) Provide a proper node via config.node -> this node needs to have remote PoW enabled!
 *  2) Inspect one or more seeds
 *      a) set config.checkSeeds to true!
 *      b) inputs is an array of objects and you should at least speficy the seed(s) and the security levels (default of the wallet is 2)
 *      c) by default it will check the first 100 addresses of each seed -> if you need more, change config.addressesToCheck accordingly
 *      d) then you can run the script and it will iterate through the seeds and display any address with funds on it and their corresponding index
 *      e) prepare the inputs according to the seeds and indexes -> values will be added automatically in a later stage
 *  3) Send the funds
 *      a) set config.checkSeeds to false!
 *      b) Provide a proper target address where you want to send the funds to!!!!
 *      c) the input should contain one or more objects with a seed, secLevel and index each.
 *      d) for the first run you should set config.sendBundle to false!!! <- then we will not send the bundle, but display information, you so can check if everything is ok
 *      e) run the script
 *      f) check if the bundle is correct and if so, you can set config.sendBundle to true
 *      g) run the script again
 *          i) the script will now create a bundle - it will differ from the first run as the script is stateless, will sign it and will try to send it
 *          ii) if something goes wrong, you should not simply rerun the script -> it might reveal more parts of your address keys and might result in an address reuse!!! Rather take the bundle which is printed by default and use this to perform another PoW and reattach this to the tangle!!
 *      h) the script will print the transaction hash of one of the transactions -> you can use this in a tangle explorer of your choice and track the transaction/bundle
 *      
 *      
 * Hints:
 *   onlyValueAddresses - when set to false, it will display all addresses of a seed, instead of just printing those with value on it
 *   chunkSize - amount of addresses to fetch from the node in one request
 */

const iotakeccak=require('../iota.keccak.js');

const config={
    node:"https://nodes.thetangle.org:443",
    checkSeeds:true,
    addressesToCheck:100,
    targetAddress:"PROVIDE9TARGETADDRESS999999999999999999999999999999999999999999999999999999999999",
    depth:3,
    minWeightMagnitude:14,
    chunkSize:25,
    onlyValueAddresses:true,
    sendBundle:false
};

var inputs=[
    { seed:"PROVIDE9FIRST9SEED999999999999999999999999999999999999999999999999999999999999999",
      secLevel:2,
      index:5
    },
    { seed:"PROVIDE9FIRST9SEED999999999999999999999999999999999999999999999999999999999999999",
      secLevel:2,
      index:16
    },
    { seed:"PROVIDE9SECOND9SEED99999999999999999999999999999999999999999999999999999999999999",
      secLevel:3,
      index:0
    }
];


// do not modify below this line without reason

if(config.node=="https://node.example.com:443"){
    console.log("!!! Please set proper node !!!");
    process.exit(0);
}

if(config.checkSeeds){
    // we should just get the seed data;
   let seen = Object.create(null),
   toCheck = inputs.filter(o => {
       let key = ['seed', 'secLevel'].map(k => o[k]).join('|');
        if (!seen[key]) {
            seen[key] = true;
            return true;
        }
    });
    checkSeeds(toCheck);
} else {
    if (config.targetAddress==="PROVIDE9TARGETADDRESS999999999999999999999999999999999999999999999999999999999999"){
        console.log(getPrintableTime()+" - You need to specify a target address!");
        process.exit(1);        
    }
    if (inputs.length===0){
        console.log(getPrintableTime()+" - :troll: - no inputs provided!");
        process.exit(1);
    }
    let seen = Object.create(null),
    toUse = inputs.filter(o => {
       let key = ['seed', 'secLevel','index'].map(k => o[k]).join('|');
        if (!seen[key]) {
            seen[key] = true;
            return true;
        }
    });
    if (toUse.length!==inputs.length){
        console.log(getPrintableTime()+" - You have a duplicate input value (seed, security level and index are the same)!!");
        process.exit(1);
    }
    moveFunds();
}

async function checkSeeds(seeds){
    for (var i = 0, max = seeds.length; i < max; i++) {
        console.log(getPrintableTime()+" - Checking seed "+seeds[i].seed.slice(0,10)+"... with security level "+seeds[i].secLevel);
        let addresses=iotakeccak.getAddressFromSeedKeccak(seeds[i].seed,0,config.addressesToCheck,{secLevel:seeds[i].secLevel,quick:true});
        await checkBalances(addresses);
    }
    console.log(getPrintableTime()+" - Seed checks done");
}

async function checkBalances(addresses){
    for (let i=0,j=addresses.length; i<j; i+=config.chunkSize) {
        let curChunk=addresses.slice(i,i+config.chunkSize);
        let balances = await iotakeccak.getBalances(config.node,curChunk);
        let used = await iotakeccak.wereAddressesSpentFrom(config.node,curChunk);
        for (var k = 0, l = curChunk.length; k < l; k++) {
            if(balances.balances[k]>0 || !config.onlyValueAddresses){
                console.log("Index: "+(i+k)+" is "+(used.states[k]===true?"USED":"unused")+" and has "+(balances.balances[k]>0?formatBalance(balances.balances[k])+" iota":"no balance")+" on it -> Address: "+curChunk[k]);
            }
        }
    }
}

async function moveFunds() {
    var used = await iotakeccak.wereAddressesSpentFrom(config.node,config.targetAddress.slice(0,81));
    if(used.states[0]){
        console.log(getPrintableTime()+" - Target address was already used: "+config.targetAddress+" - exiting");
        process.exit(1);
    }
    var bundle = [{
        address:config.targetAddress,
        message:"9",
        tag:"9",
        value:0
    }];
    var totalValue=0;
    for (var i = 0, max = inputs.length; i < max; i++) {
        var address = await iotakeccak.getAddressFromSeedKeccak(inputs[i].seed,inputs[i].index,1,{secLevel:inputs[i].secLevel,quick:true});
        var balance = await iotakeccak.getBalances(config.node,address);
        used = await  iotakeccak.wereAddressesSpentFrom(config.node,address);
        if(used.states[0]){
            console.log(getPrintableTime()+" - Source address was already used: "+address+" - exiting");
            process.exit(1);
        }
        totalValue+=parseInt(balance.balances[0]);
        if(parseInt(balance.balances[0])<=0){
            console.log(getPrintableTime()+" - No balance on address: "+address+" - exiting");
            process.exit(1);
        }
        bundle.push({
            tag:"9",
            value:(-1*parseInt(balance.balances[0])),
            seed:inputs[i].seed,
            secLevel:inputs[i].secLevel,
            keyIndex:inputs[i].index
        });  
    }
    console.log(getPrintableTime()+" - Total bundle value: "+totalValue+" Iota");
    if(totalValue>0){
        bundle[0].value=totalValue;
        bundle=await iotakeccak.createBundleKeccak(bundle,{ignoreValue:false,skipSingatureValidation:false,quick:true});
        console.log(getPrintableTime()+" - Printing bundle -> for reference - in case PoW/store and broadcast fails, use this bundle as key fragments might already be exposed!!!");
        console.log("------------------------------");
        console.log(bundle.bundle);
        console.log("------------------------------");
        console.log(getPrintableTime()+" - Printing transaction objects");
        if(!config.sendBundle){
            console.log("------------------------------");
            for (var i = 0, max = bundle.bundle.length; i < max; i++) {
                console.log(iotakeccak.transactionObject(bundle.bundle[i]));
            };
            console.log("------------------------------");
            
            console.log(getPrintableTime()+" - Exiting here - If you want to send the funds, set config.sendBundle to true!");
            process.exit(1);
        }
        console.log(getPrintableTime()+" - Get transactions to approve")
        iotakeccak.getTransactionsToApprove(config.node,config.depth).
        then(function(result){
            console.log(getPrintableTime()+" - Performing proof of work");
            return iotakeccak.attachToTangle(config.node,result.trunkTransaction,result.branchTransaction,config.minWeightMagnitude,bundle.bundle);
        }).
        then(function(result){
            console.log(getPrintableTime()+" - TX created:"+iotakeccak.getTXHash(result.trytes[0]));
            console.log(getPrintableTime()+" - Store and broadcast");
            return iotakeccak.storeAndBroadcast(config.node,result.trytes);
        }). 
        then(function(result){
            console.log(getPrintableTime()+" - Done");
            process.exit(0);
        });
    } else {
        console.log(getPrintableTime()+" - No bundle value - exiting");
        process.exit(1);
    }
 }

/** helper functions **/
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
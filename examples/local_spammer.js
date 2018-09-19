/**
 * This is an example local PoW spammer completely working with iota.keccak.js
 * In order to use it, you need to place the libccurl file inside the folder where this script is started from!
 * 
 * I recommend to use https://github.com/DLTcollab/dcurl/:
 * $ git clone https://github.com/DLTcollab/dcurl/ 
 * $ cd dcurl
 * $ make BUILD_GPU=0 BUILD_JNI=0 BUILD_AVX=1 BUILD_COMPAT=1 check
 * $ (Linux) cp ./build/libdcurl.so [iota.keccak.js]/examples/libccurl.so
 * $ (Mac) cp ./build/libdcurl.so [iota.keccak.js]/examples/libccurl.dylib
 * 
 * By default the benchmark is enabled so you can test the max TPS that are possible - but no tx will be sent!
 * Please set a proper node and benchmark to false if you want to start spamming
 * You will notice a lower TPS in live mode as the getTransactionsToApprove and storeAndBroadcast calls will also consume some time. 
 * 
 * If you want to learn some things you can try to do the following improvements:
 * Fairly easy:
 * - try having multiple instances of createSpam running (!!! simply executing it twice will lead to unexpected behaviour as they share the same instance of toSend !!!)
 * Moderate:
 * - unbundle the different tasks (spam preparation/gtta/pow/sending of tx) for maximum performance
 * - check the connectHttp function of iota.keccak.js to use keep alive connections - will improve latency all net calls but needs to be supported by the server
 * Hard (unbundle first):
 * - combine this script with multiple remote PoW sources to get a heavy spammer running
 */

const iotakeccak = require('../iota.keccak.js');
const node={url:"https://nodes.example.com:443"};
const spam=[{address:"IOTA9KECCAK9JS9SPAMMER",
            message:"IOTA9KECCAK9JS9SPAMMER",
            tag:"IOTA9KECCAK9JS9SPAMMER"}];
const config={loop:true,sleeptime:10,sendSize:1,depth:3,mwm:14,benchmark:true};
var toSend=[];
var counter=0;
var lastCounter=0;
var lastTimestamp=new Date();
var scriptStart=new Date();

if(node.url=="https://nodes.example.com:443" && !config.benchmark){
    console.log("!!! Please set a proper node !!!");
    process.exit(0);
}

setInterval(function() {
    console.log(getPrintableTime()+" - Spam sent: "+counter+" = "+calulateRate(counter,scriptStart)+" TPS - Spam during last interval: "+(counter-lastCounter)+" = "+calulateRate((counter-lastCounter),lastTimestamp));
    lastTimestamp=new Date();
    lastCounter=counter+0;
}, 30000);

createSpam(spam.slice(),node);

function createSpam(spam,node){
    var trytes=[];
    //lets overwrite the obsolete tag to prevent reattaches
    spam[0].obsoleteTag=getRandIotaChar()+getRandIotaChar()+getRandIotaChar();   
    iotakeccak.createBundleKeccak(spam,{skipInputValidation:true,quick:true}).
    then(function(result){
        trytes=result.bundle;
        if(config.benchmark){
            return {trunkTransaction:"9".repeat(91),branchTransaction:"9".repeat(91)};
        } else {
            return iotakeccak.getTransactionsToApprove(node,config.depth);
        }
    }).
    then(function(result){
        return iotakeccak.doPoW(trytes,result.trunkTransaction,result.branchTransaction,config.mwm);
    }).
    then(function(result){
        if(result.success){
            for (var i = 0, max = result.trytes.length; i < max; i++) {
                toSend.push(result.trytes[i]);
            }
            if(config.benchmark){
                return false;
            } else if(toSend.length<config.sendSize){
                return true;
            } else {
                return iotakeccak.storeAndBroadcast(node,toSend);
            }
        } else {
            console.log(getPrintableTime()+" - PoW failed:");
            console.log(result.error);
            return true;
        }
    }).
    then(function(result){
        if(result!==true){
            for (var i = 0, max = toSend.length; i < max; i++) {
                console.log(getPrintableTime()+" - TX sent:"+iotakeccak.getTXHash(toSend[i]));
                counter++;
            }
            toSend=[];
        }
        if(config.loop) setTimeout(createSpam.bind(null,spam.slice(),node), config.sleeptime); 
    })
}


function calulateRate(value,timestamp){
    // simple rate calculator
    return(Math.ceil(((value*1000000)/(new Date()-timestamp)))/1000);   
}

function getPrintableTime(){
    // simple timestamp printer
    var currentdate = new Date(); 
    return ("0"+currentdate.getHours()).slice(-2) + ":"  
                    + ("0"+currentdate.getMinutes()).slice(-2) + ":" 
                    + ("0"+currentdate.getSeconds()).slice(-2);
}

function getRandIotaChar(){
    var alph=["N","O","P","Q","R","S","T","U","V","W","X","Y","Z","9","A","B","C","D","E","F","G","H","I","J","K","L","M"];
    return alph[getRandomIntInclusive(0,27)];
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min)) + min; 
}
const iotakeccak = require('../iota.keccak.js');
var node={url:"https://nodes.iota.fm:443"};
var pownode={url:"https://api.powsrv.io:443"};
var spam=[{address:"IOTA9KECCAK9JS9SPAMMER",
            message:"IOTA9KECCAK9JS9SPAMMER",
            tag:"IOTA9KECCAK9JS9SPAMMER"}];  

/*
 * use this config to create a free running spammer
 * var config={loop:true,sleeptime:2000,silent:true};
 */
var config={loop:false,sleeptime:2000,silent:false};
createSpam(spam,node,pownode);


function createSpam(spam,node,pownode){
    var trytes=[];
    if(!config.silent) console.log(getPrintableTime()+" - Create bundle");
    iotakeccak.createBundleKeccak(spam,{skipInputValidation:true,quick:true}).
    then(function(result){
        trytes=result.bundle;
        if(!config.silent) console.log(getPrintableTime()+" - Get transactions to approve");
        return iotakeccak.getTransactionsToApprove(node,3);
    }).
    then(function(result){
        if(!config.silent) console.log(getPrintableTime()+" - Performing proof of work");
        return iotakeccak.attachToTangle(pownode,result.trunkTransaction,result.branchTransaction,14,trytes);
    }).
    then(function(result){
        console.log(getPrintableTime()+" - TX created:"+iotakeccak.getTXHash(result.trytes[0]));
        if(!config.silent) console.log(getPrintableTime()+" - Store and broadcast");
        return iotakeccak.storeAndBroadcast(node,result.trytes);
    }).
    then(function(result){
        if(!config.silent) console.log(getPrintableTime()+" - Done");
        if(config.loop) setTimeout(createSpam.bind(null,spam,node,pownode), config.sleeptime); 
    })
}

function getPrintableTime(){
    // simple timestamp printer
    var currentdate = new Date(); 
    return ("0"+currentdate.getHours()).slice(-2) + ":"  
                    + ("0"+currentdate.getMinutes()).slice(-2) + ":" 
                    + ("0"+currentdate.getSeconds()).slice(-2);
}
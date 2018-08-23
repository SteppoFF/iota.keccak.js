const iotakeccak = require('./iota.keccak.js');
var addresscount=100;
var seed=getRandomSeed();
var seclevel=2;

console.log("Seed set to: "+seed);
console.log("");
console.log("Comparing address gen function without checksum:");
var timer=Date.now();
var keccekresult=iotakeccak.getAddressFromSeedKeccak(seed,0,addresscount,{secLevel:seclevel,quick:false});
console.log("iota.keccak.js for "+addresscount+" addresses: "+(Date.now()-timer)+"ms");
var timer=Date.now();
var keccekresultquick=iotakeccak.getAddressFromSeedKeccak(seed,0,addresscount,{secLevel:seclevel,quick:true});
console.log("iota.keccak.js quick for "+addresscount+" addresses: "+(Date.now()-timer)+"ms");
var valid=true;
for (var i = 0, max = keccekresult.length; i < max; i++) {
   if(keccekresult[i]!==keccekresultquick[i]){
       valid=false;
   } 
}
console.log("Comparing results: "+(valid?"match":"missmatch"));
console.log("");

console.log("Comparing address gen function with checksum:");
var timer=Date.now();
keccekresult=iotakeccak.getAddressFromSeedKeccak(seed,0,addresscount,{secLevel:seclevel,addChecksum:true,quick:false});
console.log("iota.keccak.js for "+addresscount+" addresses: "+(Date.now()-timer)+"ms");
var timer=Date.now();
keccekresultquick=iotakeccak.getAddressFromSeedKeccak(seed,0,addresscount,{secLevel:seclevel,addChecksum:true,quick:true});
console.log("iota.keccak.js quick for "+addresscount+" addresses: "+(Date.now()-timer)+"ms");
valid=true;
for (var i = 0, max = keccekresult.length; i < max; i++) {
   if(keccekresult[i]!==keccekresultquick[i]){
       valid=false;
   } 
}
console.log("Comparing results: "+(valid?"match":"missmatch"));
console.log("");

console.log("Comparing bundle creating/signing function - Iri call bypassed:");

spam = [{
    address:keccekresult[0].slice(0,81),
    message:"IOTA9KECCAK9JS",
    tag:"IOTA9KECCAK9JS",
    value:keccekresult.length
}];
spam2 = [{
    address:keccekresult[0].slice(0,81),
    message:"IOTA9KECCAK9JS",
    tag:"IOTA9KECCAK9JS",
    value:keccekresult.length
}];
var inputs=[];
for (var i = 0, max = keccekresult.length; i < max; i++) {
  spam.push({
    address:keccekresult[i].slice(0,81),
    tag:"IOTA9KECCAK9JS",
    value:-1,
    seed:seed,
    secLevel:seclevel,
    keyIndex:i
    });
  spam2.push({
    tag:"TROLL",
    value:-1,
    seed:seed,
    secLevel:seclevel,
    keyIndex:i
  });
}
timer=Date.now();
iotakeccak.createBundleKeccak(spam2,{ignoreValue:false,skipSingatureValidation:true,quick:false}).
then(function(result){
    console.log("iota.keccak.js without provided address for "+(spam2.length-1)+" inputs: "+(Date.now()-timer)+"ms");
    timer=Date.now();
    return iotakeccak.createBundleKeccak(spam2,{ignoreValue:false,skipSingatureValidation:true,quick:true});
}).
then(function(result){
    console.log("iota.keccak.js quick without provided address for "+(spam2.length-1)+" inputs: "+(Date.now()-timer)+"ms");
    timer=Date.now()
    return iotakeccak.createBundleKeccak(spam,{ignoreValue:false,skipSingatureValidation:false,quick:false})
}).
then(function(result){
    console.log("iota.keccak.js with provided address and validation for "+(spam.length-1)+" inputs: "+(Date.now()-timer)+"ms");
    timer=Date.now();
    return iotakeccak.createBundleKeccak(spam,{ignoreValue:false,skipSingatureValidation:false,quick:true})
}).
then(function(result){
    console.log("iota.keccak.js quick with provided address and validation for "+(spam.length-1)+" inputs: "+(Date.now()-timer)+"ms");
    timer=Date.now();
    return iotakeccak.createBundleKeccak(spam,{ignoreValue:false,skipSingatureValidation:true,quick:false})
}).
then(function(result){
    console.log("iota.keccak.js with provided address for "+(spam.length-1)+" inputs: "+(Date.now()-timer)+"ms");
    timer=Date.now();
    return iotakeccak.createBundleKeccak(spam,{ignoreValue:false,skipSingatureValidation:true,quick:true})
}).
then(function(result){
    console.log("iota.keccak.js quick with provided address for "+(spam.length-1)+" inputs: "+(Date.now()-timer)+"ms");
});  

function getRandomSeed(){
    return getRandIotaString(81);
}
function getRandIotaString(count){
    var ret="";
    for (var i=0; i<count;i++){
        ret+=getRandIotaChar();
    }
    return ret;
}
function getRandIotaChar(){
    var alph=["N","O","P","Q","R","S","T","U","V","W","X","Y","Z","9","A","B","C","D","E","F","G","H","I","J","K","L","M"];
    return alph[getRandomIntInclusive(0,27)];
}
function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min)) + min; 
}

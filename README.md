# Welcome to iota.keccak.js!

**This lib is not made nor audited by the IOTA Foundation - It is community code and comes without any warranty! Do not use this library for moving big amount of funds - unless you checked the code!**

This node.js module provides a replacement for most of the kerl, curl and net functions from the iota.lib.js. It can be used to build high performance node-js spammers but is also capable of signing inputs on value bundles. All the files in the helper folder I took from the official [iota.lib.js](https://github.com/iotaledger/iota.lib.js) and optimized them for my needs. Using a smart implementation and remote PoW, this script is easily capable of performing 100 TPS - IRI is the bottleneck here.

Provided functions - check source code for options:
- getAddressFromSeedKeccak(seed,offset,count,options) - kerl function to create addresses
- createBundleKeccak(bundles,options) - kerl function to create bundles
- createBundleHashKeccakfunction(bundle, maxSecLevel) - kerl function to create the bunde hash
- getAddressKeccak(normalizedBundleHash, signatureFragments, quick) - kerl function get the address
- singleSignatureFragmentKeccak(curFragment, targetIndex, quick) - kerl signing function
- getKeyKeccak(seed, index, length, quick) - kerl function to get the key fragment from seed
- getTXHash(trytes) - curl function get the tx hash
- doPoWPureJS(trytes, maxrounds, mwm) - pure JS implementation of PoW (more an easter egg as it is way too slow)
- doPoW(trytes,trunkTransaction,branchTransaction,minWeightMagnitude) - requires the ffi version and ccurl (check source code and [local spammer example](https://github.com/SteppoFF/iota.keccak.js/tree/master/examples/local_spammer.js) for more info!)
- transactionObject(transactionTrytes) - transforms trytes into a transaction object
- transactionTrytes(transaction) - transforms a transaction object back into its trytes
- validateMilestone(transactionTrytes,cooAddress,curlMode,milestoneKeyNum) - validates milestone transactions
- connectHttp(node) - will enable the keep-alive feature for network functions (!the node needs to support it!)
- storeAndBroadcast(node,trytes) - chaining of store and broadcast command to publish transactions
- attachToTangle(node,trunkTransaction,branchTransaction,minWeightMagnitude,trytes) - remote PoW
- getTransactionsToApprove(node,depth,reference) - the regular gtta call
- getNodeInfo(node) - perform a getNodeInfo call

During installation at least these two modules will be installed as well (slim):

Keccak [npm](https://www.npmjs.com/package/keccak) / [github](https://github.com/cryptocoinjs/keccak)

crypto-js [npm](https://www.npmjs.com/package/crypto-js) / [github](https://github.com/brix/crypto-js)

If you install the full version with local PoW support (master):

ffi [npm](https://www.npmjs.com/package/ffi) / [github](https://github.com/node-ffi/node-ffi)

## To-do

 - [ ] better documentation
 - [ ] input validation for other functions than createBundleKeccak
 - [ ] create npm project

## Quickstart: 

### Install:
If you want to use the local PoW, please user the master
 npm install git+https://github.com/SteppoFF/iota.keccak.js/#master
 **OR**
If you just want to have the kerl/curl/net functions, you can go with the slim version
 npm install git+https://github.com/SteppoFF/iota.keccak.js/#slim

### Using local PoW
In order to use local PoW with the master branch, the libccurl lib must be present in the folder
where the final script is started from. Please check the [local spammer example](https://github.com/SteppoFF/iota.keccak.js/tree/master/examples/local_spammer.js) for more info.

### Usage:
Generating addresses
```js
const iotakeccak = require('iota.keccak.js');
var addresscount=100;
var seed="BSSDLSHPEFDULVWVCSDCUIIGWGVEDJHFWZCBYNDYSDB9GECGUFGKYBSOPEBUXVJUX9QGEBHKKZCTYH9VX";
var seclevel=2;
console.log("Seed set to: "+seed);
console.log("Creating "+addresscount+" addresses");
var addresses=iotakeccak.getAddressFromSeedKeccak(seed,0,addresscount,{secLevel:seclevel,quick:false});
console.log(addresses);
```
Bundle creation
```js
const iotakeccak = require('iota.keccak.js');
var spam = [{
    address:"IOTA9KECCAK9JS",
    message:"JOHN",
    tag:"DOE"
}];

iotakeccak.createBundleKeccak(spam,{skipInputValidation:true,ignoreValue:false,quick:true})
.then(function(result){
	console.log(result);
});
```
For more examples check the [expamples folder](https://github.com/SteppoFF/iota.keccak.js/tree/master/examples).
You will find several examples there how to use this module

## Benchmark for address creation and signing
```
Seed set to: IBYMRX......

Comparing address gen function without checksum:
iota.keccak.js for 100 addresses: 21315ms
iota.keccak.js quick for 100 addresses: 8063ms
iota.lib.js for 100 addresses: 57042ms
Comparing results: match

Comparing address gen function with checksum:
iota.keccak.js for 100 addresses: 21012ms
iota.keccak.js quick for 100 addresses: 7953ms
iota.lib.js for 100 addresses: 56574ms
Comparing results: match

Comparing bundle creating/signing function - Iri call bypassed:
iota.keccak.js without provided address for 100 inputs: 31837ms
iota.keccak.js quick without provided address for 100 inputs: 12773ms
iota.keccak.js with provided address and validation for 100 inputs: 21152ms
iota.keccak.js quick with provided address and validation for 100 inputs: 8584ms
iota.keccak.js with provided address for 100 inputs: 10869ms
iota.keccak.js quick with provided address for 100 inputs: 4767ms
iota.lib.js for 100 provided inputs: 29722ms
```

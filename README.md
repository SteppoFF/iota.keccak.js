# Welcome to iota.keccak.js!

**This lib is not made nor audited by the IOTA Foundation - It is community code and comes without any warranty! Do not use this library for moving big amount of funds - unless you checked the code!**

This is node.js module provides a replacement for most of the kerl functions from the iota.lib.js. Can be used to build high performance spammers. I took some js files from the official iota.lib.js - thanks for this awesome peace of software!

Provided functions - check source code for options:
- getAddressFromSeedKeccak(seed,offset,count,options)
- createBundleKeccak(bundles,options)
- createBundleHashKeccakfunction(bundle, maxSecLevel)
- getAddressKeccak(normalizedBundleHash, signatureFragments, quick)
- singleSignatureFragmentKeccak(curFragment, targetIndex, quick)
- getKeyKeccak(seed, index, length, quick) 

During install these two modules will be installed as well:

Keccak [npm](https://www.npmjs.com/package/keccak) / [npm](https://github.com/cryptocoinjs/keccak)

crypto-js [npm](https://www.npmjs.com/package/crypto-js) / [npm](https://github.com/brix/crypto-js)


## To-do

 - [ ] better documentation
 - [ ] input validation for other functions than createBundleKeccak
 - [ ] create npm project

## Quickstart: 

### Install:
 1. Move to the `nodes_module` folder of your project
 2. Clone via git `git clone https://github.com/SteppoFF/iota.keccak.js` **or** download repository as zip and extract
 3. move to the directory and install using `npm install`

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
For more examples check the source of example.js which can be run as a benchmark tool as well.

## Benchmark
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



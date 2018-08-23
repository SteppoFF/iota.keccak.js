const CryptoJS = require("crypto-js");
const SHA3 = require('keccak');
const WConverter = require("./helpers/words.js");
const Converter = require('./helpers/converter.js');
const tritAdd = require("./helpers/adder.js");
const inputValidator = require("./helpers/inputValidator.js");

var getAddressFromSeedKeccak = function(seed,offset,count,options){
    if(typeof(options)==="undefined"){
        options = {}
    }
    if(typeof(options.secLevel)==="undefined"){
        // Security Level
        options.secLevel=2;
    }
    if(typeof(options.quick)==="undefined"){
        // make it quicker using an experimental version of the converter with certain breakpoints
        options.quick=false;
    }
    if(typeof(options.addChecksum)==="undefined"){
        // make it quicker using an experimental version of the converter with certain breakpoints
        options.addChecksum=false;
    }
    var seedTrits=Converter.trits(seed);
    var ret=[];
    for (var i = offset+0, max = offset+count; i < max; i++) {
        var key = Converter.trytes(getKeyKeccak(seedTrits, i, options.secLevel,options.quick));
        // chunk it ;-)
        ret.push(getAddressKeccak(null,chunkArray(key,2187),options.quick));
    }
    if(options.addChecksum===true){
       ret=addChecksumKeccak(ret, 9, true); 
    }
    return ret;
}

var createBundleKeccak = function(bundles,options){
    return new Promise((resolve, reject) => {
        if(typeof(options)==="undefined"){
            options = {}
        }
        if(typeof(options.skipInputValidation)==="undefined"){
            // skip the input validation - if you code your stuff properly: go for it
            options.skipInputValidation=false;
        }
        if(typeof(options.ignoreValue)==="undefined"){
            // will not check the total value of the bundle - so make sure it fits
            options.ignoreValue=false;
        }
        if(typeof(options.skipSingatureValidation)==="undefined"){
            // the signature validation can and _should_ be skipped if possible takes as long as the signing
            options.skipSingatureValidation=false;
        }
        if(typeof(options.skipBundleValidation)==="undefined"){
            // skip the final bundle validation
            options.skipBundleValidation=false;
        }
        if(typeof(options.quick)==="undefined"){
            // make it quicker using an experimental version of the converter with certain breakpoints
            options.quick=false;
        }
        // lets validate
        if (options.skipInputValidation!==true){
          for(var i=0,bundleindex=0, max=bundles.length;i<max;i++){
            // address
            if(typeof(bundles[i].address)!=="undefined"){
                if(bundles[i].address.length===81||bundles[i].address.length===90){
                    // full address
                    if (!inputValidator.isAddress(bundles[i].address)){
                        resolve({success:false,errormsg:"Invalid input for type address on index "+i});
                        return;
                    } 
                } else if (!inputValidator.isTrytes(bundles[i].address,"0,90")) {
                    resolve({success:false,errormsg:"Invalid input for value address on index "+i});
                    return;
                }
            }
            // tag
            if(typeof(bundles[i].tag)!=="undefined"){
                if (!inputValidator.isTrytes(bundles[i].tag,"0,27")) {
                    resolve({success:false,errormsg:"Invalid input for value tag on index "+i});
                    return;
                } 
            }
            // obsolete tag
            if(typeof(bundles[i].obsoleteTag)!=="undefined"){
                if (!inputValidator.isTrytes(bundles[i].tag,"0,27")) {
                    resolve({success:false,errormsg:"Invalid input for value obsoleteTag on index "+i});
                    return;
                }
            }
            // value
            if(typeof(bundles[i].value)!=="undefined"){
                if (!inputValidator.isValue(bundles[i].value)) {
                    resolve({success:false,errormsg:"Invalid input for value value on index "+i});
                    return;
                } else if(bundles[i].value<0){
                    // signing related
                    // validate seed
                    if (!inputValidator.isTrytes(bundles[i].seed,"81")) {
                        resolve({success:false,errormsg:"Invalid input for value seed on index "+i});
                        return;
                    }
                    // validate key index
                    if (!inputValidator.isValue(bundles[i].keyIndex) || bundles[i].keyIndex<0) {
                        resolve({success:false,errormsg:"Invalid input for value keyIndex on index "+i});
                        return;
                    }
                    // validate sec level
                    if (!inputValidator.isValue(bundles[i].secLevel) || bundles[i].secLevel<1 || bundles[i].secLevel>2) {
                        resolve({success:false,errormsg:"Invalid input for value keyIndex on index "+i});
                        return;
                    }
                    // message on input? NAH!
                    if(typeof(bundles[i].message)!=="undefined"){
                        if (inputValidator.isTrytes(bundles[i].message,"1,2187")) {
                            resolve({success:false,errormsg:"You cannot set message for input on index "+i});
                            return;
                        }
                    }
                } 
            }
            // signature fragment
            if(typeof(bundles[i].message)!=="undefined"){
                if (!inputValidator.isTrytes(bundles[i].message,"0,2187")) {
                    resolve({success:false,errormsg:"Invalid input for value message on index "+i});
                    return;
                } 
            }
            // timestamp
            if(typeof(bundles[i].timestamp)!=="undefined"){
                if (!inputValidator.isValue(bundles[i].timestamp) || bundles[i].timestamp<=0) {
                    resolve({success:false,errormsg:"Invalid input for value timestamp on index "+i});
                    return;
                } 
            }
            // branch & trunk... will likely be overwritten by PoW.. but who knows ;-)
            if(typeof(bundles[i].trunkTransaction)!=="undefined"){
                if (!inputValidator.isTrytes(bundles[i].trunkTransaction,"81")) {
                    resolve({success:false,errormsg:"Invalid input for value trunkTransaction on index "+i});
                    return;
                } 
            }
            if(typeof(bundles[i].branchTransaction)!=="undefined"){
                if (!inputValidator.isTrytes(bundles[i].branchTransaction,"81")) {
                    resolve({success:false,errormsg:"Invalid input for value branchTransaction on index "+i});
                    return;
                } 
            }
          }  
        }
        var bundle=[],
            signingHelper={},
            maxSecLevel=0,
            value=0,
            timings={};
        var timer2=0;
        // create the bundle
        var timer=Date.now();
        var tmptimings={key:[],signing:[],validation:[]};
        for(var i=0,bundleindex=0, max=bundles.length-1;i<=max;i++){
            bundle.push({
                address:((typeof(bundles[i].address)!=="undefined"?bundles[i].address:"")+'9'.repeat(81)).slice(0,81),
                tag:((typeof(bundles[i].tag)!=="undefined"?bundles[i].tag:"")+'9'.repeat(27)).slice(0,27),
                obsoleteTag:((typeof(bundles[i].obsoleteTag)!=="undefined"?bundles[i].obsoleteTag:(typeof(bundles[i].tag)!=="undefined"?bundles[i].tag:""))+'9'.repeat(27)).slice(0,27),
                value:(typeof(bundles[i].value)!=="undefined"?parseInt(bundles[i].value):0),
                signatureMessageFragment:((typeof(bundles[i].message)!=="undefined"?bundles[i].message:"")+'9'.repeat(2187)).slice(0,2187),
                timestamp:(typeof(bundles[i].timestamp)!=="undefined"?parseInt(bundles[i].timestamp):Math.floor(Date.now()/1000)),
                currentindex:0, // will be set during bundle hash calculation
                lastindex:0, // will be set during bundle hash calculation
                trunkTransaction:((typeof(bundles[i].trunkTransaction)!=="undefined"?bundles[i].trunkTransaction:"")+'9'.repeat(81)).slice(0,81),
                branchTransaction:((typeof(bundles[i].branchTransaction)!=="undefined"?bundles[i].branchTransaction:"")+'9'.repeat(81)).slice(0,81)
            });
            value+=bundle[bundleindex].value;
            if(bundle[bundleindex].value<0){
                // prepare signing
                if(maxSecLevel<bundles[i].secLevel){
                    maxSecLevel=bundles[i].secLevel;
                }
                // lets check if address is properly set - if the address is known in advance, set it!
                if (inputValidator.isNinesTrytes(bundle[bundleindex].address)){
                    // lazy people.. let's do the work
                    bundle[bundleindex].address=getAddressFromSeedKeccak(bundles[i].seed,bundles[i].keyIndex,1,{secLevel:bundles[i].secLevel,quick:options.quick})[0];
                }
                // check if address is present in helper
                if(typeof(signingHelper[bundle[bundleindex].address])==="undefined"){
                      signingHelper[bundle[bundleindex].address]={seed:bundles[i].seed,keyIndex:bundles[i].keyIndex,secLevel:bundles[i].secLevel,fragments:[]};  
                }
                if (signingHelper[bundle[bundleindex].address].fragments.length<1) signingHelper[bundle[bundleindex].address].fragments.push("");
                for (var j=1;j<bundles[i].secLevel;j++) {
                    // prepare signature tx
                    bundle.push({
                        address:bundle[bundleindex].address,
                        tag:bundle[bundleindex].tag,
                        obsoleteTag:bundle[bundleindex].obsoleteTag,
                        value:0,
                        signatureMessageFragment:'9'.repeat(2187),
                        timestamp:bundle[bundleindex].timestamp,
                        currentindex:0, // will be set during bundle hash calculation
                        lastindex:0, // will be set during bundle hash calculation
                        trunkTransaction:'9'.repeat(81),
                        branchTransaction:'9'.repeat(81)
                    });
                    if (signingHelper[bundle[bundleindex].address].fragments.length<j) signingHelper[bundle[bundleindex].address].fragments.push("");
                    bundleindex++;
                }
            }
            bundleindex++;
        }
        timings.bundleCreate=(Date.now()-timer);
        if(value!==0 && options.ignoreValue!==true){
            // would be an inconsistent bundle - set to ignore using options - if needed
            resolve({success:false,errormsg:"Sum of bundle value not 0",info:{timings:timings}});
            return;
        }
        // calculate the bundlehash      
        timer=Date.now();
        createBundleHashKeccak(bundle,maxSecLevel).
        then(function(result){
            timings.bundleHashCreate=(Date.now()-timer);
            timer=Date.now();
            // update bundle
            for(var i=0, max=bundle.length;i<max;i++){
                bundle[i].bundle=result.hash;
                bundle[i].attachmentTimestamp = '9'.repeat(9);
                bundle[i].attachmentTimestampLowerBound = '9'.repeat(9);
                bundle[i].attachmentTimestampUpperBound = '9'.repeat(9);
                bundle[i].nonce = '9'.repeat(27);
                // check for signing requirements
                if (bundle[i].value < 0){
                    // we need to sign
                    if(signingHelper[bundle[i].address].fragments[0]!==""){
                        // cache hit - no need to do work again
                        for (var j = 0; j < signingHelper[bundle[i].address].secLevel; j++) {
                            // get key fragments from cache
                            bundle[i+j].signatureMessageFragment=signingHelper[bundle[i].address].fragments[j];
                        }
                    } else {
                        // get key
                        timer2=Date.now();
                        var key = getKeyKeccak(Converter.trits(signingHelper[bundle[i].address].seed), signingHelper[bundle[i].address].keyIndex, signingHelper[bundle[i].address].secLevel,options.quick);
                        tmptimings.key.push((Date.now()-timer2));
                        // only calculate the bundle hash once
                        if(typeof(normalizedBundleHash)==="undefined"){
                            var normalizedBundleHash = normalizedBundleFromTrits(Converter.trits(bundle[i].bundle),maxSecLevel);
                        }
                        // sign input
                        if(options.skipSingatureValidation!==true){
                            var signatureFragments=[];
                        }
                        timer2=Date.now();
                        for (var j = 0; j < signingHelper[bundle[i].address].secLevel; j++) {
                            // get key fragment
                            bundle[i+j].signatureMessageFragment="";
                            // calculate 27 fragments
                            for (var k = 0; k<27;k++){
                                bundle[i+j].signatureMessageFragment+=singleSignatureFragmentKeccak(Converter.trytes(key.slice(243*j*27+k*243, 243*j*27+k*243+243)), normalizedBundleHash[j*27+k],options.quick);
                            }
                            // push to helper
                            signingHelper[bundle[i].address].fragments[j]=""+bundle[i+j].signatureMessageFragment;
                            // push to validator
                            if(options.skipSingatureValidation!==true){
                                signatureFragments.push(bundle[i+j].signatureMessageFragment);
                            }
                        }
                        tmptimings.signing.push((Date.now()-timer2));
                        // validate - maybe wrong seed or index
                        if(options.skipSingatureValidation!==true){
                            timer2=Date.now();
                            if (getAddressKeccak(normalizedBundleHash,signatureFragments,options.quick)!==bundle[i].address){
                                // validation failed - invalid bundle - will never confirm, so no need to continue
                                resolve({success:false,errormsg:"Invalid signature for address "+bundle[i].address,info:{timings:timings}});
                                return;
                            }
                            tmptimings.validation.push((Date.now()-timer2));
                        }
                    }
                }
            }
            timings.bundleSigningTotal=(Date.now()-timer);
            timer=Date.now();
            // convert to trytes
            for (var i = 0, max = bundle.length; i < max; i++) {
                bundle[i]=transactionTrytes(bundle[i]);
            }
            timings.bundleTrytes=(Date.now()-timer);
            // done...
            timings.signingAVG={key:getAverage(tmptimings.key),signing:getAverage(tmptimings.signing),validation:getAverage(tmptimings.validation)};
            if(options.skipBundleValidation!==true){
                timer=Date.now();
                if(!inputValidator.isArrayOfTrytes(bundle)){
                    timings.bundleTrytesValidation=(Date.now()-timer);
                    resolve({success:false,errormsg:"Bundle trytes validation failed",info:{timings:timings}});
                    return false;
                }
                timings.bundleTrytesValidation=(Date.now()-timer);
            }
            resolve({success:true,bundle:bundle.reverse(),info:{timings:timings}});
        });
    });
}

var createBundleHashKeccak = function(bundle, maxSecLevel){
    return new Promise((resolve, reject) => {
        var sha3 = new SHA3('keccak384'),
            valueTrits = [],
            timestampTrits = [],
            currentIndexTrits = [],
            lastIndexTrits = [],
            essence = [],
            valueBundle=false;
        for (var i=0, max=bundle.length; i < max; i++) {
            if(bundle[i].value<0){
               valueBundle=true; 
            }
            valueTrits = Converter.trits(bundle[i].value);
            while (valueTrits.length < 81) {
                valueTrits[valueTrits.length] = 0;
            }
            timestampTrits = Converter.trits(bundle[i].timestamp);
            while (timestampTrits.length < 27) {
                timestampTrits[timestampTrits.length] = 0;
            }
            currentIndexTrits = Converter.trits(bundle[i].currentIndex = i);
            while (currentIndexTrits.length < 27) {
                currentIndexTrits[currentIndexTrits.length] = 0;
            }
            lastIndexTrits = Converter.trits(bundle[i].lastIndex = bundle.length - 1);
            while (lastIndexTrits.length < 27) {
                lastIndexTrits[lastIndexTrits.length] = 0;
            }
            sha3.update(Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Converter.trits(bundle[i].address))).toString(),'hex'));
            if(!valueBundle || i<(max-1)){
                sha3.update(Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Converter.trits(Converter.trytes(valueTrits) + bundle[i].obsoleteTag + Converter.trytes(timestampTrits) + Converter.trytes(currentIndexTrits) + Converter.trytes(lastIndexTrits)))).toString(),'hex'));
            } else {
                // we have a value bundle and last round.. prepare the crypto instead
                essence=Converter.trits(Converter.trytes(valueTrits)+bundle[i].obsoleteTag+Converter.trytes(timestampTrits)+Converter.trytes(currentIndexTrits) + Converter.trytes(lastIndexTrits));
            }
        }
        if (!valueBundle){
            // no value bundle... we don't care about M
            resolve({success:true,hash:Converter.trytes((Array.from(WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(sha3.digest(), "binary").toString('base64')).words))))});
        } else {
            // get into a loop as we need to avoid M
            var sha3clone = new SHA3('keccak384'),
                hash = [], normalizedHash = [],
                tagtrits = Converter.trits(bundle[(bundle.length-1)].obsoleteTag);
            while(valueBundle) {
                sha3clone=sha3._clone();
                essence.splice(81,81,...tagtrits);
                sha3clone.update(Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(essence)).toString(),'hex'));
                hash=(Array.from(WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(sha3clone.digest(), "binary").toString('base64')).words)));
                normalizedHash = normalizedBundleFromTrits(hash,maxSecLevel);
                if (normalizedHash.indexOf(13)===-1){
                    // no M .. done
                    valueBundle=false;
                } else {
                    //catch M!!!!!
                    tagtrits=tritAdd(tagtrits, [1]);
                }
            }
            bundle[(bundle.length-1)].obsoleteTag=Converter.trytes(tagtrits)
            resolve({success:true,hash:Converter.trytes(hash)});
        }
    });    
}
       
var getAddressKeccak = function(normalizedBundleHash, signatureFragments, quick){
    if(normalizedBundleHash===null){
        normalizedBundleHash=[];
        for (var i = 0, max=signatureFragments.length*27; i < max; i++) {
            normalizedBundleHash.push(13);
        }
    }
    if(typeof(quick)==="undefined"){
       quick=false; 
    }
    var sha3 = new SHA3('keccak384'),
        aSha3 = new SHA3('keccak384'),
        bSha3 = new SHA3('keccak384'),
        hash = Buffer,tmp=Buffer;
    for (var k = 0, max = signatureFragments.length; k < max; k++) {
        aSha3 = new SHA3('keccak384');
        for (var i = 0; i < 27; i++) {
            hash = Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Converter.trits(signatureFragments[k].slice(i*81,i*81+81)))).toString(),'hex');        
            for (var j = normalizedBundleHash[k*27+i] + 13; j-- > 0; ) {
                sha3 = new SHA3('keccak384');
                sha3.update(hash);
                if(quick===true){
                    tmp=sha3.digest();
                    // lets call modified words_to_trits
                    hash=WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(tmp, "binary").toString('base64')).words,true);
                    if(hash===true){
                        // buffer will not be modified - we can keep it
                        hash=tmp;
                    } else {
                        hash=Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Array.from(hash))).toString(),'hex');
                    }
                } else {
                    hash=Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Array.from(WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(sha3.digest(), "binary").toString('base64')).words)))).toString(),'hex');                
                }
            }
            aSha3.update(hash);
        }
        bSha3.update(Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Array.from(WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(aSha3.digest(), "binary").toString('base64')).words)))).toString(),'hex'));
    }
    return Converter.trytes((Array.from(WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(bSha3.digest(), "binary").toString('base64')).words))));
}

var singleSignatureFragmentKeccak = function(curFragment, targetIndex, quick) {
    var sha3 = new SHA3('keccak384'),
        hash = Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Converter.trits(curFragment))).toString(),'hex'),
        tmp = Buffer;
    if(typeof(quick)==="undefined"){
       quick=false; 
    }
    for (var j = 13+targetIndex*-1; j-- > 0;) {
        sha3 = new SHA3('keccak384');
        sha3.update(hash);
        if (j>0) {
            if(quick===true){
                tmp = sha3.digest();
                // lets call modified words_to_trits - will return true if buffer is not going to change
                hash = WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(tmp, "binary").toString('base64')).words,true);
                if(hash===true){
                    // buffer will not be modified - we can keep it
                    hash = tmp;
                } else {
                    hash = Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Array.from(hash))).toString(),'hex');
                }
            } else {
                hash=Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Array.from(WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(sha3.digest(), "binary").toString('base64')).words)))).toString(),'hex');
            }
        }
    }
    return Converter.trytes((Array.from(WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(sha3.digest(), "binary").toString('base64')).words))));
}

var getKeyKeccak = function(seed, index, length, quick) {
    var sha3 = new SHA3('keccak384'),
        tmp=Buffer;
    while ((seed.length % 243) !== 0) {
      seed.push(0);
    }
    if(typeof(quick)==="undefined"){
       quick=false; 
    }
    var subseed = tritAdd(seed.slice(),Converter.fromValue(index));
    sha3.update(Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(subseed)).toString(),'hex'));
    if(quick===true){
        tmp = sha3.digest();
        // lets call modified words_to_trits - will return true if buffer is not going to change
        subseed = WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(tmp, "binary").toString('base64')).words,true);
        if(subseed===true){
            // buffer will not be modified - we can keep it
            subseed = tmp;
        } else {
            subseed = Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Array.from(subseed))).toString(),'hex');
        }        
    } else {
        subseed=Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Array.from(WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(sha3.digest(), "binary").toString('base64')).words)))).toString(),'hex'); 
    }
    sha3 = new SHA3('keccak384');
    sha3.update(subseed);   
    var key=[];
    while (length-- > 0) {
        for (var i = 0; i < 27; i++) {
            var final_words=CryptoJS.enc.Base64.parse(Buffer.from(sha3.digest(), "binary").toString('base64')).words;
            // Convert words to trits and then map it into the internal state
            var trit_state = WConverter.words_to_trits(final_words);
            var j=0;
            while (j < 243) {
                key.push(trit_state[j++]);
            }
            if(i!==26||length>0){
                for (j = 0; j < final_words.length; j++) {
                    final_words[j] = final_words[j] ^ 0xFFFFFFFF;
                }
                sha3 = new SHA3('keccak384');
                sha3.update(Buffer.from(CryptoJS.lib.WordArray.create(final_words).toString(),'hex'));
            }
        }
    }
    return key;
}

var addChecksumKeccak = function(inputValue, checksumLength,) {
    // checksum length is either user defined, or 9 trytes
    var checksumLength = checksumLength || 9;
    var isSingleInput = inputValidator.isString(inputValue);
    // If only single address, turn it into an array
    if (isSingleInput) inputValue = new Array( inputValue );
    var inputsWithChecksum = [];
    inputValue.forEach(function(thisValue) {
        // check if correct trytes
        if (!inputValidator.isTrytes(thisValue, 81)) {
            return ({success:false,errormsg:"Invalid input"});
        }
        let sha3 = new SHA3('keccak384');
        sha3.update(Buffer.from(CryptoJS.lib.WordArray.create(WConverter.trits_to_words(Converter.trits(thisValue))).toString(),'hex'));
        inputsWithChecksum.push( thisValue + Converter.trytes((Array.from(WConverter.words_to_trits(CryptoJS.enc.Base64.parse(Buffer.from(sha3.digest(), "binary").toString('base64')).words)))).substring( 81 - checksumLength, 81 ));
    });
    return (isSingleInput?inputsWithChecksum[0]:inputsWithChecksum);
}


function chunkArray(array,size){
    var temparray=[];
    for (var i=0, max=array.length; i<max; i+=size) {
        temparray.push(array.slice(i,i+size));
    }
    return temparray;
}

function getAverage(val){
    if(val.length===0){
        return 0;
    }
    var sum=0;
    for (var i=val.length; i--;) {
      sum+=val[i];
    }
    return Math.round(sum/val.length);
}

function transactionTrytes(transaction) {
    var valueTrits = Converter.trits(transaction.value);
    while (valueTrits.length < 81) {
        valueTrits[valueTrits.length] = 0;
    }
    var timestampTrits = Converter.trits(transaction.timestamp);
    while (timestampTrits.length < 27) {
        timestampTrits[timestampTrits.length] = 0;
    }
    var currentIndexTrits = Converter.trits(transaction.currentIndex);
    while (currentIndexTrits.length < 27) {
        currentIndexTrits[currentIndexTrits.length] = 0;
    }
    var lastIndexTrits = Converter.trits(transaction.lastIndex);
    while (lastIndexTrits.length < 27) {
        lastIndexTrits[lastIndexTrits.length] = 0;
    }
    var attachmentTimestampTrits = Converter.trits(transaction.attachmentTimestamp || 0);
    while (attachmentTimestampTrits.length < 27) {
        attachmentTimestampTrits[attachmentTimestampTrits.length] = 0;
    }
    var attachmentTimestampLowerBoundTrits = Converter.trits(transaction.attachmentTimestampLowerBound || 0);
    while (attachmentTimestampLowerBoundTrits.length < 27) {
        attachmentTimestampLowerBoundTrits[attachmentTimestampLowerBoundTrits.length] = 0;
    }
    var attachmentTimestampUpperBoundTrits = Converter.trits(transaction.attachmentTimestampUpperBound || 0);
    while (attachmentTimestampUpperBoundTrits.length < 27) {
        attachmentTimestampUpperBoundTrits[attachmentTimestampUpperBoundTrits.length] = 0;
    }
    transaction.tag = transaction.tag || transaction.obsoleteTag;
    return transaction.signatureMessageFragment
    + transaction.address
    + Converter.trytes(valueTrits)
    + transaction.obsoleteTag
    + Converter.trytes(timestampTrits)
    + Converter.trytes(currentIndexTrits)
    + Converter.trytes(lastIndexTrits)
    + transaction.bundle
    + transaction.trunkTransaction
    + transaction.branchTransaction
    + transaction.tag
    + Converter.trytes(attachmentTimestampTrits)
    + Converter.trytes(attachmentTimestampLowerBoundTrits)
    + Converter.trytes(attachmentTimestampUpperBoundTrits)
    + transaction.nonce;
}

function normalizedBundleFromTrits(bundleHashTrits,seclevel) {
    var normalizedBundle = [];
    for (var i = 0; i < seclevel; i++) {
        var sum = 0;
        for (var j = 0; j < 27; j++) {
            sum += (normalizedBundle[i * 27 + j] = Converter.value(bundleHashTrits.slice(i * 81  + j * 3 , i * 81  + j * 3 + 3)));
        }    
        if (sum >= 0) {
            while (sum-- > 0) {
                for (var j = 0; j < 27; j++) {
                    if (normalizedBundle[i * 27 + j] > -13) {
                        normalizedBundle[i * 27 + j]--;
                        break;
                    }
                }
            }
        } else {
            while (sum++ < 0) {
                for (var j = 0; j < 27; j++) {
                    if (normalizedBundle[i * 27 + j] < 13) {
                        normalizedBundle[i * 27 + j]++;
                        break;
                    }
                }
            }
        }
    }
    return normalizedBundle;
}

module.exports = {
    getAddressFromSeedKeccak:getAddressFromSeedKeccak,
    createBundleKeccak:createBundleKeccak,
    createBundleHashKeccak:createBundleHashKeccak,
    getAddressKeccak:getAddressKeccak,
    singleSignatureFragmentKeccak:singleSignatureFragmentKeccak,
    getKeyKeccak:getKeyKeccak
}
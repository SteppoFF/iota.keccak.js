var ascii = require("./asciiToTrytes");

/**
*   checks if input is correct address
*
*   @method isAddress
*   @param {string} address
*   @returns {boolean}
**/
var isAddress = function(address) {
    // TODO: In the future check checksum
    if (!isString(address)) {
        return false;
    }
    // Check if address with checksum
    if(address.length!=90 && address.length!=81){
        return false;
    } else if (address.length==90) {
        if(!isTrytes(address, 90)) return false;
    } else if (!isTrytes(address, 81)) {
        return false;
    }
    return true;
}

/**
*   checks if input is correct trytes consisting of A-Z9
*   optionally validate length
*
*   @method isTrytes
*   @param {string} trytes
*   @param {integer} length optional
*   @returns {boolean}
**/
var isTrytes = function(trytes, length) {
    // If no length specified, just validate the trytes
    var regexTrytes = new RegExp("^[9A-Z]{" + (!length?"0,":length) +"}$");
    return isString(trytes) && regexTrytes.test(trytes);
}

/**
*   checks if input is correct trytes consisting of A-Z9
*   optionally validate length
*
*   @method isNinesTrytes
*   @param {string} trytes
*   @returns {boolean}
**/
var isNinesTrytes = function(trytes) {
    return isString(trytes) && /^[9]+$/.test(trytes);
}

/**
 *  convert the input string to trytes, then convert the resulting trytes to a string,
 *  and check if the string matches the original input
 *
 * @method isSafeString
 * @param  {string} input string to be checked
 * @return {boolean}
 */
var isSafeString = function(input) {
    return /^[\x00-\x7F]*$/.test(input) && ascii.fromTrytes(ascii.toTrytes(input)) === input;
}

/**
*   checks if integer value
*
*   @method isValue
*   @param {string} value
*   @returns {boolean}
**/
var isValue = function(value) {
    // check if correct number
    return Number.isInteger(value)
}

/**
*   checks whether input is a value or not. Can be a string, float or integer
*
*   @method isNum
*   @param {int}
*   @returns {boolean}
**/
var isNum = function(input) {
    return /^(\d+\.?\d{0,15}|\.\d{0,15})$/.test(input);
}

/**
*   checks if input is correct hash
*
*   @method isHash
*   @param {string} hash
*   @returns {boolean}
**/
var isHash = function(hash) {
    // Check if valid, 81 trytes
    if (!isTrytes(hash, 81)) {
        return false;
    }
    return true;
}

/**
*   checks whether input is a string or not
*
*   @method isString
*   @param {string}
*   @returns {boolean}
**/
var isString = function(string) {
    return typeof string === 'string';
}


/**
*   checks whether input is an array or not
*
*   @method isArray
*   @param {object}
*   @returns {boolean}
**/
var isArray = function(array) {
    return array instanceof Array;
}


/**
*   checks whether input is object or not
*
*   @method isObject
*   @param {object}
*   @returns {boolean}
**/
var isObject = function(object) {
    var isArray = Array.isArray(object);
    var isNull = object === null;
    return !isArray && !isNull && typeof object === 'object';
};


/**
*   checks if input is correct hash
*
*   @method isTransfersArray
*   @param {array} hash
*   @returns {boolean}
**/
var isTransfersArray = function(transfersArray) {
    if (!isArray(transfersArray)) return false;
    for (var i = 0; i < transfersArray.length; i++) {
        // Check if valid address
        if (!isAddress(transfersArray[i].address)) {
            return false;
        }
        // Validity check for value
        if (!isValue(transfersArray[i].value)) {
            return false;
        }
        // Check if message is correct trytes of any length
        if (!isTrytes(transfersArray[i].message, "0,")) {
            return false;
        }
        // Check if tag is correct trytes of {0,27} trytes
        if (!isTrytes(transfersArray[i].tag, "0,27")) {
            return false;
        }
        if (!isTrytes(transfersArray[i].obsoleteTag, "0,27")) {
            return false;
        }

    }
    return true;
}

/**
*   checks if input is list of correct trytes
*
*   @method isArrayOfHashes
*   @param {list} hashesArray
*   @returns {boolean}
**/
var isArrayOfHashes = function(hashesArray) {
    if (!isArray(hashesArray)) return false;
    for (var i = 0; i < hashesArray.length; i++) {
        if(!isAddress(hashesArray[i])) return false;
    }
    return true;
}

/**
*   checks if input is list of correct trytes
*
*   @method isArrayOfTrytes
*   @param {list} trytesArray
*   @returns {boolean}
**/
var isArrayOfTrytes = function(trytesArray) {
    if (!isArray(trytesArray)) return false;
    for (var i = 0, max = trytesArray.length; i < max; i++) {
        // Check if correct 2673 trytes
        if (!isTrytes(trytesArray[i], 2673)) {
            return false;
        }
    }
    return true;
}

/**
*   checks if attached trytes if last 241 trytes are non-zero
*
*   @method isArrayOfAttachedTrytes
*   @param {array} trytesArray
*   @returns {boolean}
**/
var isArrayOfAttachedTrytes = function(trytesArray) {
    if (!isArray(trytesArray)) return false;
    for (var i = 0, max = trytesArray.length; i < max; i++) {
        // Check if correct 2673 trytes
        if (!isTrytes(trytesArray[i], 2673)) {
            return false;
        }
        if (/^[9]+$/.test(trytesArray[i].slice(2673 - (3 * 81)))) {
            return false;
        }
    }
    return true;
}

/**
*   checks if correct bundle with transaction object
*
*   @method isArrayOfTxObjects
*   @param {array} bundle
*   @returns {boolean}
**/
var isArrayOfTxObjects = function(bundle) {
    if (!isArray(bundle) || bundle.length === 0) return false;
    var keysToValidate = [
            {
                key: 'hash',
                validator: isHash,
                args: null
            }, {
                key: 'signatureMessageFragment',
                validator: isTrytes,
                args: 2187
            }, {
                key: 'address',
                validator: isHash,
                args: null
            }, {
                key: 'value',
                validator: isValue,
                args: null
            }, {
                key: 'obsoleteTag',
                validator: isTrytes,
                args: 27
            }, {
                key: 'timestamp',
                validator: isValue,
                args: null
            }, {
                key: 'currentIndex',
                validator: isValue,
                args: null
            },{
                key: 'lastIndex',
                validator: isValue,
                args: null
            }, {
                key: 'bundle',
                validator: isHash,
                args: null
            }, {
                key: 'trunkTransaction',
                validator: isHash,
                args: null
            }, {
                key: 'branchTransaction',
                validator: isHash,
                args: null
            }, {
                key: 'tag',
                validator: isTrytes,
                args: 27
            }, {
                key: 'attachmentTimestamp',
                validator: isValue,
                args: null
            }, {
                key: 'attachmentTimestampLowerBound',
                validator: isValue,
                args: null
            }, {
                key: 'attachmentTimestampUpperBound',
                validator: isValue,
                args: null
            }, {
                key: 'nonce',
                validator: isTrytes,
                args: 27
            }
        ];
    bundle.forEach(function(txObject) {
        for (var i = 0, max = keysToValidate.length; i < max; i++) {
            // If input does not have keyIndex and address, return false
            if (!txObject.hasOwnProperty(keysToValidate[i].key)) {
                return false;
            }
            // If input validator function does not return true, exit
            if (!keysToValidate[i].validator(txObject[keysToValidate[i].key], keysToValidate[i].args)) {
                return false;
            }
        }
    });
    return true;
}

/**
*   checks if correct inputs list
*
*   @method isInputs
*   @param {array} inputs
*   @returns {boolean}
**/
var isInputs = function(inputs) {

    if (!isArray(inputs)) return false;

    for (var i = 0,max=inputs.length; i < max; i++) {

        var input = inputs[i];

        // If input does not have keyIndex and address, return false
        if (!inputs[i].hasOwnProperty('security') || !inputs[i].hasOwnProperty('keyIndex') || !inputs[i].hasOwnProperty('address')) return false;

        if (!isAddress(inputs[i].address)) {
            return false;
        }

        if (!isValue(inputs[i].security)) {
            return false;
        }

        if (!isValue(inputs[i].keyIndex)) {
            return false;
        }
    }
    return true;
}

/**
*   Checks that a given uri is valid
*
*   Valid Examples:
*   udp://[2001:db8:a0b:12f0::1]:14265
*   udp://[2001:db8:a0b:12f0::1]
*   udp://8.8.8.8:14265
*   udp://domain.com
*   udp://domain2.com:14265
*
*   @method isUri
*   @param {string} node
*   @returns {bool} valid
**/
var isUri = function(node) {

    var getInside = /^(udp|tcp):\/\/([\[][^\]\.]*[\]]|[^\[\]:]*)[:]{0,1}([0-9]{1,}$|$)/i;

    var stripBrackets = /[\[]{0,1}([^\[\]]*)[\]]{0,1}/;

    var uriTest = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))|(^\s*((?=.{1,255}$)(?=.*[A-Za-z].*)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*)\s*$)/;

    if(!getInside.test(node)) {
        return false;
    }

    return uriTest.test(stripBrackets.exec(getInside.exec(node)[1])[1]);
}

var isTritArray = function (trits, length) {
  return (trits instanceof Array || trits instanceof Int8Array) &&
    trits.every(function (trit) {
      return [-1, 0, 1].indexOf(trit) > -1
    }) &&
    (typeof length === 'number' ? trits.length === length : true)
}

module.exports = {
    isAddress: isAddress,
    isTrytes: isTrytes,
    isNinesTrytes: isNinesTrytes,
    isSafeString: isSafeString,
    isValue: isValue,
    isHash: isHash,
    isTransfersArray: isTransfersArray,
    isArrayOfHashes: isArrayOfHashes,
    isArrayOfTrytes: isArrayOfTrytes,
    isArrayOfAttachedTrytes: isArrayOfAttachedTrytes,
    isArrayOfTxObjects: isArrayOfTxObjects,
    isInputs: isInputs,
    isString: isString,
    isNum: isNum,
    isArray: isArray,
    isObject: isObject,
    isUri: isUri,
    isTritArray: isTritArray
}
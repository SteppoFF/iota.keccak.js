/*
 * Calculates the migration address of if an Ed25519 address
 * See https://hackmd.io/@iota-protocol/rkO-r1qAv for reference
 */ 
const iotakeccak = require('../iota.keccak.js');

const address="6f9e8510b88b0ea4fbc684df90ba310540370a0403067b22cef4971fec3e8bb8";

console.log("Calculated address: "+iotakeccak.convertTransferAddress(address,{addChecksum:true}));
console.log("Should match      : TRANSFERCDJWLVPAIXRWNAPXV9WYKVUZWWKXVBE9JBABJ9D9C9F9OEGADYO9CWDAGZHBRWIXLXG9MAJV9RJEOLXSJW");
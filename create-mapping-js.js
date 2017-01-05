/**
 * Module dependencies.
 */
const request = require('request');
const readline = require('readline');
const fs = require('fs');

const CSV = 'mapping-response.txt';

var lineReader = require('readline').createInterface({
 input: fs.createReadStream(CSV)
});

var mappingArray = {};

lineReader.on('close', function (line) {
  fs.appendFile('mapping-isin-ticker.js', JSON.stringify(mappingArray), function (err) {});
});

lineReader.on('line', function (line) {

  var mapping = line.split('===');

  mappingArray[mapping[0]] =  mapping[1];

});

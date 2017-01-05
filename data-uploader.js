/**
 * Module dependencies.
 */
const request = require('request');
const readline = require('readline');
const fs = require('fs');

const CSV = '../rbc_sectran.csv';

var i = 0;
const INDEX_TYPE_CODE = 18;
const INDEX_ISIN = 6;

var pooledRequest = request.defaults({pool: {maxSockets: 100}});

var lineReader = require('readline').createInterface({
 input: fs.createReadStream(CSV)
});

const ISIN_KEYS = {};
const ISIN_ARRAY = [];

lineReader.on('close', function (line) {
  console.log('done', ISIN_ARRAY.length);

  var z = [];
  for(var j=0; j<ISIN_ARRAY.length; j++) {

      if(j % 100 == 0) {
        if(z.length) {
          fs.appendFile('mapping-query.txt', JSON.stringify(z) + '\n', function (err) {});
        }
        z = [];

      } else {
        z.push(ISIN_ARRAY[j]);
      }

  }

});

lineReader.on('line', function (line) {

  var values = line.split('|');
  var typeCode = values[INDEX_TYPE_CODE];
  var isin = values[INDEX_ISIN];

  if(typeCode !== 'EQ' || !isin) {
    return;
  }

  if(!ISIN_KEYS[isin]) {
    ISIN_KEYS[isin] = true;
    ISIN_ARRAY.push({ "idType":"ID_ISIN","idValue": isin });
  }


  return;

  var jsonLine = { "csvLine": line };

  //pooledRequest.post('https://eagles-app.mybluemix.net/api/transactions',
  pooledRequest.post('http://localhost:3000/api/transactions',
  { json: jsonLine },
      function (error, response, body) {

          if (!error) {
              if(response.statusCode == 200) { console.log('uploaded: ', ++i); }
              if(response.statusCode == 204) { console.log('skipped'); }
          } else {
            console.log('error: ', error);
            console.log('response: ', response);
            console.log('body: ', body);
          }
      }
  );


});

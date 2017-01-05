/**
 * Module dependencies.
 */
const request = require('request');
const readline = require('readline');
const fs = require('fs');

const CSV = '../rbc_sectran.csv';

var i = 0;

var pooledRequest = request.defaults({pool: {maxSockets: 5}});

var lineReader = require('readline').createInterface({
 crlfDelay: 1000,
 input: fs.createReadStream(CSV)
});

lineReader.on('line', function (line) {

  var jsonLine = { "csvLine": line };

//  pooledRequest.post('https://eagles-app.mybluemix.net/api/transactions',
  pooledRequest.post('http://localhost:3000/api/transactions',
  { json: jsonLine },
      function (error, response, body) {

          if (!error && response.statusCode == 200) {
              console.log('uploaded ', ++i);
          } else {
            console.log('error: ', error);
            console.log('response: ', response);
            console.log('body: ', body);
          }
      }
  );


});

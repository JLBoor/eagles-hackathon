/**
 * Module dependencies.
 */
const request = require('request');
const readline = require('readline');
const fs = require('fs');

const CSV = 'mapping-query.txt';

var pooledRequest = request.defaults({pool: {maxSockets: 100}});

var lineReader = require('readline').createInterface({
 input: fs.createReadStream(CSV)
});
var i = 0;
lineReader.on('line', function (line) {

  var jsonLine = JSON.parse(line);



  pooledRequest.post(
    'https://api.openfigi.com/v1/mapping',
    { json: jsonLine, headers: { 'X-OPENFIGI-APIKEY': '8083cda3-d0a6-4ecb-97d6-cf14efb4a6fc' } },
      function (error, response, body) {

          if (!error) {
            for(var j = 0; j < body.length; j++) {
              if(body[j] && body[j].data && body[j].data.length) {
                fs.appendFile('mapping-response.txt', jsonLine[j].idValue + '===' + body[j].data[0].ticker + '\n', function (err) {});

              }
            }

          } else {
            console.log('error: ', error);
          }
      }
  );


});


var exports = {};


var nodemailer = require('nodemailer');
var sesTransport = require('nodemailer-ses-transport');
var transport = nodemailer.createTransport(sesTransport({
    accessKeyId: "**",
    secretAccessKey: "**",
    rateLimit: 1 // do not send more than 5 messages in a second
}));


exports.nodemailer = nodemailer;
exports.sesTransport = sesTransport;
exports.transport = transport;


// send to list
var to = ['*']
// this must relate to a verified SES account
var from = '*'

exports.sendEmailReport = function (context, title){
        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: from, // sender address
            to: to, // list of receivers
            subject: title, // Subject line
            text: context // plaintext body
        };
            // send mail with defined transport object
        transport.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        });
    };


module.exports = exports;
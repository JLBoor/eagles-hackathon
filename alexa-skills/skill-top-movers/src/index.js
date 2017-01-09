/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 *
 * - Web service: communicate with an external web service to get Transaction data
 * - Pagination: after obtaining a list of transactions, read a small subset of transactions and wait for user prompt to read the next subset of events by maintaining session state
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 * - SSML: Using SSML tags to control how Alexa renders the text-to-speech.
 *
 * Examples:
 * One-shot model:
 * User:  "Alexa, ask Eagle Statistics what happened on August thirtieth."
 * Alexa: "For August thirtieth, in 2003, [...] . Do you want to hear more?"
 * User: "No."
 * Alexa: "Good bye!"
 *
 * Dialog model:
 * User:  "Alexa, open Eagle Statistics"
 * Alexa: "Eagle Statistics. What day do you want transcations for?"
 * User:  "August thirtieth."
 * Alexa: "For August thirtieth, in 2003, [...] . Wanna go deeper in history?"
 * User:  "Yes."
 * Alexa: "In 1995, ABC [...] . Do you want to hear more?"
 * User: "No."
 * Alexa: "Good bye!"
 */


/**
 * App ID for the skill
 */
var APP_ID = 'amzn1.ask.skill.54e7b3de-2a39-4d98-95c6-66490182ed74'; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var request = require('request');


/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var dateFormat = require('dateformat');

var currencyFormatter = require('currency-formatter');

/**
 * URL prefix to download transactions content from Eagles Dashboard
 */

var transUrlPrefix = 'https://eagles-app.mybluemix.net/api/transactions?date=';
var _CLIENT = 'Aleta Girardin FUND'; //'Shawnee Blocker LTD';
var transPosUrlPrefix = 'https://eagles-app.mybluemix.net/api/transactions/positions?client='+_CLIENT+'&least=';
var transPerfUrlPrefix = 'https://eagles-app.mybluemix.net/api/transactions/performers?client='+_CLIENT;

var numberNames = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];


/**
 * Variable defining number of events to be read at one time
 */
var paginationSize = 5;

/**
 * Variable defining the length of the delimiter between events
 */
var delimiterSize = 2;

/**
 * TopMoversSkill is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var TopMoversSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
TopMoversSkill.prototype = Object.create(AlexaSkill.prototype);
TopMoversSkill.prototype.constructor = TopMoversSkill;

TopMoversSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("TopMoversSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

TopMoversSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("TopMoversSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

TopMoversSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

TopMoversSkill.prototype.intentHandlers = {

    "GetFirstEventIntent": function (intent, session, response) {
        handleFirstEventRequest(intent, session, response);
    },

    "GetNextEventIntent": function (intent, session, response) {
        handleNextEventRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "With Eagle Statistics, you can get historical events for any day of the year.  " +
            "For example, you could say today, or August thirtieth, or you can say exit. Now, which day do you want?";
        var repromptText = "Which day do you want?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    }
};

/**
 * Function to handle the onLaunch skill behavior
 */

function getWelcomeResponse(response) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var cardTitle = "Eagle Statistics";
    var repromptText = "With Eagle Statistics, you can get statistics from your portfolio. For example, you could say Top Gainers, or Top Investors. Now, which stat do you want?";
    var speechText = "<p>Eagle Statistics.</p> <p>What statistics do you want to hear?  Top Gainers, Top Losers or Top Investors</p>";
    var cardOutput = "Eagle Statistics. What statistics do you want to hear?  Top Gainers, Top Losers or Top Investors?";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.

    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleFirstEventRequest(intent, session, response) {
    var daySlot = intent.slots.day;
    var metric = (intent.slots.metric && intent.slots.metric.value)?intent.slots.metric.value:'Gainers';
    var repromptText = "With Eagle Statistics, you can get statistics from your portfolio. For example, you could say Top Gainers, or Top Investors. Now, which stat do you want?";
    var monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
    ];
    var sessionAttributes = {};
    // Read the first 5 events, then set the count to 5
    sessionAttributes.index = paginationSize;
    var date = "";

    // If the user provides a date, then use that, otherwise use today
    // The date is in server time, not in the user's time zone. So "today" for the user may actually be tomorrow
    if (daySlot && daySlot.value) {
        date = new Date(daySlot.value);
    } else {
        date = new Date();
    }

    var prefixContent = "<p>The top " + metric + " on " + monthNames[date.getMonth()] + " " + date.getDate() + ", </p>";
    var cardContent = "The top " + metric + " on " + monthNames[date.getMonth()] + " " + date.getDate() + ", ";

    var cardTitle = "Statistics on " + monthNames[date.getMonth()] + " " + date.getDate();

    if(metric.toUpperCase() === 'PERFORMERS'||metric.toUpperCase() === 'INVESTORS'){
        getTopPerformers(date, function (results) {
            var speechText = "", i;
            if(results.length == 0){
                speechText = "There is a problem connecting to the Eagles Dashboard at this time. Please try again later.";
                cardContent = speechText;
                response.tell(speechText);
            }else{
                //console.log('results: '+results);
                for (i = 0; i < 3; i++) {
                    cardContent = cardContent + results.top_performers[i].i_mgr + " ";
                    var intro = (i === 0)? 'Your Top Investor, coming in '+numberNames[i] + ', ': 'Coming in '+numberNames[i] + ', ';
                    var amt = currencyFormatter.format(results.top_performers[i].pos_amt, { code: 'USD' });
                    var mgr = results.top_performers[i].i_mgr;
                    speechText = speechText + "<p>" + intro + mgr + ", total net revenue: "+ amt +"</p> ";
                }

                var speechOutput = {
                    speech: "<speak>" + prefixContent + speechText + "</speak>",
                    type: AlexaSkill.speechOutputType.SSML
                };
                
                response.tellWithCard(speechOutput, cardTitle, cardContent); 
            }
        });
    }else{
        getTransactions(date, metric, function (results) {
            var speechText = "", i;
            var losers = (metric.toUpperCase() === 'LOSERS');
            if(results.length == 0){
                speechText = "There is a problem connecting to the Eagles Dashboard at this time. Please try again later.";
                cardContent = speechText;
                response.tell(speechText);
            }else{
                var getSpeechText = (text, ticker, a, lFlag) => {
                        var totalText = (lFlag)?'loss':'net revenue';
                        return text + "<p>" + ticker + ", total "+totalText+": "+ a +"</p> ";
                    };
                for (i = 0; i < paginationSize; i++) {
                    var s = results.stocks[i];
                    var amt = currencyFormatter.format(s.pos_amt, { code: 'USD' });
                    cardContent = cardContent + s.ticker + " ";
                    speechText = getSpeechText(speechText, s.ticker, amt, losers);
                    // if(losers){
                    //     speechText = speechText + "<p>" + s.ticker + ", total net revenue: "+ amt +"</p> ";    
                    // }else{
                    //     speechText = speechText + "<p>" + s.ticker + ", total net revenue: "+ amt +"</p> ";
                    // }
                }

                //speechText = speechText + "<p>Do you want to get the next " + paginationSize + " results?</p>";

                var speechOutput = {
                    speech: "<speak>" + prefixContent + speechText + "</speak>",
                    type: AlexaSkill.speechOutputType.SSML
                };
                
                //response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent); 
                response.tellWithCard(speechOutput, cardTitle, cardContent); 
            }
        });
    }
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleNextEventRequest(intent, session, response) {
    var cardTitle = "More stats",
        sessionAttributes = session.attributes,
        result = sessionAttributes.text,
        speechText = "",
        cardContent = "",
        repromptText = "Do you want to hear more statistics?",
        i;
    if (!result) {
        speechText = "With Eagle Statistics, you can get statistics from your portfolio. For example, you could say Top Gainers, or Top Investors. Now, which stat do you want?";
        cardContent = speechText;
    } else if (sessionAttributes.index >= result.length) {
        speechText = "Nothing more to tell you.";
        cardContent = "Nothing more to tell you.";
    } else {
        for (i = 0; i < paginationSize; i++) {
            if (sessionAttributes.index>= result.length) {
                break;
            }
            speechText = speechText + "<p>" + result[sessionAttributes.index].Security_Short_Name + "</p> ";
            cardContent = cardContent + result[sessionAttributes.index].Security_Short_Name + " ";
            sessionAttributes.index++;
        }
        if (sessionAttributes.index < result.length) {
            speechText = speechText + " Do you want to hear more?";
            cardContent = cardContent + " Do you want to hear more?";
        }
    }
    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
}

function getTransactions(date, metric, eventCallback) {
    var day =dateFormat(date, "yyyymmdd");

    var losers = (metric.toUpperCase() === 'LOSERS');

    //var url = transUrlPrefix + day;
    var url = transPosUrlPrefix + losers;

    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
//            console.log(JSON.parse(body));
            eventCallback(JSON.parse(body));
        }else{
            console.log("Got error: "+response.statusCode, error);
        }
    });
}

function getTopPerformers(date, eventCallback) {
    var day = dateFormat(date, "yyyymmdd");

    var url = transPerfUrlPrefix + '&date=' + date;

    console.log(url);

    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(JSON.parse(body));
            eventCallback(JSON.parse(body));
        }else{
            console.log("Got error: "+response.statusCode, error);
        }
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the TopMovers Skill.
    var skill = new TopMoversSkill();
    skill.execute(event, context);
};


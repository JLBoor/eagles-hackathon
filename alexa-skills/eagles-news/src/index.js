/**
 Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 *
 * - Web service: communicate with an external web service to get events for specified days in history (Wikipedia API)
 * - Pagination: after obtaining a list of events, read a small subset of events and wait for user prompt to read the next subset of events by maintaining session state
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 * - SSML: Using SSML tags to control how Alexa renders the text-to-speech.
 *
 * Examples:
 * One-shot model:
 * User:  "Alexa, ask History Buff what happened on August thirtieth."
 * Alexa: "For August thirtieth, in 2003, [...] . Wanna go deeper in history?"
 * User: "No."
 * Alexa: "Good bye!"
 *
 * Dialog model:
 * User:  "Alexa, open History Buff"
 * Alexa: "History Buff. What day do you want events for?"
 * User:  "August thirtieth."
 * Alexa: "For August thirtieth, in 2003, [...] . Wanna go deeper in history?"
 * User:  "Yes."
 * Alexa: "In 1995, Bosnian war [...] . Wanna go deeper in history?"
 * User: "No."
 * Alexa: "Good bye!"
 */

/**
 * App ID for the skill
 */
var APP_ID = 'amzn1.ask.skill.c1c6e5a3-26bd-4f1b-a56b-1a8b16dfa576'; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var https = require('https');

var emailer = require("./emailer.js");

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix to download history content from Wikipedia
 */
var urlPrefix = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&explaintext=&exsectionformat=plain&redirects=&titles=';

var newsApiPrefix = 'https://api.cognitive.microsoft.com';


/**
 * Variable defining number of events to be read at one time
 */
var paginationSize = 3;

/**
 * Variable defining the length of the delimiter between events
 */
var delimiterSize = 2;

/**
 * HistoryBuffSkill is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var HistoryBuffSkill = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
HistoryBuffSkill.prototype = Object.create(AlexaSkill.prototype);
HistoryBuffSkill.prototype.constructor = HistoryBuffSkill;

HistoryBuffSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("HistoryBuffSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

HistoryBuffSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("HistoryBuffSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

HistoryBuffSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

HistoryBuffSkill.prototype.intentHandlers = {

    // "GetFirstEventIntent": function (intent, session, response) {
    //     handleFirstEventRequest(intent, session, response);
    // },

    "GetNewsIntent": function (intent, session, response) {
        handleNewsRequest(intent, session, response);
    },

    "GetNextEventIntent": function (intent, session, response) {
        handleNextEventRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "With Eagles News, you can get real time news for any topic.  " +
            "For example, you could say get news for Apple";
        var repromptText = "Which topic do you want hear?";
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
    var cardTitle = "Eagles News";
    var repromptText = "With Eagles News, you can get real time news for any topic.  " +
            "For example, you could say get news for Apple";
    var speechText = "<p>Eagles News.</p> <p>What news topic would you like to hear?</p>";
    var cardOutput = "What news topic would you like to hear?";
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
 * Handle news search
 */
function handleNewsRequest(intent, session, response) {
    var companySlot = intent.slots.company.value;
    var cardContent = "News for company: " + companySlot;
    var cardTitle = "News";
    
    var repromptText = "You can ask me news for a more specific date.";
    var speechText = 'Royal Bank of Canada\'s Top Portfolio Picks for 2017 <break time="1s"/>';
    speechText += 'Business clients on the go can now connect with RBC face-to-face';

    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    getJsonEventsFromBingNews(companySlot, function (events) {
        var speechText = "";
        var sessionAttributes = {};
        sessionAttributes.text = events;
        if (events.length == 0) {
            speechText = "There is a problem connecting to Bing News at this time. Please try again later.";
            cardContent = speechText;
            response.tell(speechText);
        } else {
           for (var i = 0; i < paginationSize; i++) {
                cardContent = cardContent + events[i].name + " ";
                speechText = "<p>" + speechText + events[i].name + "<break time=\"1s\"/></p> ";
                 sessionAttributes.index++;
            }
            speechText = speechText + "<p>Wanna hear more news?</p>";
            var speechOutput = {
                speech: "<speak>" + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };
            var repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
        }
        session.attributes = sessionAttributes;
         
    });
}
/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleNextEventRequest(intent, session, response) {
    var cardTitle = "More events on this day in history",
        sessionAttributes = session.attributes,
        result = sessionAttributes.text,
        speechText = "",
        cardContent = "",
        repromptText = "Do you want to hear more about the news",
        i;
    if (!result) {
        speechText = "With Eagles News, you can get real time news for any topic.  " +
            "For example, you could say get news for Apple";
        cardContent = speechText;
    } else if (sessionAttributes.index >= result.length) {
        speechText = "There are no more news for this topic. Try another topic.";
        cardContent = "There are no more news. ";
    } else {
        for (i = 0; i < paginationSize; i++) {
            if (sessionAttributes.index >= result.length) {
                break;
            }
            speechText = speechText + "<p>" + result[sessionAttributes.index] + "</p> ";
            cardContent = cardContent + result[sessionAttributes.index] + " ";
            sessionAttributes.index++;
        }
        if (sessionAttributes.index < result.length) {
            speechText = speechText + " Want hear more?";
            cardContent = cardContent + " Want hear more?";
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

function getJsonEventsFromBingNews(query, eventCallback) {
    var request = require('request');
    var options = {
        url: 'https://api.cognitive.microsoft.com/bing/v5.0/news/search?q='+query+'&count=6',
        headers: {
            "Ocp-Apim-Subscription-Key": '0f2c0f145f8c4373a56c263c7e183136'
        }
    };
   function callback(error, response, body) {
       console.log(error);
        if (!error && response.statusCode == 200) {
            var news = JSON.parse(body).value;
            eventCallback(news);
        }
    }
    request.get(options, callback);
}

function getJsonEventsFromWikipedia(day, date, eventCallback) {
    var url = urlPrefix + day + '_' + date;

    https.get(url, function (res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var stringResult = parseJson(body);
            eventCallback(stringResult);
        });
    }).on('error', function (e) {
        console.log("Got error: ", e);
    });
}

function parseJson(inputText) {
    // sizeOf (/nEvents/n) is 10
    var text = inputText.substring(inputText.indexOf("\\nEvents\\n") + 10, inputText.indexOf("\\n\\n\\nBirths")),
        retArr = [],
        retString = "",
        endIndex,
        startIndex = 0;

    if (text.length == 0) {
        return retArr;
    }

    while (true) {
        endIndex = text.indexOf("\\n", startIndex + delimiterSize);
        var eventText = (endIndex == -1 ? text.substring(startIndex) : text.substring(startIndex, endIndex));
        // replace dashes returned in text from Wikipedia's API
        eventText = eventText.replace(/\\u2013\s*/g, '');
        // add comma after year so Alexa pauses before continuing with the sentence
        eventText = eventText.replace(/(^\d+)/, '$1,');
        eventText = 'In ' + eventText;
        startIndex = endIndex + delimiterSize;
        retArr.push(eventText);
        if (endIndex == -1) {
            break;
        }
    }
    if (retString != "") {
        retArr.push(retString);
    }
    retArr.reverse();
    return retArr;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    var skill = new HistoryBuffSkill();
    skill.execute(event, context);
};


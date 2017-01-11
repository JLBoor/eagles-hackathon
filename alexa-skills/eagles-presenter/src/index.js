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
 * User:  "Alexa, ask Presenter what happened on August thirtieth."
 * Alexa: "For August thirtieth, in 2003, [...] . Do you want to hear more?"
 * User: "No."
 * Alexa: "Good bye!"
 *
 * Dialog model:
 * User:  "Alexa, open Presenter"
 * Alexa: "Presenter. What day do you want transcations for?"
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
var APP_ID = 'amzn1.ask.skill.e8f909a8-fcf4-493d-9ac1-c9f32537157e'; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var request = require('request');


/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var dateFormat = require('dateformat');

/**
 * URL prefix to download transactions content from Eagles Dashboard
 */

var transUrlPrefix = 'https://eagles-app.mybluemix.net/api/transactions?date=';


/**
 * Variable defining number of events to be read at one time
 */
var paginationSize = 5;

/**
 * Variable defining the length of the delimiter between events
 */
var delimiterSize = 2;

/**
 * PresenterSkill is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var PresenterSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
PresenterSkill.prototype = Object.create(AlexaSkill.prototype);
PresenterSkill.prototype.constructor = PresenterSkill;

PresenterSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("PresenterSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

PresenterSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("PresenterSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

PresenterSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

PresenterSkill.prototype.intentHandlers = {

    "GetChapterIntent": function (intent, session, response) {
        handleChapterRequest(intent, session, response);
    },

    "GetNextEventIntent": function (intent, session, response) {
        handleNextEventRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "With Presenter, you can get information about the Eagles Dashboard.  " +
            "For example, you could say today, or Introduction, or you can say exit. Now, what do you want to hear?";
        var repromptText = "What do you want to hear?";
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
    var cardTitle = "Presenters";
    var repromptText = "With Presenter, you can get information about the Eagles Dashboard. Now, which chapter do you want?";
    var speechText = "<p>Presenter.</p> <p>Which chapter to you want?</p>";
    var cardOutput = "Presenter. Which chapter to you want?";
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
function handleChapterRequest(intent, session, response) {
    var chapterSlot = intent.slots.chapter;
    var repromptText = "With Presenter, you can get information about the Eagles Dashboard. The options are Intro, Dashboard, or Conclusion";
    
    var sessionAttributes = {};
    // Read the first 5 events, then set the count to 5
    sessionAttributes.index = paginationSize;
    var chapter = "";

    // If the user provides a date, then use that, otherwise use today
    // The date is in server time, not in the user's time zone. So "today" for the user may actually be tomorrow
    if (chapterSlot && chapterSlot.value) {
        chapter = chapterSlot.value;
    } else {
        chapter = 'INTRO';
    }

    var speakText = "";
    if(chapter.toUpperCase() === 'INTRODUCTION'){
        speakText = "<p>Good Morning, I would like to introduce you to Team Eagle, and it’s six distinguished members: Mina,<break time='1s'/> Bohao,<break time='1s'/> <phoneme alphabet='ipa' ph='ʒɑ̃n'>Jean</phoneme>,<break time='1s'/> Marius,<break time='1s'/> Steve,<break time='1s'/> Ryan<break time='1s'/>.</p>" +
                    "<p>Team Eagle’s idea for the Hackathon initiative is to find a viable option to consolidate, and, present important C-Suite metrics in a simplified "+
                    "dashboard from your laptop or mobile phone.<break time='1s'/></p>"+
                    "<p>This information will be available to users who prefer to communicate with smart voice assistants, such as the Amazon Echo.<break time='1s'/></p>"+
                    "<p>The aim of this project was to focus on best performing equities, highlight the best investment managers in our client’s organization, and provide insight, and "+
                    "analysis of a client’s stock portfolio that reach actionable conclusions.<break time='1s'/></p>"+
                    "<p>This dashboard utilizes external sources to compile important stock information that is critical to a company’s bottom line. <break time='1s'/>We hope you enjoy our demo.</p>";

    } else if(chapter.toUpperCase() === 'INTRO'){
        speakText = "<p>Good Morning, I would like to introduce you to Team Eagle, and it’s six distinguished members: Mina,<break time='1s'/> Bohao,<break time='1s'/> <phoneme alphabet='ipa' ph='ʒɑ̃n'>Jean</phoneme>,<break time='1s'/> Marius,<break time='1s'/> Steve,<break time='1s'/> Ryan<break time='1s'/>.</p>";
    } else if(chapter.toUpperCase() === 'DASHBOARD'){
        speakText = "<p>Team Eagle’s idea for the Hackathon initiative is to find a viable option to consolidate, and, present important C-Suite metrics in a simplified "+
                    "dashboard from your laptop or mobile phone.<break time='1s'/></p>"+
                    "<p>This information will be available to users who prefer to communicate with smart voice assistants, such as the Amazon Echo.<break time='1s'/></p>"+
                    "<p>The aim of this project was to focus on best performing equities, highlight the best investment managers in our client’s organization, and provide insight, and "+
                    "analysis of a client’s stock portfolio that reach actionable conclusions.<break time='1s'/></p>"+
                    "<p>This dashboard utilizes external sources to compile important stock information that is critical to a company’s bottom line.</p>"; 
    } else if(chapter.toUpperCase() === 'CONCLUSION'){
        speakText = "<p>On behalf of Team Eagle, we thank you for taking the time to listen to our presentation.  If you have any questions, any of my team members would be happy to anwser them.  Thank you.</p>"
    }

    var cardTitle = "Chapter on " + chapter;          
    var cardContent = speakText.replace('<p>', '  ').replace('</p>', '  ').replace("<break time='1s'/>", '').replace("<phoneme alphabet='ipa' ph='ʒɑ̃n'>",'').replace('</phoneme>','');

    var speechOutput = {
        speech: "<speak>" + speakText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    // var repromptOutput = {
    //     speech: repromptText,
    //     type: AlexaSkill.speechOutputType.PLAIN_TEXT
    // };
    // response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
    response.tellWithCard(speechOutput, cardTitle, cardContent); 
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleNextEventRequest(intent, session, response) {
    var cardTitle = "More info",
        sessionAttributes = session.attributes,
        result = sessionAttributes.text,
        speechText = "",
        cardContent = "",
        repromptText = "Do you want to hear more?",
        i;
    if (!result) {
        speechText = "With Presenter, you can get information about the Eagles Dashboard. Now, which chapter do you want?";
        cardContent = speechText;
    } else if (sessionAttributes.index >= result.length) {
        speechText = "Nothing to tell you";
        cardContent = speechText;
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

function getTransactions(date, eventCallback) {
    var day =dateFormat(date, "yyyymmdd");
    var url = transUrlPrefix + day;

    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            eventCallback(JSON.parse(body));
        }else{
            console.log("Got error: "+response.statusCode, error);
        }
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the Presenter Skill.
    var skill = new PresenterSkill();
    skill.execute(event, context);
};


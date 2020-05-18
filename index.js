//The skill isn't using APL, just simple cadrs
'use strict';
'use strict';
const Alexa = require('ask-sdk-core');

const URL = "http://www.salute.gov.it/portale/nuovocoronavirus/dettaglioContenutiNuovoCoronavirus.jsp?lingua=italiano&id=5351&area=nuovoCoronavirus&menu=vuoto";
const axios = require("axios");
const cheerio = require("cheerio");

const SKILL_NAME = 'Situazione Covid-19 in Italia';
const WELCOME_MESSAGE = "Benvenuto, ";
const HELP_MESSAGE = 'grazie a questa skill puoi conoscere in tempo reale la situazione del nuovo coronavirus in Italia. Vuoi sentire la situazione generale, o più nello specifico i casi di persone contagiate, decedute o guarite?';
const HELP_MESSAGE_EXTENDED = 'Prova a chiedermi qual è lo stato del virus in italia, o quante sono le persone guarite.';
const HELP_REPROMPT = ['Non ho capito, potresti ripetere?','Non sto capendo, prova a richiedermelo.', 'Non ho capito bene, me lo ripeteresti?'];
const STOP_MESSAGE = 'Ricordati di rispettare le regole di quarantena e di sicurezza imposte in questo periodo. Solo cosi possiamo sconfiggere il virus. Alla prossima';
const CONTINUE_REPROMPT = 'Vuoi riascoltare questi dati?';

const smallImageUrl = 'YOUR IMAGE LINK';
const largeImageUrl = 'YOUR IMAGE LINK';
async function getData(){
    return new Promise(function (resolve) {
        var dati = {
            positiviTotali: null,
            decedutiTotali: null,
            guaritiTotali: null,
            casiTotali: null,
            positiviNuovi: null,
            guaritiNuovi: null,
            decedutiNuovi: null,
            positiviNuoviDifferenza: null, //Rispetto al giorno prima
            tamponiEffettuati: null,
            tamponiNuovi : null,
        };
        axios(URL)
            .then((response) => {
              const html = response.data;
              const $ = cheerio.load(html);
              //Recupero ogni dato
              var positiviTotali = $("#intestazioneContenuto > div.col-md-8 > div:nth-child(7) > div:nth-child(2)").text();
              var decedutiTotali = $("#intestazioneContenuto > div.col-md-8 > div:nth-child(8) > div:nth-child(2)").text();
              var guaritiTotali = $("#intestazioneContenuto > div.col-md-8 > div:nth-child(9) > div:nth-child(2)").text();
              var casiTotali = parseInt(positiviTotali) + parseInt(decedutiTotali) + parseInt(guaritiTotali);
              var nuoviDatiPositivi = $("#intestazioneContenuto > div.col-md-8 > ul:nth-child(15) > li:nth-child(1)").text();
              var nuoviDatiDeceduti = $("#intestazioneContenuto > div.col-md-8 > ul:nth-child(15) > li:nth-child(2)").text();
              var nuoviDatiGuariti = $("#intestazioneContenuto > div.col-md-8 > ul:nth-child(15) > li:nth-child(3)").text();
              var guaritiNuovi = nuoviDatiGuariti.split(" ")[1];
              var decedutiNuovi = nuoviDatiDeceduti.split(" ")[1];
              var positiviNuovi = nuoviDatiPositivi.split(" ")[1];
              
              //non mettono sempre la differenza
              
              //var positiviNuoviDifferenza = nuoviDatiPositivi.split(" ")[4].substring(1);
              var tamponiEffettuati = $(
                "#intestazioneContenuto > div.col-md-8 > p:nth-child(18)"
              ).text();
              tamponiEffettuati = tamponiEffettuati.split(" ")[1];
              var tamponiNuovi = tamponiEffettuati.split(" ")[3] + " " + tamponiEffettuati.split(" ")[4];
              //Aggiungo tutti i dati alla variabile data
              dati.positiviTotali = positiviTotali;
              dati.decedutiTotali = decedutiTotali;
              dati.guaritiTotali = guaritiTotali;
              dati.casiTotali = casiTotali;
              dati.decedutiNuovi = decedutiNuovi;
              dati.guaritiNuovi = guaritiNuovi;
              dati.positiviNuovi = positiviNuovi;
              //dati.positiviNuoviDifferenza = positiviNuoviDifferenza;
              dati.tamponiEffettuati = tamponiEffettuati;
              dati.tamponiNuovi = tamponiNuovi;
              console.log("ho recuperato i dati attuali ")
              return resolve(dati);
            })
            .catch(console.error);
        
    });
  }
  
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        var speechOutput, repromptOutput, title, smallImage, largeImage;
        if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
            speechOutput = WELCOME_MESSAGE + HELP_MESSAGE;
            repromptOutput = HELP_REPROMPT[Math.floor(Math.random() * HELP_REPROMPT.length)];
            title = SKILL_NAME;
            smallImage = smallImageUrl;
            largeImage = largeImageUrl;
        }else{
            speechOutput = WELCOME_MESSAGE_en + HELP_MESSAGE_en;
            repromptOutput = HELP_MESSAGE_en;
            title = SKILL_NAME_en;
            smallImage = smallImageUrl;
            largeImage = largeImageUrl;
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptOutput)
            ///.withStandardCard(title, speechOutput, smallImageUrl, largeImageUrl)
            //.withSimpleCard(title, speechOutput)
            .getResponse();
    }
};

//Situazione Generale del virus
const SituationIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SituationIntent';
    },
    async handle(handlerInput) {
        //recupero data
        try {
            console.log("Sto aspettando i dati");
            var data = await getData();
            console.log("ho finito di aspettare i dati" + data)
        } catch (error) {
            console.log("Non sono riuscito a recuperare i dati " + error);
        }
        //se ho trovato i dati
        var speechOutput,repromptOutput,title;
        var cardOutput = "";
        
        if(data!=null){
            //build message
            if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
                //se i dati principali mancano, mando errore
                if(data.casiTotali == null || data.positiviTotali == null || data.decedutiTotali == null || data.guaritiTotali ==null){
                    speechOutput= "Non riesco a recuperare i dati di oggi, riprova più tardi.";
                    repromptOutput = CONTINUE_REPROMPT;
                    title = SKILL_NAME;
                }else{
                    speechOutput= "Abbiamo raggiunto quota " + (data.casiTotali).toLocaleString('it') + " casi totali, con " + (data.positiviNuovi).toLocaleString('it') +" nuovi casi scoperti ieri.\n I positivi attualmente sono " + (data.positiviTotali).toLocaleString('it') + " e all'incirca " + (data.decedutiTotali).toLocaleString('it') + " sono deceduti a causa del virus.";
                    cardOutput += data.casiTotali+ " Casi Totali \n"+ data.positiviTotali+ " Positivi \n " + data.decedutiTotali+ " Deceduti \n "+ (data.positiviNuovi != null ? data.positiviNuovi + " Nuovi Positivi \n" : "\n") + (data.tamponiEffettuati != null ? data.tamponiEffettuati + " Tamponi Effettuati \n" : "\n") + "#RESTAACASA";
                    repromptOutput = CONTINUE_REPROMPT;
                    title = SKILL_NAME;
                }
            }else{
                speechOutput = "Ad oggi la situazione é la seguente : \n";
                speechOutput+= "Abbiamo raggiunto " + data.casiTotali + " casi totali, con " + data.positiviNuovi +" nuovi casi scoperti ieri, " + data.positiviNuoviDifferenza +" rispetto al giorno preceente.\n I positivi attualmente sono " + data.positiviTotali + " e circa " + data.decedutiTotali + " sono deceduti a causa del virus.";
                cardOutput += data.casiTotali+ " Casi Totali \n"+ data.positiviTotali+ " Positivi \n " + data.decedutiTotali+ " Deceduti \n "+data.positiviNuovi+ " Nuovi Positivi \n" + data.tamponiEffettuati+ " Tamponi Effettuati \n #RESTAACASA";
                repromptOutput = CONTINUE_REPROMPT_en;
                title = SKILL_NAME_en;
            }
        }else{
            //build message
            if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
                speechOutput = "Non sono riuscito a recuperare i dati in questo momento. Riprova più tardi.";
                repromptOutput = CONTINUE_REPROMPT;
                title = SKILL_NAME;
                
            }else{
                speechOutput = "Non sono riuscito a recuperare i dati in questo momento. Riprova più tardi.";
                repromptOutput = CONTINUE_REPROMPT_en;
                
                title = SKILL_NAME_en;
            }
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            //.reprompt(repromptOutput)
            .withStandardCard(title, cardOutput, largeImageUrl)
            //.withSimpleCard(title, speechOutput)
            .getResponse();
    }
};

//casi positivi del virus
const PositiviIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'positiviIntent';
    },
    async handle(handlerInput) {
        //recupero data
        try {
            console.log("Sto aspettando i dati");
            var data = await getData();
            console.log("ho finito di aspettare i dati" + data)
        } catch (error) {
            console.log("Non sono riuscito a recuperare i dati " + error);
        }
        //se ho trovato i dati
        var speechOutput,repromptOutput,title;
        var cardOutput = "";
        
        //se sono riuscito a recuperare i dati
        if(data!=null){
            //build message
            if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
                speechOutput= "Ad oggi i positivi in Italia sono " + (data.positiviTotali).toLocaleString('it') + ", dei quali solamente " + (data.positiviNuovi).toLocaleString('it') +" sono nuovi casi scoperti ieri.\n";
                cardOutput += data.casiTotali+ " Casi Totali \n"+ data.positiviTotali+ " Positivi \n " + data.decedutiTotali+ " Deceduti \n "+data.positiviNuovi+ " Nuovi Positivi \n" + data.tamponiEffettuati+ " Tamponi Effettuati \n #RESTAACASA";
                repromptOutput = CONTINUE_REPROMPT;
                title = SKILL_NAME;
            }else{
                speechOutput= "Ad oggi i positivi sono " + (data.positiviTotali).toLocaleString('it') + " edi quali solo " + (data.positiviNuovi).toLocaleString('it') +" sono nuovi casi scoperti ieri, circa " + (data.positiviNuoviDifferenza).toLocaleString('it') +" rispetto al giorno precedente.\n";
                cardOutput += data.casiTotali+ " Casi Totali \n"+ data.positiviTotali+ " Positivi \n " + data.decedutiTotali+ " Deceduti \n "+data.positiviNuovi+ " Nuovi Positivi \n" + data.tamponiEffettuati+ " Tamponi Effettuati \n #RESTAACASA";
                repromptOutput = CONTINUE_REPROMPT_en;
                title = SKILL_NAME_en;
            }
        //se non sono riuscito a recuperare i dati mando mess di errore
        }else{
            //build message
            if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
                speechOutput = "Non sono riuscito a recuperare i dati in questo momento. Riprova più tardi.";
                repromptOutput = CONTINUE_REPROMPT;
                title = SKILL_NAME;
                
            }else{
                speechOutput = "Non sono riuscito a recuperare i dati in questo momento. Riprova più tardi.";
                repromptOutput = CONTINUE_REPROMPT_en;
                
                title = SKILL_NAME_en;
            }
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            //.reprompt(repromptOutput)
            .withStandardCard(title, cardOutput, largeImageUrl)
            //.withSimpleCard(title, speechOutput)
            .getResponse();
    }
};


//casi positivi del virus
const GuaritiIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'guaritiIntent';
    },
    async handle(handlerInput) {
        //recupero data
        try {
            console.log("Sto aspettando i dati");
            var data = await getData();
            console.log("ho finito di aspettare i dati" + data)
        } catch (error) {
            console.log("Non sono riuscito a recuperare i dati " + error);
        }
        //se ho trovato i dati
        var speechOutput,repromptOutput,title;
        var cardOutput = "";
        
        //se sono riuscito a recuperare i dati
        if(data!=null){
            //build message
            if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
                speechOutput= "Ad oggi in Italia circa " + (data.guaritiTotali).toLocaleString('it') + " persone sono guarite dal virus. \n Di queste, " + (data.guaritiNuovi).toLocaleString('it') +" persone sono state dichiarate sane ieri.\n";
                cardOutput += data.casiTotali+ " Casi Totali \n"+ data.positiviTotali+ " Positivi \n " + data.decedutiTotali+ " Deceduti \n "+data.positiviNuovi+ " Nuovi Positivi \n" + data.tamponiEffettuati+ " Tamponi Effettuati \n #RESTAACASA";
                repromptOutput = CONTINUE_REPROMPT;
                title = SKILL_NAME;
            }else{
                speechOutput= "Ad oggi i positivi sono " + (data.positiviTotali).toLocaleString('it') + " edi quali solo " + (data.positiviNuovi).toLocaleString('it') +" sono nuovi casi scoperti ieri, circa " + (data.positiviNuoviDifferenza).toLocaleString('it') +" rispetto al giorno precedente.\n";
                cardOutput += data.casiTotali+ " Casi Totali \n"+ data.positiviTotali+ " Positivi \n " + data.decedutiTotali+ " Deceduti \n "+data.positiviNuovi+ " Nuovi Positivi \n" + data.tamponiEffettuati+ " Tamponi Effettuati \n #RESTAACASA";
                repromptOutput = CONTINUE_REPROMPT_en;
                title = SKILL_NAME_en;
            }
        //se non sono riuscito a recuperare i dati mando mess di errore
        }else{
            //build message
            if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
                speechOutput = "Non sono riuscito a recuperare i dati in questo momento. Riprova più tardi.";
                repromptOutput = CONTINUE_REPROMPT;
                title = SKILL_NAME;
                
            }else{
                speechOutput = "Non sono riuscito a recuperare i dati in questo momento. Riprova più tardi.";
                repromptOutput = CONTINUE_REPROMPT_en;
                
                title = SKILL_NAME_en;
            }
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            //.reprompt(repromptOutput)
            .withStandardCard(title, cardOutput, largeImageUrl)
            //.withSimpleCard(title, speechOutput)
            .getResponse();
    }
};


//casi positivi del virus
const DecedutiIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'decedutiIntent';
    },
    async handle(handlerInput) {
        //recupero data
        try {
            console.log("Sto aspettando i dati");
            var data = await getData();
            console.log("ho finito di aspettare i dati" + data)
        } catch (error) {
            console.log("Non sono riuscito a recuperare i dati " + error);
        }
        //se ho trovato i dati
        var speechOutput,repromptOutput,title;
        var cardOutput = "";
        
        //se sono riuscito a recuperare i dati
        if(data!=null){
            //build message
            if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
                speechOutput= "Ad oggi le persone decedute in Italia sono "+ (data.decedutiTotali).toLocaleString('it') + ". Di questi circa " + (data.decedutiNuovi).toLocaleString('it') +" sono venuti a mancare nella giornata di ieri.\n";
                cardOutput += data.casiTotali+ " Casi Totali \n"+ data.positiviTotali+ " Positivi \n " + data.decedutiTotali+ " Deceduti \n "+data.positiviNuovi+ " Nuovi Positivi \n" + data.tamponiEffettuati+ " Tamponi Effettuati \n #RESTAACASA";
                repromptOutput = CONTINUE_REPROMPT;
                title = SKILL_NAME;
            }else{
                speechOutput= "Ad oggi le persone decedute in Italia sono " +(data.decedutiTotali).toLocaleString('it') + ". Di questi circa " + (data.decedutiNuovi).toLocaleString('it') +" sono venuti a mancare nella giornata di ieri.\n";
                cardOutput += data.casiTotali+ " Casi Totali \n"+ data.positiviTotali+ " Positivi \n " + data.decedutiTotali+ " Deceduti \n "+data.positiviNuovi+ " Nuovi Positivi \n" + data.tamponiEffettuati+ " Tamponi Effettuati \n #RESTAACASA";
                repromptOutput = CONTINUE_REPROMPT_en;
                title = SKILL_NAME_en;
            }
        //se non sono riuscito a recuperare i dati mando mess di errore
        }else{
            //build message
            if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
                speechOutput = "Non sono riuscito a recuperare i dati in questo momento. Riprova più tardi.";
                repromptOutput = CONTINUE_REPROMPT;
                title = SKILL_NAME;
                
            }else{
                speechOutput = "Non sono riuscito a recuperare i dati in questo momento. Riprova più tardi.";
                repromptOutput = CONTINUE_REPROMPT_en;
                
                title = SKILL_NAME_en;
            }
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            //.reprompt(repromptOutput)
            .withStandardCard(title, cardOutput, largeImageUrl)
            //.withSimpleCard(title, speechOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        var speechOutput,repromptOutput,title;
        if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
            speechOutput = HELP_MESSAGE_EXTENDED;
            repromptOutput = HELP_REPROMPT[Math.floor(Math.random() * HELP_REPROMPT.length)];
            title = SKILL_NAME;
            
        }else{
            speechOutput = HELP_MESSAGE_EXTENDED_en;
            repromptOutput = HELP_REPROMPT_en[Math.floor(Math.random() * HELP_REPROMPT.length)];
            
            title = SKILL_NAME_en;
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptOutput)
            .withStandardCard(title, speechOutput, largeImageUrl)
            //.withSimpleCard(title, speechOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        var speechOutput;
        if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
            speechOutput = STOP_MESSAGE;
        }else{
            speechOutput =STOP_MESSAGE_en;
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
/*
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
*/

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        var speechOutput,repromptOutput;
        if(handlerInput.requestEnvelope.request.locale === 'it-IT'){
            speechOutput = HELP_MESSAGE_EXTENDED;
            repromptOutput = HELP_REPROMPT[Math.floor(Math.random() * HELP_REPROMPT.length)];
            
        }else{
            speechOutput = HELP_MESSAGE_EXTENDED_en;
            repromptOutput = HELP_REPROMPT_en[Math.floor(Math.random() * HELP_REPROMPT.length)];
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        SituationIntentHandler,
        PositiviIntentHandler,
        DecedutiIntentHandler,
        GuaritiIntentHandler,
        //InfoCovidIntentHandler,
        
        //IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();

/* GLOBAL / PROCESS VARIABLES */
var port = process.env.PORT || 8080;
var clientId = '';
var clientSecret = '';
var redirectURI = '';
var API = process.env.API || 'v32.0';
var oauth_timeout = process.env.oauth_timeout || 5400;
var DEBUG_ON = process.env.DEBUG_ON || true;

/* REQUIRED PACKAGES */

//alexa response transform
var alexa = require('alexa-nodekit');

//express for routing
var express = require('express');
var app = express();
var bodyParser = require("body-parser");
app.use(bodyParser());


//convert OAuth requests to/from Salesforce to Amazon
var sfdc_amazon = require('sfdc-oauth-amazon-express');

//Salesforce REST wrapper
var nforce = require('nforce'),
    chatter =require('nforce-chatter')(nforce);

//Connected App credentials for OAUTH request
var org = nforce.createConnection({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: redirectURI,
  apiVersion: API, 
  mode: 'single',
  plugins: ['chatter']
});

/* SETUP ROUTES */

app.get('/', function (req, res) {
  res.jsonp({status: 'running'});
});

app.post('/echo', function (req, res) {
  if(req.body == null) {
        console.log("WARN: No Post Body Detected");
   }
  if(req.body.request.intent == null) {
    route_alexa_begin(req,res);
  } else {
    route_alexa_intent(req,res);
  }
});

sfdc_amazon.addRoutes(app,oauth_timeout,true);

/* List of identifiable intent / actions that the route will respond to */
var intent_functions = new Array();
intent_functions['SearchContacts'] = SearchContacts;

function PleaseWait(req,res,intent) {
  send_alexa_response(res, 'Waiting', 'Salesforce', '...', 'Waiting', false);
}

function SearchContacts(req,res,intent) {
	var q = 'SELECT ID from Contact where FIRSTNAME = "'+intent.slots.firstName.value+'" AND LASTNAME ="'+intent.slots.lastName.value+'" LIMIT 1';
  org.query({ oauth:intent.oauth, query: q }, function(err, resp){

  if(!err && resp.records) {
    console.log(resp.records);
    send_alexa_error(res,'The first result has an ID of '+resp.records[0].Id);

  } else {
    send_alexa_error(res,'No results found for '+intent.slots.firstName.value+' '+intent.slots.lastName.value);
  }
});
}


//setup actual server
var server = app.listen(port, function () {

  console.log('Salesforce Rolodex Echo running on '+port);
  require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('addr: '+add);
  });

});




/* UTILIY FUNCTIONS */
function send_alexa_error(res,message) {

	send_alexa_response(res, 'An error occured during that request.  Please see the app log.', 'Salesforce', 'Error', message, true);

}

function send_alexa_response(res, speech, title, subtitle, content, endSession) {
    alexa.response(speech, 
           {
            title: title,
            subtitle: subtitle,
            content: content
           }, endSession, function (error, response) {
           if(error) {
             console.log({message: error});
             return res.status(400).jsonp({message: error});
           }
           return res.jsonp(response);
         });
}


function route_alexa_begin(req, res) {
   
   alexa.launchRequest(req.body);
   if(req.body.session == null || req.body.session.user == null || req.body.session.user.accessToken == null) {
        send_alexa_response(res, 'Please log into Salesforce', 'Salesforce', 'Not Logged In', 'Error: Not Logged In', true);
   } else {
   		send_alexa_response(res, 'Connected to Salesforce',  'Salesforce', 'Connection Attempt', 'Logged In (Single User)', false);
   }
   
   console.log('!----REQUEST SESSION--------!');
   console.log(req.body.session);
   

};


function route_alexa_intent(req, res) {

   if(req.body.session == null || req.body.session.user == null || req.body.session.user.accessToken == null) {
        send_alexa_response(res, 'Please log into Salesforce', 'Salesforce', 'Not Logged In', 'Error: Not Logged In', true);
   } else {
   	   intent = new alexa.intentRequest(req.body);
	   intent.oauth = sfdc_amazon.splitToken(req.body.session.user.accessToken);
	   console.log("INTENT>>>"+intent.intentName);
	   console.log("USERID>>>>"+req.body.session.user.userId);

	   intent_function = intent_functions[intent.intentName];
	   intent_function(req,res,intent);
   }

}
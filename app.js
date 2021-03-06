/* GLOBAL / PROCESS VARIABLES */
var port = process.env.PORT || 8080;
var clientId = '';
var clientSecret = '';
var redirectURI = '';
var API = process.env.API || 'v32.0';
var oauth_timeout = process.env.oauth_timeout || 5400;
var DEBUG_ON = process.env.DEBUG_ON || true;


var FIRST_NAMES = [];
var LAST_NAMES = [];

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
intent_functions['SpellName'] = SpellName;
intent_functions['AMAZON.StopIntent'] = Stop;

function PleaseWait(req,res,intent) {
  send_alexa_response(res, 'Waiting', 'Salesforce', '...', 'Waiting', false);
}

function Stop(req,res,intent) {
  send_alexa_response(res, 'Goodbye', 'Salesforce', '...', 'Goodbye', true);
}

function SearchContacts(req,res,intent) {
  var firstName = intent.slots.firstName.value;
  var lastName = intent.slots.lastName.value;
  console.log("Searching for "+firstName+" "+lastName);
	org.apexRest({oauth:intent.oauth, uri:'EchoContactSearch?firstName='+firstName+'&lastName='+lastName},
    function(err,result) {
    if(err) {
              console.log(err);
              send_alexa_error(res,'An error occured during that search: '+err);
            }
      else {
          console.log(result);
          if(result == null || result == '') {
             send_alexa_response(res,'I could not find anyone by the name of '+firstName+' '+lastName, 'Salesforce', 'Contact Result', 'No Result', true);
          } else {
            var speech = 'Found '+result.lastName+' with the first name of '+result.firstName;
            send_alexa_response(res, speech, 'Salesforce', 'Contact Result', 'Success', true);
          }
        } 
    });
}

function SpellName(req,res,intent) {

    if(intent.slots.firstOne.value == 'ai') { intent.slots.firstOne.value = 'i';} //wtf
    if(intent.slots.firstTwo.value == 'ai') { intent.slots.firstTwo.value = 'i';} //wtf
    if(intent.slots.firstThree.value == 'ai') { intent.slots.firstThree.value = 'i';} //wtf
    if(intent.slots.firstFour.value == 'ai') { intent.slots.firstFour.value = 'i';} //wtf
     
    if(intent.slots.lastOne.value == 'ai') { intent.slots.lastOne.value = 'i';} //wtf
    if(intent.slots.lastTwo.value == 'ai') { intent.slots.lastTwo.value = 'i';} //wtf
    if(intent.slots.lastThree.value == 'ai') { intent.slots.lastThree.value = 'i';} //wtf
    if(intent.slots.lastFour.value == 'ai') { intent.slots.lastFour.value = 'i';} //wtf


    var first_name = '';
    if(intent.slots.firstOne.value != null) {first_name += intent.slots.firstOne.value };
    if(intent.slots.firstTwo.value != null) {first_name += intent.slots.firstTwo.value };
    if(intent.slots.firstThree.value != null) {first_name += intent.slots.firstThree.value };
    if(intent.slots.firstFour.value != null) {first_name += intent.slots.firstFour.value };

    var last_name = '';
    if(intent.slots.lastOne.value != null) {last_name += intent.slots.lastOne.value };
    if(intent.slots.lastTwo.value != null) {last_name += intent.slots.lastTwo.value };
    if(intent.slots.lastThree.value != null) {last_name += intent.slots.lastThree.value };
    if(intent.slots.lastFour.value != null) {last_name += intent.slots.lastFour.value };

    first_name = first_name.toLowerCase().replace(/\./g,'');
    last_name = last_name.toLowerCase().replace(/\./g,'');    

    console.log(first_name);
    console.log(last_name);
    org.apexRest({oauth:intent.oauth, uri:'EchoContactSearch?firstName='+first_name+'&lastName='+last_name},
        function(err,result) {
        if(err) {
                  console.log(err);
                  send_alexa_error(res,'An error occured during that search: '+err);
                }
          else {
              console.log(result);
              if(result == null || result == '') {
                 send_alexa_response(res,'I could not find anyone by that name', 'Salesforce', 'Contact Result', 'No Result', true);
              } else {
                var speech = 'Found '+result.lastName+' with the first name of '+result.firstName;
                send_alexa_response(res, speech, 'Salesforce', 'Contact Result', 'Success', true);
              }
            } 
        });
/*  if(LAST_NAMES[intent.oauth.accessToken] != null && LAST_NAMES[intent.oauth.accessToken] == 'start') {
    LAST_NAMES[intent.oauth.accessToken] = intent.slots.letter.value;
    send_alexa_response(res, 'OK', 'Salesforce', 'Contact Spell', 'Success', false);
  }

  else if(LAST_NAMES[intent.oauth.accessToken] != null && LAST_NAMES[intent.oauth.accessToken] != 'start') {
    if(intent.slots.letter.value.toLowerCase() != 'next') {
      LAST_NAMES[intent.oauth.accessToken] += intent.slots.letter.value;
      send_alexa_response(res, 'OK', 'Salesforce', 'Contact Spell', 'Success', false);
    } else {
       console.log('FINDING');
       console.log(FIRST_NAMES[intent.oauth.accessToken].replace('/./gi',''));
       console.log(LAST_NAMES[intent.oauth.accessToken].replace('/./gi',''));

       org.apexRest({oauth:intent.oauth, uri:'EchoContactSearch?firstName='+FIRST_NAMES[intent.oauth.accessToken]+'&lastName='+LAST_NAMES[intent.oauth.accessToken]},
        function(err,result) {
        if(err) {
                  console.log(err);
                  send_alexa_error(res,'An error occured during that search: '+err);
                }
          else {
              console.log(result);
              if(result == null || result == '') {
                 send_alexa_response(res,'I could not find anyone by that name', 'Salesforce', 'Contact Result', 'No Result', true);
              } else {
                var speech = 'Found '+result.lastName+' with the first name of '+result.firstName;
                send_alexa_response(res, speech, 'Salesforce', 'Contact Result', 'Success', true);
              }
            } 
        });
        FIRST_NAMES[intent.oauth.accessToken] = null;
        LAST_NAMES[intent.oauth.accessToken] = null;
        return;
    }
  } 


  else if(FIRST_NAMES[intent.oauth.accessToken] == null) {
    FIRST_NAMES[intent.oauth.accessToken] = 'start';
    send_alexa_response(res, 'OK, begin spelling first name', 'Salesforce', 'Contact Spell', 'Success', false);
  }

  else if(FIRST_NAMES[intent.oauth.accessToken] == 'start') {
    FIRST_NAMES[intent.oauth.accessToken] = intent.slots.letter.value;
    send_alexa_response(res, 'OK', 'Salesforce', 'Contact Spell', 'Success', false);
  } 

  else if(FIRST_NAMES[intent.oauth.accessToken] != null && FIRST_NAMES[intent.oauth.accessToken] != 'start') {
    if(intent.slots.letter.value.toLowerCase() != 'next') {
      FIRST_NAMES[intent.oauth.accessToken] += intent.slots.letter.value;
      send_alexa_response(res, 'OK', 'Salesforce', 'Contact Spell', 'Success', false);
    } else {
      LAST_NAMES[intent.oauth.accessToken] = 'start';
      send_alexa_response(res, 'OK, begin spelling last name', 'Salesforce', 'Contact Spell', 'Success', false);
    }
  } 
  
  
  console.log(FIRST_NAMES[intent.oauth.accessToken]);
  console.log(LAST_NAMES[intent.oauth.accessToken]);


 */
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
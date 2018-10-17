const Twitter = require('twitter');
const Sentiment = require('sentiment');
var express = require('express');
var session = require('express-session')
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
var requestAPI = require('request');
const uuidv1 = require('uuid/v1');
let fs = require('fs');
var async = require('async');
var commonFiles = require('./util/commonfiles');
var addressify = require('./util/addressify').checkAddressify;

mongoose.connect('mongodb://admin:admin123@ec2-18-232-207-49.compute-1.amazonaws.com/admin', {
  useMongoClient: true
}, (err, db) => {
  if (err) {
    console.log('err', err);

  } else {
    console.log('Connected', db)
  }

});
mongoose.Promise = global.Promise;
const db = mongoose.connection

const config = {
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token_key: process.env.access_token,
  access_token_secret: process.env.access_token_secret
};

const tweet = new Twitter(config);
const sentiment = new Sentiment();

const params = {
  // q: '"#optus" OR "OPTUS" OR "Optus" ',
  screen_name: 'Iamcharlotte7',
  count: 20,
  result_type: 'recent',
  lang: 'en',
  tweet_mode: 'extended'
}

function callTwitterFeed() {
  console.log('1');
  return new Promise((resolve, reject) => {
    var finalTweet = []; //search/tweet
    console.log('2');
    tweet.get('statuses/user_timeline', params, function (err, data, response) {
      console.log('3');
      console.log(err);
      if (!err) {

        var filteredTweetArr = data.filter(function (tweetObj) {
          var createdDate = new Date(tweetObj.created_at);
          var todayDate = new Date();
          var Difftime = Math.abs(todayDate.getTime() - createdDate.getTime());
          var diffDays = Math.ceil(Difftime / (1000 * 3600 * 24));
          tweetObj.dayDiff = diffDays;

          return tweetObj.dayDiff <= 2;
        });
        // console.log(filteredTweetArr);

        filteredTweetArr.forEach(element => {

          var sentence = element.full_text;
          var text = /(broadband)|(PLAN)/i;
          var validTweetChkIndex = sentence.search(text);
          if (validTweetChkIndex !== -1) {
            finalTweet.push({
              'userID': 'Iamcharlotte7',
              'text': sentence,
              'keyword': 'broadband',
              'sentimentScore': sentiment.analyze(sentence)
            });
          }
        });

        console.log(finalTweet);

        resolve(finalTweet);
      } else {
        reject(err);
      }
    })
  })
}

app = express();
//Create express object

var port = process.env.PORT || 5000;
//Assign port
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  store: new MongoStore({
    mongooseConnection: db,
    autoRemove: 'interval',
    autoRemoveInterval: 60 * 24
  }),
  resave: true,
  saveUninitialized: true,
  cookie: {
    path: '/',
    httpOnly: false,
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}))
//Configuring express app behaviour
app.get("/opty", function (req, res) {
  res.send("Opty MicroService works");
});
const readFileSession = filePath => new Promise((resolve, reject) => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) reject(err);
    else resolve(data);
  });
});
app.post("/updatesession", async function (req, res) {
  console.log(req.body.sessionID);
  try {
    readFileSession('sessionID.json').then(async function (file) {
      console.log("--------file-------------");
      console.log(file);
      if (file) {
        let data = JSON.parse(file);
        console.log("---------------data------------------");
        console.log(data);
        let obj = data.find(x => x.sessionID === req.body.sessionID);
        let index = data.indexOf(obj);
        console.log("-------------index--------------------");
        console.log(index);
        if (index == -1) {
          data.push({
            "type": req.body.type,
            "sessionID": req.body.sessionID
          });
          await fs.writeFile("sessionID.json", JSON.stringify(data), {
            encodig: "utf8"
          }, function () {})
        } else {
          data[index]["type"] = req.body.type;
          await fs.writeFile("sessionID.json", JSON.stringify(data), {
            encodig: "utf8"
          }, function () {})
        }

      } else {
        await fs.writeFile("sessionID.json", JSON.stringify([{
          "type": req.body.type,
          "sessionID": req.body.sessionID
        }]), {
          encodig: "utf8"
        }, function () {

        })
      }

    }).catch(function (err) {
      console.log(err)
    });

  } catch (err) {
    console.error(err)
  }
  res.send(req.body.sessionID);
});
//GET Endpoint
let linestatus;
let line1 = "52, Scenic Road";
let line2 = "SUMMER ISLAND, NSW 2440";
let line3 = "Australia";
app.post("/optyfulfillment", async function (req, res) {
  console.log(JSON.stringify(req.body));

  console.log('Inside Opty API');
  let intentFrom = req.body.queryResult.action;
  var objData = null;
  var type = null;
  var smsType = null;
  var smsContent = '';
  var resp = commonFiles.WelcomeMsg();
  var msg = '';

  // if (intentFrom == 'Optus') {
  //   res.send({
  //     speech: "Redirecting to LE",
  //   });
  // } else
  if (intentFrom === 'input.welcome') {
    resp += "I'm Opty, the Skytel bot. How I may help you?";
    msg = {
      "speech": "",
      "messages": [{
        "type": 4,
        "platform": "facebook",
        "payload": {
          "facebook": {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": "Opty",
                  // "image_url": "http://www.campaigncentre.com.au/_client/_images/ROCKDALE0773/outlet/logo/sh45-optus_logo2.jpg",
                  "image_url": "https://www.dropbox.com/s/h6fhz42garn7dl7/logo.png?raw=1",
                  
                  "subtitle": resp,
                  "buttons": [{
                      "postback": "Account Management",
                      "text": "Account Management"
                    },
                    {
                      "postback": "Billing related",
                      "text": "Billing related"
                    },
                    {
                      "postback": "Network Related",
                      "text": "Network Related"
                    }
                  ]
                }]
              }
            }
          }
        }
      }]
    };

    return res.json(msg);
  } else if (intentFrom === 'scholorshipSearch') {

    msg = {
      "speech": "",
      "displayText": "",
      "messages": [{
        "type": 4,
        "platform": "facebook",
        "payload": {
          "facebook": {
            "text": `${resp} I’m Opty, the Skytel bot. Looks like you are interested in knowing about our roaming plans. Do you have a question?`,
            "quick_replies": [{
                "content_type": "text",
                "title": "Yes",
                "payload": "Yes"
              },
              {
                "content_type": "text",
                "title": "No",
                "payload": "No"
              }
            ]
          }
        }
      }]
    };
    return res.json(msg);
  } else if (intentFrom == "TweetFeedDetails") {
    console.log('```````Session ID`````````', req.body.sessionId);
    commonFiles.writeIncompleteTran(req.body.sessionId, true, "Roaming", function (err, data) {
      if (err) {
        res.send({
          speech: "Error in API response!!!",
          displayText: ""
        });
      }
      console.log(data);
      if (data == true) {
        res.send({
          speech: "",
          displayText: "",
          followupEvent: {
            name: "feedbackEvent"
          }
        });
      } else {
        msg = {
          "speech": "",
          "displayText": "",
          "messages": [{
              "type": 1,
              "platform": "facebook",
              "title": "HOME BROADBAND",
              "subtitle": "If you're running multiple devices, part of a big family or streaming on-demand video, then Broadband & nbn™ is just the ticket for your entertainment needs!<br/><br/><br/><br/>",
              "imageUrl": "https://smb.optus.com.au/opfiles/Shop/Consumer/Assets/Images/Broadband/broadband-NBN-landing-page-3UP.png",
              "buttons": [{
                  "text": "Show More",
                  "postback": "https://www.optus.com.au/shop/broadband/home-broadband"
                },
                {
                  "text": "Select this plan",
                  "postback": "HOME BROADBAND"
                }
              ]
            },
            {
              "type": 1,
              "platform": "facebook",
              "title": "HOME WIRELESS BROADBAND",
              "subtitle": "Get connected to Australia’s Winning Mobile Network. Enjoy instant plug and play wireless broadband in your home with unlimited data options on a flexible wireless broadband plans.",
              "imageUrl": "https://smb.optus.com.au/opfiles/Shop/Consumer/Broadband/Media/Images/HV-18-HWBB-3UP.jpg",
              "buttons": [{
                  "text": "Show More",
                  "postback": "https://www.optus.com.au/shop/broadband/home-wireless-broadband"
                },
                {
                  "text": "Select this plan",
                  "postback": "HOME WIRELESS BROADBAND"
                }
              ]
            },
            {
              "type": 1,
              "platform": "facebook",
              "title": "MOBILE BROADBAND",
              "subtitle": "If you're on the road, study remotely or need to keep the kids entertained in the car, you can stay connected on the move with Mobile Broadband.<br/><br/><br/><br/>",
              "imageUrl": "https://smb.optus.com.au/opfiles/Shop/Consumer/Broadband/Media/Images/tile-mobile-broadband.jpg",
              "buttons": [{
                  "text": "Show More",
                  "postback": "https://www.optus.com.au/shop/broadband/mobile-broadband"
                },
                {
                  "text": "Select this plan",
                  "postback": "MOBILE BROADBAND"
                }
              ]
            }
          ],
          contextOut: [{
            "name": "GetFeedback",
            "lifespan": 1,
            "parameters": {}
          }]
        };
      }
      return res.json(msg);
    });
  } else if (intentFrom == "AnotherQueryIntent") {
    // let query = req.body.result.resolvedQuery;
    console.log('Session ID: ', req.body.sessionId);
    commonFiles.getIncompleteTran(req.body.sessionId, function (err, data) {
      console.log('Incomplete Status', data);
      if (data == 'false') {
        msg = {
          "speech": "",
          "displayText": "",
          "messages": [{
              "type": 0,
              "platform": "facebook",
              "speech": "I can also help you with the following."
            },
            {
              "type": 1,
              "platform": "facebook",
              "title": "Opty",
              "subtitle": "Please choose from one of these options",
              // "imageUrl": "http://www.campaigncentre.com.au/_client/_images/ROCKDALE0773/outlet/logo/sh45-optus_logo2.jpg",
              "imageUrl": "https://www.dropbox.com/s/h6fhz42garn7dl7/logo.png?raw=1",
              "buttons": [{
                  "text": "Account Management",
                  "postback": "Account Management"
                },
                {
                  "text": "Billing related",
                  "postback": "Billing related"
                },
                {
                  "text": "Network Related",
                  "postback": "Network Related"
                }
              ]
            }
          ]
        };
        return res.json(msg);
      } else {
        msg = {
          "speech": "",
          "displayText": "",
          "messages": [{
            "type": 4,
            "platform": "facebook",
            "payload": {
              "facebook": {
                "text": "Your last transaction was cancelled. Would you like to continue?",
                "quick_replies": [{
                    "content_type": "text",
                    "title": "Yes",
                    "payload": "Yes"
                  },
                  {
                    "content_type": "text",
                    "title": "No",
                    "payload": "No"
                  }
                ]
              }
            }
          }],
          contextOut: [{
            "name": "IncompleteTran",
            "lifespan": 1,
            "parameters": {}
          }]
        };
        return res.json(msg);
      }
    });
  } else if (intentFrom == "COA-CompleteAddress-Update-No") {
    res.send({
      followupEvent: {
        name: "UpdateNewAddress",
        data: {
          "address": ""
        }
      }
    });
  } else if (intentFrom == "COA-ABP-Line1-Address" || intentFrom == "COA-ABP-Line2-Address" || intentFrom === 'COA-CompleteAddress-Update') {
    let paramaddress = req.body.result.parameters.address;
    console.log('Valid addr', req.body.result.parameters.address);
    addressify(req.body.result.parameters.address, intentFrom, line1, function (err, isValid) {
      if (err) {
        res.send({
          speech: "Error in API response of addressify!!!",
          displayText: ""
        });
      }

      if (isValid) {
        if (linestatus == 1) {
          let addressChange = `Thanks, that’s a valid address! Your new billing address is<br/>${paramaddress}<br/>${line2}<br/>${line3}<br/> Can you confirm this?`;

          msg = {
            "speech": "",
            "displayText": "",
            "messages": [{
              "type": 4,
              "platform": "facebook",
              "payload": {
                "facebook": {
                  "text": addressChange,
                  "quick_replies": [{
                      "content_type": "text",
                      "title": "Yes",
                      "payload": "Yes"
                    },
                    {
                      "content_type": "text",
                      "title": "No",
                      "payload": "No"
                    }
                  ]
                }
              }
            }]
          };
          linestatus = 0;
          return res.json(msg);
        }
        if (linestatus == 2) {
          // var addressList = isValid.addressArray;

          let addressChange = `Thanks, that’s a valid address! Your new billing address is<br/>${line1}<br/>${paramaddress}<br/>${line3}<br/> Can you confirm this?`;
          // var quickReplies = [];
          // addressList.forEach(element => {
          //   quickReplies.push({
          //     "content_type": "text",
          //     "title": element,
          //     "payload": element
          //   })
          // });

          msg = {
            "speech": "",
            "displayText": "",
            "messages": [{
              "type": 4,
              "platform": "facebook",
              "payload": {
                "facebook": {
                  "text": addressChange,
                  "quick_replies": [{
                      "content_type": "text",
                      "title": "Yes",
                      "payload": "Yes"
                    },
                    {
                      "content_type": "text",
                      "title": "No",
                      "payload": "No"
                    }
                  ]
                }
              }
            }]
          };
          linestatus = 0;
          return res.json(msg);
        } else {
          let addressChange = `Thanks, that’s a valid address! Your new billing address is<br/>${paramaddress}<br/> Can you confirm this?`;
          msg = {
            "speech": "",
            "displayText": "",
            "messages": [{
              "type": 4,
              "platform": "facebook",
              "payload": {
                "facebook": {
                  "text": addressChange,
                  "quick_replies": [{
                      "content_type": "text",
                      "title": "Yes",
                      "payload": "Yes"
                    },
                    {
                      "content_type": "text",
                      "title": "No",
                      "payload": "No"
                    }
                  ]
                }
              }
            }]
          };
          return res.json(msg);
        }
      } else {
        res.send({
          speech: "Looks like you have entered an invalid address. Please enter a valid one",
          displayText: ""
        });
      }
    });
  } else if (intentFrom == "COA-AddressByPart-Line1" || intentFrom == "COA-ABP-Line1-Address-No") {

    let addressChange = `Please enter the replacement for ${line1}`;
    res.send({
      speech: addressChange,
      displayText: ""
    });
    linestatus = 1;
  } else if (intentFrom == "COA-AddressByPart-Line2" || intentFrom == "COA-ABP-Line2-Address-No") {
    let addressChange = `Please enter the replacement for ${line2}`;
    res.send({
      speech: addressChange,
      displayText: ""
    });
    linestatus = 2;
  } else if (intentFrom == "COA-AddressByPart-Line3") {
    let addressChange = `Please enter the replacement for ${line3}`;
    res.send({
      speech: addressChange,
      displayText: ""
    });
    linestatus = 3;
  } else if (intentFrom == "COA-AddressByPart") {
    let line1 = "52, Scenic Road";
    let line2 = "SUMMER ISLAND, NSW 2440";
    // let line3 = "Australia 2627";
    msg = {
      "speech": "",
      "displayText": "",
      "messages": [{
        "type": 4,
        "platform": "facebook",
        "payload": {
          "facebook": {
            "text": `OK. Please choose the line you’d like to replace <br/><br/> 1. ${line1}<br/>2. ${line2}<br/>`,
            "quick_replies": [{
                "content_type": "text",
                "title": "Line 1",
                "payload": "Line 1"
              },
              {
                "content_type": "text",
                "title": "Line 2",
                "payload": "Line 2"
              }
            ]
          }
        }
      }]
    };
    return res.json(msg);

  } else if (intentFrom == "COA-ABP-Line1-Address-CommunicateYesNo" || intentFrom == "COA-ABP-Line2-Address-CommunicateYesNo" || intentFrom === "COA-CA-CommunicateYesNo") {

    let query = req.body.result.resolvedQuery;

    objData = new commonFiles.serviceNowEntityAddress();
    objData.u_string_3 = '9876543210';
    if (intentFrom === 'COA-ABP-Line2-Address-CommunicateYesNo') {
      objData.u_description = "Part of Address Change line 2. " + line2;
    } else {
      objData.u_description = "Part of Address Change line 1. " + line1;
    }
    objData.u_addresspri = query;
    type = 'SERVICEREQUEST';

    if (intentFrom === "COA-CA-CommunicateYesNo") {
      objData.u_description = "Complete Address Change";
    }

    commonFiles.callServiceNowApi(JSON.parse(JSON.stringify(objData)), type, function (error, data) {
      let SRID = data.result.u_number;

      let dateCreated = data.result.sys_created_on;
      var myDate = new Date(new Date(dateCreated).getTime() + (2 * 24 * 60 * 60 * 1000));
      myDate = myDate.getDate() + "/" + Number(myDate.getMonth() + 1) + "/" + myDate.getFullYear();
      let finalAddress = `Sure. Your billing & communication address will be updated on or before ${myDate}. The ticket# is ${SRID}. Is there anything else I may help you with?`;

      var msg = '';
      msg = {
        speech: '',
        messages: [{
          "type": 4,
          "platform": "facebook",
          "payload": {
            "facebook": {
              "text": finalAddress,
              "quick_replies": [{
                  "content_type": "text",
                  "title": "Yes",
                  "payload": "another_query"
                },
                {
                  "content_type": "text",
                  "title": "No",
                  "payload": "no_thanks"
                }
              ]
            }
          }
        }]
      };
      res.json(msg);
    });
  } else if (intentFrom == "TwitterFeed") {
    let twitterData = await callTwitterFeed();
    console.log("twitterData",twitterData);
    commonFiles.getIncompleteTran(req.body.sessionId, function (err, data) {
      console.log("incomplete trans",data);
      if (data == 'true') {
        res.send({
          speech: "",
          displayText: "",
          followupEvent: {
            name: "feedbackEvent"
          }
        });
      } else {        
        if (twitterData && twitterData[0] && twitterData[0].keyword == "broadband") {
          var msg = '';
          msg = {
            speech: '',
            messages: [{
              "type": 4,
              "platform": "facebook",
              "payload": {
                "facebook": {
                  "text": "Glad to be of help! Would you like to know about our broadband plans?",
                  "quick_replies": [{
                      "content_type": "text",
                      "title": "Yes",
                      "payload": "Yes"
                    },
                    {
                      "content_type": "text",
                      "title": "No",
                      "payload": "no_thanks"
                    }
                  ]
                }
              }
            }]
          };
          res.json(msg);
        } else {
          res.send({
            speech: "",
            displayText: "",
            followupEvent: {
              name: "feedbackEvent"
            }
          });
        }
      }
    });
  } else if (intentFrom == 'AnythingElse') {
    console.log('Intent fired ---- Anything else');
    res.send({
      followupEvent: {
        name: "AnythingElse"
      }
    });
  } else if (intentFrom == 'AM-DOB') {
    var dob = req.body.result.parameters["date"];
    if (commonFiles.validateDOB(dob)) {
      var msg = '';
      msg = {
        "speech": "",
        "displayText": "",
        "messages": [{
            "type": 0,
            "platform": "facebook",
            "speech": "Thanks Ms.Charlotte!"
          },
          {
            "type": 1,
            "platform": "facebook",
            "title": "Opty",
            "subtitle": "Please choose an option below",
            // "imageUrl": "http://www.campaigncentre.com.au/_client/_images/ROCKDALE0773/outlet/logo/sh45-optus_logo2.jpg",
            "imageUrl": "https://www.dropbox.com/s/h6fhz42garn7dl7/logo.png?raw=1",
            "buttons": [{
                "text": "Change of Address",
                "postback": "Change of Address"
              },
              {
                "text": "Update Alternate Contact#",
                "postback": "Update Alternate Contact#"
              },
              {
                "text": "Change Bill Plan",
                "postback": "Change Bill Plan"
              }
            ]
          }
        ]
      };
      res.json(msg);
    } else {
      res.send({
        speech: "Looks like your date of birth is invalid. Please provide a valid one.",
        displayText: "",
        contextOut: req.body.result.contexts
      });
    }
  } else if (intentFrom == 'Broadbandplans') {
    var broadbandPlans = req.body.result.parameters["broadband_plans"];
    objData = new commonFiles.serviceNowEntityBroadband();
    objData.u_string_3 = '9876543210';
    objData.u_description = "Customer has asked query regarding this " + broadbandPlans + " plan";
    type = 'SERVICEREQUEST';

    commonFiles.callServiceNowApi(JSON.parse(JSON.stringify(objData)), type, function (error, data) {
      let SRID = data.result.u_number;

      let dateCreated = data.result.sys_created_on;
      var myDate = new Date(new Date(dateCreated).getTime() + (2 * 24 * 60 * 60 * 1000));
      myDate = myDate.getDate() + "/" + Number(myDate.getMonth() + 1) + "/" + myDate.getFullYear();
      let finalAddress = `Sure. Your request has been taken, our customer executive will contact you in the next 1 hour to your primary contact number. The ticket# is ${SRID}. Is there anything else I may help you with?`;

      commonFiles.writeIncompleteTran(req.body.sessionId, false, "Roaming", function (err, data) {
        if (err) {
          res.send({
            speech: "Error in API response!!!",
            displayText: ""
          });
        }
        console.log(data);
      });

      var msg = '';
      msg = {
        speech: '',
        messages: [{
          "type": 4,
          "platform": "facebook",
          "payload": {
            "facebook": {
              "text": finalAddress,
              "quick_replies": [{
                  "content_type": "text",
                  "title": "Yes",
                  "payload": "another_query"
                },
                {
                  "content_type": "text",
                  "title": "No",
                  "payload": "no_thanks"
                }
              ]
            }
          }
        }]
      };
      res.json(msg);
    });

  } else if (intentFrom === 'AccountManagement' || intentFrom === 'AM-ContactNo-Reprompt') {
    readFileSession('sessionID.json').then(async function (file) {
      let data = JSON.parse(file);
      let obj = data.find(x => x.sessionID === req.body.sessionId);
      console.log('````````Session ID-----', req.body.sessionId);
      console.log("--------------Object Type-------------------");
      console.log(obj["type"]);
      if (obj["type"] == "false") {
        var mobileNo = req.body.result.parameters["mobileno"];
        var phoneStr = commonFiles.validatePhoneNo(mobileNo);
        if (phoneStr != 'valid') {
          res.send({
            followupEvent: {
              name: "UpdateAltContact",
              data: {
                "mobileno": "",
                "MSG": phoneStr
              }
            }
          });
        } else {
          var msg = '';
          msg = {
            speech: '',
            messages: [{
              "type": 4,
              "platform": "facebook",
              "payload": {
                "facebook": {
                  "text": "Before we proceed further, can I ask you a few questions for security reasons?",
                  "quick_replies": [{
                      "content_type": "text",
                      "title": "Yes",
                      "payload": "Yes"
                    },
                    {
                      "content_type": "text",
                      "title": "No",
                      "payload": "No"
                    }
                  ]
                }
              }
            }]
          };
          res.json(msg);
        }
      } else {
        var msg = '';
        msg = {
          "speech": "",
          "displayText": "",
          "messages": [{
              "type": 0,
              "platform": "facebook",
              "speech": "Thanks Ms.Charlotte!"
            },
            {
              "type": 1,
              "platform": "facebook",
              "title": "Opty",
              "subtitle": "Please choose an option below",
              // "imageUrl": "http://www.campaigncentre.com.au/_client/_images/ROCKDALE0773/outlet/logo/sh45-optus_logo2.jpg",
              "imageUrl": "https://www.dropbox.com/s/h6fhz42garn7dl7/logo.png?raw=1",
              "buttons": [{
                  "text": "Change of Address",
                  "postback": "Change of Address"
                },
                {
                  "text": "Update Alternate Contact#",
                  "postback": "Update Alternate Contact#"
                },
                {
                  "text": "Change Bill Plan",
                  "postback": "Change Bill Plan"
                }
              ]
            }
          ]
        };
        res.json(msg);
      }
    });
  } else if (intentFrom == 'DirectUpdateAlternateContactNo-No') {
    res.send({
      followupEvent: {
        name: "UpdateAltContact",
        data: {
          "phone-number": "",
          "MSG": "That's fine, re-enter the phone number again..."
        }
      } //,
      //contextOut: req.body.result.contexts
    });
  } else if (intentFrom == 'DirectUpdateAlternateContactNo' || intentFrom == 'DirectUpdateAlternateContactNo-Reprompt') {
    console.log('RESULT', JSON.stringify(req.body));
    console.log('PHONE NO', req.body.result.parameters["phone-number"]);
    var phoneNo = req.body.result.parameters["phone-number"];
    var phoneStr = commonFiles.validatePhoneNo(phoneNo);
    if (phoneStr != 'valid') {
      res.send({
        followupEvent: {
          name: "UpdateAltContact",
          data: {
            "phone-number": "",
            "MSG": phoneStr
          }
        }
      });
    } else {
      var msg = '';
      msg = {
        speech: '',
        messages: [{
          "type": 4,
          "platform": "facebook",
          "payload": {
            "facebook": {
              "text": "Well, you want me to update your alternate contact# for 892 901 1007 as " + phoneNo + ". Is that correct?",
              "quick_replies": [{
                  "content_type": "text",
                  "title": "Yes",
                  "payload": "Yes"
                },
                {
                  "content_type": "text",
                  "title": "No",
                  "payload": "No"
                }
              ]
            }
          }
        }]
      };
      res.json(msg);
    }
  } else {
    if (intentFrom === 'DUAC-Communicate-Yes' || intentFrom === 'DUAC-Communicate-No') {
      console.log('RESULT', JSON.stringify(req.body.result));

      // console.log('PHONENUM', JSON.stringify(req.body.result.contexts[1].parameters.phone-number));
      // console.log('PHONENUM', JSON.stringify(req.body.result.contexts[1].parameters.mobileno));
      objData = new commonFiles.serviceNowEntity();
      objData.u_string_3 = '9876543210';
      objData.u_description = 'Number change';
      type = 'SERVICEREQUEST';
      smsType = 'ADDRESSNUMSMSAPI';
      smsContent = 'alternate contact';
    } else if (intentFrom === 'BillUpdate-Confirm-SwitchPlan') {
      objData = new commonFiles.serviceNowEntity();
      objData.u_string_3 = 'Plan change for phone #892 901 1007 from $35 plan to $45 plan';
      objData.u_description = 'Plan change';
      type = 'UPDATEPLAN';
      smsType = 'PLANCHANGESMSAPI';
      // smsContent = 'address';
    }
    // else if (intentFrom === 'COA-ABP-Line1-Address-CommunicateYes') {
    //   objData = new commonFiles.serviceNowEntity();
    //   objData.u_string_3 = 'Plan change for phone #892 901 1007 from $35 plan to $45 plan';
    //   objData.u_description = 'Plan change';
    //   type = 'UPDATEPLAN';
    //   smsType = 'PLANCHANGESMSAPI';
    //   // smsContent = 'address';
    // }
    commonFiles.callServiceNowApi(JSON.parse(JSON.stringify(objData)), type, function (error, data) {
      if (error) {
        console.log('RESPONSE ERROR', JSON.stringify(error));
      } else {
        console.log('SR DATA', data);
        console.log('SR ID : ' + data.result.u_number);
        var msg = '';
        let dateCreated = data.result.sys_created_on;
        var myDate = new Date(new Date(dateCreated).getTime() + (2 * 24 * 60 * 60 * 1000));
        myDate = myDate.getDate() + "/" + Number(myDate.getMonth() + 1) + "/" + myDate.getFullYear();
        if (intentFrom === 'BillUpdate-Confirm-SwitchPlan') {
          //// SMS Content commented as of now!!!!!!
          // setTimeout(() => {
          //   commonFiles.sendSMSApi(smsType, '', '', '', '', '', function (err, resp) {
          //     console.log('SMS STATUS', resp);
          //   });
          // }, 30000); // 30 secs

          msg = {
            speech: '',
            messages: [{
              "type": 4,
              "platform": "facebook",
              "payload": {
                "facebook": {
                  "text": "Sure. I’ve switched the plan. Your $45 plan will be activated within 24 hrs. The ticket# is " + data.result.u_number + ". You would also receive an SMS it is updated. Is there anything else I may help you with?",
                  "quick_replies": [{
                      "content_type": "text",
                      "title": "Yes",
                      "payload": "another_query"
                    },
                    {
                      "content_type": "text",
                      "title": "No thanks",
                      "payload": "no_thanks"
                    }
                  ]
                }
              }
            }]
          };
        } else {
          if (intentFrom === 'DUAC-Communicate-Yes') {
            msg = {
              speech: '',
              messages: [{
                "type": 4,
                "platform": "facebook",
                "payload": {
                  "facebook": {
                    "text": "Sure. Your alternate contact number will be updated on or before " + myDate + ". The ticket# is " + data.result.u_number + ". Is there anything else I may help you with?",
                    "quick_replies": [{
                        "content_type": "text",
                        "title": "Yes",
                        "payload": "another_query"
                      },
                      {
                        "content_type": "text",
                        "title": "No thanks",
                        "payload": "no_thanks"
                      }
                    ]
                  }
                }
              }]
            };
          } else {
            msg = {
              speech: '',
              messages: [{
                "type": 4,
                "platform": "facebook",
                "payload": {
                  "facebook": {
                    "text": "Your alternate contact number and alternate communication channel will be updated on or before " + myDate + ". The ticket# is " + data.result.u_number + ". Is there anything else I may help you with?",
                    "quick_replies": [{
                        "content_type": "text",
                        "title": "Yes",
                        "payload": "another_query"
                      },
                      {
                        "content_type": "text",
                        "title": "No thanks",
                        "payload": "no_thanks"
                      }
                    ]
                  }
                }
              }]
            };
          }
          //// SMS Content commented as of now!!!!!!
          // commonFiles.sendSMSApi(smsType, '', '', smsContent, myDate, data.result.u_number, function (err, resp) {
          //   console.log('SMS STATUS', resp);
          // });
        }

        console.log('BUILT MSG', msg);
        return res.json(msg);
      }
    });
  }
});
//POST Call Endpoint

console.log("Server Running at Port : " + port);

app.listen(port);

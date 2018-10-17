const requestAPI = require('request');
var moment = require('moment-timezone');
const ServiceNowUserName = process.env.ServiceNowUserName; // 'admin';
const ServiceNowPwd = process.env.ServiceNowPwd; //'pj10GXYsUTej';


const header = {
    'Cache-Control': 'no-cache',
    Accept: 'application/json',
    'Content-Type': 'application/json'
};

const apiList = {
    'SERVICEREQUEST': `https://dev64379.service-now.com/api/now/table/u_servicerequest`,
    'UPDATEPLAN': `https://dev64379.service-now.com/api/now/table/u_servicerequest`,
    'ADDRESSNUMSMSAPI': `http://smsapi.24x7sms.com/api_2.0/SendSMS.aspx?APIKEY=ZY2nHm2RiIC&MobileNo=phonenumber&SenderID=TESTIN&Message=Hello name, Your type will be updated on or before deadline. Ticket is SR - SRID.&ServiceName=TEMPLATE_BASED`,
    'PLANCHANGESMSAPI': `http://smsapi.24x7sms.com/api_2.0/SendSMS.aspx?APIKEY=ZY2nHm2RiIC&MobileNo=phonenumber&SenderID=TESTIN&Message=Hello name, Your $45 mobile plan is now active. Enjoy unlimited nationwide talk and text and 15GB data with a bonus of 15GB data.&ServiceName=TEMPLATE_BASED`,
    'ADDRESSIFYAPI': `https://api.addressify.com.au/addresspro/autocomplete?api_key=${process.env.addressifyToken}&term=addrString`,
    'ADDRESSIFYAPISUBURB': `https://api.addressify.com.au/address/suburbStatePostcodeAutoComplete?api_key=${process.env.addressifyToken}&term=addrString`,
    'WRITEINCOMPLETETRAN': `http://ec2-18-232-207-49.compute-1.amazonaws.com:7000/writeIncompleteTran`,
    'GETINCOMPLETETRAN': `http://ec2-18-232-207-49.compute-1.amazonaws.com:7000/getIncompleteStatus?ChatId=CHATID`
};

var callServiceNowApi = function (dataService, type, callback) {
    try {
        var options = {
            url: apiList[type],
            method: 'POST',
            header: header,
            body: dataService,
            json: true,
            auth: {
                user: ServiceNowUserName,
                password: ServiceNowPwd
            }
        };

        requestAPI(options, function (error, response, body) {
            if (error) {
                console.log('API ERROR', JSON.stringify(error));
                callback(error, false);
            } else {
                console.log('headers:', JSON.stringify(response.headers));
                console.log('status code:', JSON.stringify(response.statusCode));
                callback(null, body);
            }
        });
    } catch (err) {
        console.log('RESPONSE ERROR', JSON.stringify(err));
    }
};

var sendSMSApi = function (smscontent, phonenumber, name, type, date, SRID, callback) {
    try {
        phonenumber = '919710824685';
        name = 'Ms.Charlotte';
        var smsApi = apiList[smscontent].replace('phonenumber', phonenumber);
        smsApi = smsApi.replace('name', name);
        smsApi = smsApi.replace('type', type);
        smsApi = smsApi.replace('deadline', date);
        smsApi = smsApi.replace('SRID', SRID);
        console.log(smsApi, phonenumber);

        requestAPI(smsApi, function (error, response, body) {
            if (error) {
                console.log('API ERROR', JSON.stringify(error));
                callback(error, false);
            } else {
                console.log('headers:', JSON.stringify(response.headers));
                console.log('status code:', JSON.stringify(response.statusCode));
                callback(null, true);
            }
        });
    } catch (err) {
        console.log('RESPONSE ERROR', JSON.stringify(err));
    }
};

var writeIncompleteTran = function (data, status, pageFrom, callback) {
    try {
        console.log(data);

        let jsonData = {
            "ChatSession": data,
            "UserName": "Charlotte",
            "ChatPage": pageFrom,
            "IsTransactionComplete": status,
            "TransactionType": "BroadBand"
        };

        var options = {
            url: apiList["WRITEINCOMPLETETRAN"],
            method: 'POST',
            header: header,
            body: jsonData,
            json: true
        };
        console.log(options);

        requestAPI(options, function (error, response, body) {
            if (error) {
                console.log('API ERROR', JSON.stringify(error));
                callback(error, false);
            } else {
                console.log('headers:', JSON.stringify(response.headers));
                console.log('status code:', JSON.stringify(response.statusCode));
                callback(null, body);
            }
        });
    } catch (err) {
        console.log('RESPONSE ERROR', JSON.stringify(err));
        callback(err, null);
    }
};

var getIncompleteTran = function (chatId, callback) {
    try {
        console.log(chatId);
        var options = apiList["GETINCOMPLETETRAN"].replace('CHATID', chatId);
        // var options = {
        //     url: apiList["WRITEINCOMPLETETRAN"],
        //     method: 'GET',
        //     header: header,
        //     body: '',
        //     json: true
        // };
        console.log(options);

        requestAPI(options, function (error, response, body) {
            if (error) {
                console.log('API ERROR', JSON.stringify(error));
                callback(error, false);
            } else {
                console.log('headers:', JSON.stringify(response.headers));
                console.log('status code:', JSON.stringify(response.statusCode));
                callback(null, body);
            }
        });
    } catch (err) {
        console.log('RESPONSE ERROR', JSON.stringify(err));
        callback(err, null);
    }
};


var serviceNowEntity = function () {
    this.u_string_3 = null; //mobileno
    this.u_name = 'Charolette';
    this.u_choice_2 = 'mp';
    this.u_choice_1 = 'in progress';
    this.u_choice_4 = 'number';
    this.u_description = null; //desc
}
var serviceNowEntityAddress = function () {
    this.u_string_3 = null; //mobileno
    this.u_name = 'Charolette';
    this.u_choice_2 = 'hp';
    this.u_choice_1 = 'in progress';
    this.u_choice_4 = 'address';
    this.u_description = null; //desc
}
var serviceNowEntityBroadband = function () {
    this.u_string_3 = null; //mobileno
    this.u_name = 'Charolette';
    this.u_choice_2 = 'hp';
    this.u_choice_1 = 'in progress';
    this.u_choice_4 = 'broadband';
    this.u_description = null; //desc
}

var welcomeMsg = function () {
    let curHr = moment().tz("Australia/Sydney").format("HH");
    if (curHr < 12) {
        return 'Good Morning ';
    } else if (curHr < 18) {
        return 'Good Afternoon ';
    } else {
        return 'Good Evening ';
    }
};

var validatePhoneNo = function (phoneNo, input) {
    if (phoneNo == '') {
        return input == "phone-number" ? "Can you provide your alternate number please?" : "Can you provide your phone number please?";
    } else if (isNaN(phoneNo)) {
        return "Looks like it has some non-numbers... Can you re-enter?";
    } else if (phoneNo.length != 10) {
        return "You need to enter a 10 digit phone number!"
    } else {
        return 'valid';
    }
};

var validateDOB = function (date) {
    var dob = new Date(date);
    console.log('``````````````DOB``````````', dob);
    var currDate = new Date();
    console.log('``````````````Current Date``````````', currDate);
    var age = currDate.getFullYear() - dob.getFullYear();
    console.log('``````````````Age``````````', age);
    if (dob >= currDate) {
        console.log('``````````````False``````````');
        return false;
    } else if (age > 120) {
        console.log('``````````````False``````````');
        return false;
    } else {
        console.log('``````````````True``````````');
        return true;
    }
}

module.exports.callServiceNowApi = callServiceNowApi;
module.exports.sendSMSApi = sendSMSApi;
module.exports.serviceNowEntity = serviceNowEntity;
module.exports.serviceNowEntityAddress = serviceNowEntityAddress;
module.exports.serviceNowEntityBroadband = serviceNowEntityBroadband;
module.exports.WelcomeMsg = welcomeMsg;
module.exports.apiList = apiList;
module.exports.validatePhoneNo = validatePhoneNo;
module.exports.validateDOB = validateDOB;
module.exports.writeIncompleteTran = writeIncompleteTran;
module.exports.getIncompleteTran = getIncompleteTran;
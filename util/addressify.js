// imports

const requestAPI = require('request');
// const addressifyToken = '149f761a-b8a6-4bd1-a87b-c7d0b805fd78';
var addressifyAPI = require('./commonfiles').apiList.ADDRESSIFYAPI;
var addressifyAPISubUrb = require('./commonfiles').apiList.ADDRESSIFYAPISUBURB;
const header = {
    'Cache-Control': 'no-cache',
    Accept: 'application/json',
    'Content-Type': 'application/json'
};


var checkAddressify = function (inputStr,lineDetail,firstLine,callback) {
    try {

        var query = inputStr.replace(",", "").split(" ").join("+");
        if((lineDetail === 'COA-ABP-Line2-Address')){
            var splitFirstLine = firstLine.replace(",", "").split(" ").join("+");
            query = splitFirstLine + '+' + query;
        }
        console.log('Addressify token', query);
        // var fullAddressifyAPI = (lineDetail === 'COA-ABP-Line2-Address') ? addressifyAPISubUrb.replace('addrString', query) : addressifyAPI.replace('addrString', query);    
        var fullAddressifyAPI = addressifyAPI.replace('addrString', query);    
        console.log('Addressify token1', fullAddressifyAPI);
        var options = {
            url: fullAddressifyAPI,
            method: 'GET',
            header: header,
            body: '',
            json: true,
        };

        console.log('API head', options);

        requestAPI(options, function (error, response, body) {
            if (error) {
                console.log('API ERROR', JSON.stringify(error));
                callback(error, false);
            } else {
                console.log('headers:', JSON.stringify(response.headers));
                console.log('status code:', JSON.stringify(response.statusCode));
                console.log('ADDRESSIFY------------', JSON.stringify(body));

                // {flag:true, addressArray:body}
                if (body.length > 0) {
                    callback(null, true);
                } else {
                    callback(null, false);
                }
            }
        });
    } catch (ex) {
        console.log('CATCHERROR', ex);
    }
};


module.exports.checkAddressify = checkAddressify;
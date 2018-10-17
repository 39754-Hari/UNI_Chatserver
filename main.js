var express = require('express');
var session = require('express-session')
var FileStore = require('session-file-store')(session);
var bodyParser = require('body-parser');
const uuidv1 = require('uuid/v1');
const fs=require("fs");
var app = express();

//Create express object

var port = process.env.PORT || 80;
//Assign port
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    store: new FileStore, 
    resave:false,saveUninitialized:false,
    secret: 'keyboard cat', cookie: { maxAge: 60000 * 60 * 24 }
}))
const readFileSession = filePath => new Promise((resolve, reject) => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) reject(err);
    else resolve(data);
  });
});

 

app.get('/', function (req, res, next) {
    console.log(req.session);
    if (req.session.views) {
        res.setHeader('Content-Type', 'text/html')
        res.write('<p>views: ' + req.session.views + '</p>')
        res.write('<p>expires in: ' + req.session.views + 's</p>')
        res.end()
    } else {
        const uuidv1 = require('uuid/v1');
        req.session.views = uuidv1();
        res.end('welcome to the session demo. refresh!')
    }
})
app.listen(port);
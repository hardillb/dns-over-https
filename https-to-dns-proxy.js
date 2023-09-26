#!/usr/bin/env node
const fs = require('fs');
//const https = require('https');
const spdy = require('spdy');

const express = require('express');
const app = express();
const dgram = require('dgram');
const packet = require('dns-packet');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const types = require('./types.js');
const rcodes = require('./rcodes.js');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var dnsServer = "8.8.8.8";
var port = parseInt(process.env['PORT']) || 443;


if (process.argv.length == 3) {
  dnsServer = process.argv[2];
}

app.use(morgan('combined'));
app.use(bodyParser.raw({
  type: 'application/dns-message'
}));

app.post('/dns-query', (req, res) => {
  if (req.headers["content-type"] == 'application/dns-message') {

    var socket = dgram.createSocket('udp4');

    socket.on('message', (message, rinfo) => {
      var data = packet.decode(message);

      res.set({
        'Content-Type': 'application/dns-message',
        'Content-Length': message.length
      });
      res.send(message);
      socket.close();
    });

    socket.send(req.body, 0, req.body.length, 53, dnsServer);

  } else {
    res.sendStatus(415);
  }
});

app.get('/dns-query', (req, res) => {
  if (req.query.ct == "application/dns-message" ) {
    var base = req.query.dns;
    var buf = Buffer.from(base, 'base64');

    var socket = dgram.createSocket('udp4');

    socket.on('message', (message, rinfo) => {

      var data = packet.decode(message);

      res.set({
        'Content-Type': 'application/dns-message',
        'Content-Length': message.length
      });
      res.send(message);
      socket.close();
    });

    socket.send(buf, 0, buf.length, 53, dnsServer);
  } 
});

app.get("/resolve", (req,res) => {
  if (!req.query.ct || req.query.ct == "application/dns-json") {
    var name = req.query.name;
    var type = req.query.type;
    var cd = false;
    var d = false;

    if (req.query.cd && (req.query.cd != false || req.query != 0)) {
      cd = req.query.cd;
    }

    if (req.query.do && (req.query.do != false || req.query != 0)) {
      d = req.query.do;
    }

    console.log("cd",cd);
    console.log("do",d);

    if (type === undefined) {
      type = 'A'
    }

    if (!isNaN(type)) {
      type = types.toString(parseInt(type));
    }

    var flags = packet.RECURSION_DESIRED | packet.AUTHENTIC_DATA;
    
    if (cd) {
      flags = flags | packet.CHECKING_DISABLED;
    }

    if (d) {
      flags = flags |  packet.DNSSEC_OK;
    }

    var query = {
      type: 'query',
      id: getRandomInt(1, 65534),
      flags: flags,
      questions: [{
        type: type,
        name: name
      }]
    };

    
    var buf = packet.encode(query);

    var socket = dgram.createSocket('udp4');

    socket.on('message', (message, rinfo) => {
      var data = packet.decode(message);
      console.log("%j",data);
      var output = {
        Status: rcodes.toRcode(data.rcode),
        TC: data.flag_tc,
        RD: data.flag_rd,
        RA: data.flag_ra,
        AD: data.flag_ad,
        CD: data.flag_cd,
        Question: [

        ],
        Answer: [

        ],
        Additional: [

        ]
      };

      for (var i=0; i<data.answers.length;i++) {
        var entry = {
          type: types.toType(data.answers[i].type),
          data: data.answers[i].data,
          TTL: data.answers[i].ttl,
          name: data.answers[i].name
        }
        output.Answer.push(entry);
      };

      for (var i=0; i<data.questions.length;i++) {
        var entry = {
          type: types.toType(data.questions[i].type),
          name: data.questions[i].name
        }
        output.Question.push(entry);
      }

      // for (var i=0; i<data.additionals.length; i++) {
      //  var entry = {

      //  }
      //  output.Additional.push(entry);
      // }

      res.send(output);
      socket.close();
    });

    socket.send(buf, 0, buf.length, 53, dnsServer);
  }
});

app.get('/test', (req,res) => {
  res.send("HelloWorld");
});

var options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};
//const server = https.createServer(options, app);
const server = spdy.createServer(options, app);

server.listen(port ,() => {
  console.log('Example app listening on port %d, querying %s!', port, dnsServer);
});

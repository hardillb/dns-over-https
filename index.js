const express = require('express');
const app = express();
const dgram = require('dgram');
const packet = require('dns-packet');
const types = require('./types.js');
const rcodes = require('./rcodes.js');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.get('/resolve', (req, res) => {
	var name = req.query.name;
	var type = req.query.type;
	var cd = req.query.cd;

	if (type === undefined) {
		type = 'A'
	}

	if (parseInt(type) != NaN ) {
		type = types.toString(parseInt(type));
	}

	var flags = packet.RECURSION_DESIRED;

	if (cd) {
		flags = flags | packet.CHECKING_DISABLED;
	}

	var buf = packet.encode({
	  type: 'query',
	  id: getRandomInt(1, 65534),
	  flags: flags,
	  questions: [{
	    type: type,
	    name: name
	  }]
	});

	var socket = dgram.createSocket('udp4');

	socket.on('message', function (message, rinfo) {
	  var data = packet.decode(message);
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

	  res.send(output);
	  socket.close();
	});

	socket.send(buf, 0, buf.length, 53, '192.168.1.114');

});

app.listen(3000, () => {
	console.log('Example app listening on port 3000!')
});
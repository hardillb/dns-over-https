const dgram = require('dgram')
const request = require('request')
const dnsPacket = require('dns-packet')

const port = process.env["DNS_PORT"] || 53
//https://cloudflare-dns.com/dns-query"
const url = process.env["DNS_URL"] 
    || "https://dns.google/dns-query" 
const allow_selfSigned = (process.env["DNS_INSECURE"] == 1) 

//pinning to IPv4 as server was replying on IPv6 when request came in on IPv4
const server = dgram.createSocket('udp4')

server.on('listening', function(){
  console.log("listening")
})

server.on('message', function(msg, remote){
  var packet = dnsPacket.decode(msg)
  var id = packet.id
  var options = {
    url: url,
    method: 'POST',
    body: msg,
    encoding: null,
    rejectUnauthorized: allow_selfSigned ? false : true,
    headers: {
      'Accept': 'application/dns-message',
      'Content-Type': 'application/dns-message'
    }
  }

  request(options, function(err, resp, body){
    if (!err && resp.statusCode == 200) {
      var respPacket = dnsPacket.decode(body)
      respPacket.id = id
      // console.log(respPacket);
      server.send(dnsPacket.encode(respPacket),remote.port)
    } else {
      console.log(err)
    }
  })

})

server.bind(port)
# A Basic DNS-Over-HTTPS implementation

Following the anouncement from Mozilla, Cloudflare and Google and starting a trial of DNS-Over-HTTPS I thought it might be usefull 
to look at how to implement my own server.

At the moment there are 2 competing standards.

### JSON

The spec for the Google implementation can be found [here](https://developers.google.com/speed/public-dns/docs/dns-over-https).

### Wireformat

The RFC for this is available [here](https://datatracker.ietf.org/doc/draft-ietf-doh-dns-over-https/?include_text=1)

## Running

First you need to SSL certificate for your server because the broker will only request DNS lookups from a secure server. Normally I'd go 
with Letsencrypt but unfortunately they won't issue a certificate for a raw IP address.

If you don't want to pay for a "real" certificate I've included a script to build a self signed for the IP address you are going to run this on.

You will be asked for a password 3 times, this will not be needed again but needs to match all 3 times.

To run on the default port 443 and query the Google 8.8.8.8 DNS server then use the following:

`node index.js`

You can change the DNS server to query by passing it on the command line:

`node index.js 192.168.1.1`

Once running point `https://<ip-address>/test` and accept the security exception to import and trust the certificate.

### Configuring Firefox (version 60 or newer)

- Enter `about:config` in the address bar
- search for `network.trr`
- change `network.trr.mode` to either 1, 2 or 3. 
    1. Firefox pick the quickest
    2. Firefox trys DNS-Over-HTTPS first and falls back to DNS
    3. Firefox only uses DNS-Over-HTTPS
- change `network.trr.uri` to `https://<ip-address>/query`
- change `network.trr.bootstrapAddress` to `<ip-address>`

## TODO

- Add HTTP/2 support
- More testing
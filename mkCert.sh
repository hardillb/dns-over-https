#!/bin/bash

#openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -subj "/CN=$1"

openssl req -x509 -newkey rsa:4096 \
    -keyout server.key \
    -subj "/C=US/ST=CA/O=Acme, Inc./CN=DNS-over-HTTPS" \
    -reqexts SAN \
    -config <(cat /etc/ssl/openssl.cnf <(printf "\n[SAN]\nsubjectAltName=IP:$1")) \
    -out server.crt -days 365 -extensions SAN

openssl rsa -in server.key -out server.key
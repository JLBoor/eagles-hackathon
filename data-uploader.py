#!/usr/bin/python

import requests

dataFile="../rbc_sectran.csv"
#url="http://localhost:3000/api/transactions"
url="https://eagles-app.mybluemix.net/api/transactions"

def postData( line ):
    try:
        requests.post(url, data={'csvLine': line})
    except ZeroDivisionError:
        print "*** failed ***"

i=0
with open(dataFile) as f:
    for line in f:
        postData(line)
        i=i+1
        print "Posted: " + str(i)


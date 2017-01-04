# eagles-hackathon

Project details:
- dashboard with different widgets:
  * best performing stocks within a period of time
  * best performing stock combo (2 or more combined) within a period of time
  * highest moving stock (up or down) within a period of time
- ability to give voice commands to Amazon Echo device, to retrieve this information (should be able to 'register' Echo devices within the GUI)


## APIs

### /transactions
- GET
 - if ```countOnly``` is present, it will only return the count.

- POST /transactions
 - ```{ "csvLine": "..."}```

- DELETE /transactions

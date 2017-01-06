/**
 * Module dependencies.
 */
const request = require('request');
const readline = require('readline');
const fs = require('fs');

const CSV = '../rbc_sectran.csv';

const mongoUrl = 'mongodb://localhost:27017/test';
const mongoose = require('mongoose');
const chalk = require('chalk');
const CSV_DATE_FORMAT = 'YYYYMMDD HH:mm:ss';
const CSV_DATE_OFFSET_IN_DAYS = 35;
const moment = require('moment');
const INDEX_TYPE_CODE = 18;
const INDEX_ISIN = 6;
const isinMapping = require('./config/mapping-isin-ticker.js');
const Transaction = require('./models/Transaction');
const headers = [
 "Mysterious_Header",
 "Source_Name",
 "Source_System_Transaction_Identifier",
 "Source_Account_Number",
 "Source_Portfolio_Number",
 "Source_Account_Name",
 "Security_Identifier_ISIN",
 "Security_Identifier_CUSIP",
 "Security_Identifier_SEDOL",
 "Security_Short_Name",
 "Counterparty_Local_Code",
 "Counterparty_Name",
 "Internal_CUID",
 "Investment_Manager_Code",
 "Investment_Manager_Name",
 "External_Source_Trade_Reference_Number",
 "Client_Transaction_Reference_ID",
 "Broker_Confirm_Number",
 "Security_Type_Code",
 "Security_Type_Description",
 "Transaction_Type",
 "Location_Code",
 "Trade_Source_Code",
 "Trade_Date_and_Time",
 "Received_Date_and_Time",
 "Contractual_Settlement_Date_and_Time",
 "Actual_Settlement_Date_and_Time",
 "Maturity_Date_and_Time",
 "Settlement_Currency",
 "Quantity",
 "Deal_Price",
 "Net_Settlement_Amount",
 "Gross_Transaction_Amount",
 "Reverse_Amount",
 "Accrued_Interest_Amount",
 "Interest_Rate",
 "Miscellaneous_Fees",
 "Brokerage_Commission",
 "Book_Value",
 "Par_Value",
 "Transaction_Status",
 "Transaction_Status_Date_and_Time",
 "Affirmation_Status",
 "Affirmation_Status_Date_and_Time",
 "STE_Indicator",
 "STP_Indicator",
 "STE_Code",
 "Non_STE_Reason",
 "STP_Code",
 "Non_STP_Reason",
 "Fail_Reason_Code",
 "Fail_Reason_Description",
 "Match_Fail_Reason",
 "Narrative_Description",
 "Transaction_Status_TLM",
 "Account_Base_Currency",
 "Broker_Amount",
 "Broker_Settlement_Amount",
 "Exchange_Rate",
 "Bank_Identifier_Code",
 "Bank_Identifier_Name",
 "Place_of_Settlement",
 "TAR_Trade_Action",
 "TAR_From_Currency",
 "Security_Identifier_Bank_Internal",
 "Trade_Source_Code_Description"];

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI || mongoUrl);
mongoose.connection.on('error', () => {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
});

var pooledRequest = request.defaults({pool: {maxSockets: 100}});

var lineReader = require('readline').createInterface({
 crlfDelay: 1000,
 input: fs.createReadStream(CSV)
});




lineReader.on('line', function (line) {
  var columns = line.split('|');
  var result = new Transaction();
  var typeCode = columns[INDEX_TYPE_CODE];
  var isin = columns[INDEX_ISIN];

  for(var i = 0; i < columns.length; i++) {
      // Offseting the Trade date by +35 days.. For demo purposes
      if(headers[i] === 'Trade_Date_and_Time') {
        columns[i] = moment(columns[i], CSV_DATE_FORMAT)
          .add(35, 'days')
          .toDate();
      }

      result['Ticker_Symbol'] = isinMapping.mapping[isin];
      result[headers[i]] = columns[i];
  }
//  console.log(result);
  result.save(function e(){
  console.log(2)
  });
});

/**
 * GET /transactions
 */

const Transaction = require('../models/Transaction');
const moment = require('moment');

const CSV_DATE_FORMAT = 'YYYYMMDD HH:mm:ss';
const CSV_DATE_OFFSET_IN_DAYS = 35;

const INDEX_TYPE_CODE = 18;
const INDEX_ISIN = 6;

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

var _count = function(res) {
  Transaction.count({}, function(err, count) {
    if (!err) {
        res.send(`There are ${count} transactions.`);
    } else {throw err;}
  });
};

 exports.delete = (req, res) => {
   Transaction.remove({}, function(err, allTransactions) {
     if (!err) {
        res.send('done.');
     } else {throw err;}
   });
 };

  exports.get = (req, res) => {

    if(req.query.countOnly != undefined) {
      return _count(res);
    }

    if(req.query.date != undefined){
      var isoDate = moment.tz(req.query.date, "America/Toronto");
      Transaction.find({'Trade_Date_and_Time': isoDate})
      .limit(parseInt(req.query.limit) || 25)
      .exec(function(err, docs) {
        if (!err) {
            res.send(docs);
        } else {throw err;}
      });
    } else {

    Transaction.find({})
      .limit(parseInt(req.query.limit) || 25)
      .exec(function(err, docs) {
        if (!err) {
            res.send(docs);
        } else {throw err;}
      });
    }
  };

  exports.save = (req, res) => {

    var columns = req.body.csvLine.split('|');
    var result = new Transaction();

    var typeCode = columns[INDEX_TYPE_CODE];
    var isin = columns[INDEX_ISIN];

    if(typeCode !== 'EQ' || !isin) {
      res.send(204);
      return;
    }

    for(var i = 0; i < columns.length; i++) {

      // Offseting the Trade date by +35 days.. For demo purposes
      if(headers[i] === 'Trade_Date_and_Time') {
        columns[i] = moment(columns[i], CSV_DATE_FORMAT)
          .add(35, 'days')
          .toDate();
      }

      result[headers[i]] = columns[i];
    }

    result.save();
    res.send(result);
  };

exports.stats = (req, res) => {
      var d = new Date(req.query.date).toISOString;
      Transaction.aggregate([
            { $match: {
                'Trade_Date_and_Time': d
            }},
            { $group: {
                _id: "$Trade_Date_and_Time",
                count: { $sum: 1  }
            }}
        ], function (err, result) {
            if (err) {
                console.log(err);
                return;
            }
            console.log('result: '+result[0]);
            res.send(result[0]);
        });
  };
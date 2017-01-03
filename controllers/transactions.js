/**
 * GET /transactions
 */

const Transaction = require('../models/Transaction');

 let headers = [
 "Source_Name",
 "Source_System_Transaction_Identifier",
 "Source_Account_Number",
 "Source_Portfolio_Number",
 "Mysterious_Number",
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


exports.get = (req, res) => {
  res.send('hello');
};

exports.save = (req, res) => {

  let columns = req.body.csvLine.split('|');
  let result = new Transaction();

  for(let i = 0; i < columns.length; i++) {
    console.log(i, headers[i], columns[i]);
    result[headers[i]] = columns[i];
  }

  result.save();
  res.send(result);
};

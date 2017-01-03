const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  Source_Name: String,
  Source_System_Transaction_Identifier: String,
  Source_Account_Number: String,
  Source_Portfolio_Number: String,
  Source_Account_Name: String,
  Security_Identifier_ISIN: String,
  Security_Identifier_CUSIP: String,
  Security_Identifier_SEDOL: String,
  Security_Short_Name: String,
  Counterparty_Local_Code: String,
  Counterparty_Name: String,
  Internal_CUID: String,
  Investment_Manager_Code: String,
  Investment_Manager_Name: String,
  External_Source_Trade_Reference_Number: String,
  Client_Transaction_Reference_ID: String,
  Broker_Confirm_Number: String,
  Security_Type_Code: String,
  Security_Type_Description: String,
  Transaction_Type: String,
  Location_Code: String,
  Trade_Source_Code: String,
  Trade_Date_and_Time: String,
  Received_Date_and_Time: String,
  Contractual_Settlement_Date_and_Time: String,
  Actual_Settlement_Date_and_Time: String,
  Maturity_Date_and_Time: String,
  Settlement_Currency: String,
  Quantity: String,
  Deal_Price: String,
  Net_Settlement_Amount: String,
  Gross_Transaction_Amount: String,
  Reverse_Amount: String,
  Accrued_Interest_Amount: String,
  Interest_Rate: String,
  Miscellaneous_Fees: String,
  Brokerage_Commission: String,
  Book_Value: String,
  Par_Value: String,
  Transaction_Status: String,
  Transaction_Status_Date_and_Time: String,
  Affirmation_Status: String,
  Affirmation_Status_Date_and_Time: String,
  STE_Indicator: String,
  STP_Indicator: String,
  STE_Code: String,
  Non_STE_Reason: String,
  STP_Code: String,
  Non_STP_Reason: String,
  Fail_Reason_Code: String,
  Fail_Reason_Description: String,
  Match_Fail_Reason: String,
  Narrative_Description: String,
  Transaction_Status_TLM: String,
  Account_Base_Currency: String,
  Broker_Amount: String,
  Broker_Settlement_Amount: String,
  Exchange_Rate: String,
  Bank_Identifier_Code: String,
  Bank_Identifier_Name: String,
  Place_of_Settlement: String,
  TAR_Trade_Action: String,
  TAR_From_Currency: String,
  Security_Identifier_Bank_Internal: String,
  Trade_Source_Code_Description: String
});

transactionSchema.pre('save', function save(next) {
  console.log(this);
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

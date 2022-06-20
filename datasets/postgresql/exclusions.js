// TABLES too big to backup, where the data is also available publicly or from other sources
module.exports.pgExcludeList = ["clinical_trials", "clinically_vulnerable", "covid_populations"];

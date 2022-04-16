import { LambdaPGInfo } from "../../lib/types/interfaces";
import { grandIndexQuery } from "./grandindexquery";

const jwt = require("jsonwebtoken");

const config = {
  pgdatabase: process.env.PGDATABASE,
  pgport: process.env.PGPORT,
  postgres_un: process.env.POSTGRES_UN,
  postgres_pw: process.env.POSTGRES_PW,
};
const PostgresI = require("diu-data-functions").Methods.Postgresql;
const PGConstruct = PostgresI.init(config);
const PGLib = { lib: PGConstruct, functions: PostgresI };

module.exports.getByQueryString = (event: any, context: any, callback: any) => {
  if (!process.env.queryString) {
    console.error("API--LAMBDA--POSTGRESQL--ERROR: Bad setup, no queryString.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Query not found.",
    });
    return;
  }
  try {
    PGLib.functions.getByQuery(PGLib.lib, process.env.queryString, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

module.exports.getByRoleQueryString = (event: any, context: any, callback: any) => {
  if (!process.env.queryString || (!process.env.role && process.env.role !== "")) {
    console.error("API--LAMBDA--POSTGRESQL--ERROR: Bad setup, no queryString or role.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Query not found.",
    });
    return;
  }
  try {
    const decodedToken = decodetoken(event.headers.Authorization || event.headers.authorization);
    const userroles = decodedToken["roles"] || [];
    const rolecheck = checkRole(true, userroles, process.env.role);
    if (rolecheck === "" || rolecheck === "error") {
      console.error("API--LAMBDA--POSTGRESQL--FAILED: Denied due to lack of role");
      callback(null, {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
        body: "Access denied. Insufficient permissions to view any patients details.",
      });
      return;
    }
    let query = process.env.queryString + " " + rolecheck;
    const orderString = process.env.orderString || "";
    if (orderString) query += " ORDER BY " + orderString;
    PGLib.functions.getByQuery(PGLib.lib, query, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

module.exports.validateExists = (event: any, context: any, callback: any) => {
  if (!process.env.queryString || (!process.env.role && process.env.role !== "")) {
    console.error("API--LAMBDA--POSTGRESQL--ERROR: Bad setup, no queryString or role.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Query not found.",
    });
    return;
  }
  try {
    const decodedToken = decodetoken(event.headers.Authorization || event.headers.authorization);
    const userroles = decodedToken["roles"] || [];
    let includeswhere = false;
    if (process.env.queryString.includes("WHERE")) {
      includeswhere = true;
    }
    const rolecheck = checkRole(!includeswhere, userroles, process.env.role);
    if (rolecheck === "" || rolecheck === "error") {
      console.error("API--LAMBDA--POSTGRESQL--FAILED: Denied due to lack of role");
      callback(null, {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
        body: "Access denied. Insufficient permissions to view any patients details.",
      });
      return;
    }
    const conditions = JSON.parse(process.env.params!) || [];
    let conditionlist = "";
    conditions.forEach((conditionName: string) => {
      conditionlist = +` AND "` + conditionName + `" = '` + event["queryStringParameters"][conditionName] + `'`;
    });
    let query = process.env.queryString + ` ` + rolecheck + conditionlist;
    const orderString = process.env.orderString || "";
    if (orderString) query += " ORDER BY " + orderString;
    PGLib.functions.getByQuery(PGLib.lib, query, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

module.exports.update = (event: any, context: any, callback: any) => {
  if (!process.env.queryString) {
    console.error("API--LAMBDA--POSTGRESQL--ERROR: Bad setup, no queryString.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Query not found.",
    });
    return;
  }
  try {
    const conditionName = JSON.parse(process.env.params!)[0] || "ERROR";
    const x = buildUpdateList(JSON.parse(event.body));
    const query = "UPDATE " + process.env.queryString + " SET " + x + " WHERE " + conditionName`= '` + event["queryStringParameters"][conditionName] + `'`;
    PGLib.functions.getByQuery(PGLib.lib, query, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

function buildUpdateList(updateArray: any) {
  let output = "";
  const keys = Object.keys(updateArray);
  keys.forEach((key: string) => {
    output += "SET " + key + clearedValue(updateArray[key]) + " ";
  });
  return output;
}

function clearedValue(value: string) {
  if (value === "NULL") return "IS NULL";
  else if (value === "CURRENT_TIMESTAMP") return " = CURRENT_TIMESTAMP";
  else {
    return " ='" + value + "'";
  }
}

module.exports.getByRoleQueryAndCondition = (event: any, context: any, callback: any) => {
  if (!process.env.queryString || (!process.env.role && process.env.role !== "")) {
    console.error("API--LAMBDA--POSTGRESQL--ERROR: Bad setup, no queryString or role.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Query not found.",
    });
    return;
  }
  try {
    const decodedToken = decodetoken(event.headers.Authorization || event.headers.authorization);
    const userroles = decodedToken["roles"] || [];
    let includeswhere = false;
    if (process.env.queryString.includes("WHERE")) {
      includeswhere = true;
    }
    const rolecheck = checkRole(!includeswhere, userroles, process.env.role);
    if (rolecheck === "" || rolecheck === "error") {
      console.error("API--LAMBDA--POSTGRESQL--FAILED: Denied due to lack of role");
      callback(null, {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
        body: "Access denied. Insufficient permissions to view any patients details.",
      });
      return;
    }
    const conditionName = JSON.parse(process.env.params!)[0] || "ERROR";
    let query = process.env.queryString + ` ` + rolecheck + ` AND "` + conditionName + `" = '` + event["queryStringParameters"][conditionName] + `'`;
    const orderString = process.env.orderString || "";
    if (orderString) query += " ORDER BY " + orderString;
    PGLib.functions.getByQuery(PGLib.lib, query, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

function decodetoken(authorizationHeader: string) {
  const jwtonly = authorizationHeader.replace("JWT ", "");
  try {
    const decoded = jwt.decode(jwtonly);
    return decoded;
  } catch (ex) {
    console.log("AUTHORIZATION--AUTHORIZER--TOKENVERIFICATION--ERROR: " + jwtonly);
    return { roles: [] };
  }
}

function checkRole(alone: boolean, userroles: any, table: string) {
  let whereclause = "";

  if (userroles.length > 0) {
    userroles.forEach((role: any) => {
      const item = JSON.stringify(role);
      const keys = Object.keys(role);
      if (item.includes(table + "_")) {
        if (keys.length > 1) {
          let current: any = null;
          whereclause += "(";
          keys.forEach((k) => {
            if (k.includes(table + "_")) {
              current = k.replace(table + "_", "");
              whereclause += k.replace(table + "_", "") + " like '" + role[k] + "' AND ";
            } else {
              whereclause += current + " like '" + role[k] + "' AND ";
            }
          });
          whereclause = whereclause.substr(0, whereclause.length - 4);
          whereclause += ") OR ";
        } else {
          whereclause += keys[0].replace(table + "_", "") + " like '" + role[keys[0]] + "'";
          whereclause += " OR ";
        }
      }
    });
    if (whereclause.length > 0) {
      whereclause = whereclause.substr(0, whereclause.length - 4);
    }
  }

  if (whereclause.length > 0) {
    if (alone) {
      whereclause = " WHERE " + whereclause;
    } else {
      whereclause = "(" + whereclause + ") AND ";
    }
  }
  return whereclause;
}

module.exports.getGeoJson = (event: any, context: any, callback: any) => {
  try {
    const params = process.env.params || "";
    const payload = JSON.parse(params);
    if (!process.env.params || !payload.tablename || !payload.st_asgeojson || !payload.as_properties) {
      console.error("API--LAMBDA--DYNAMODB--ERROR: Improper payload: " + event.body);
      callback(null, {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ msg: "Bad Request. Could not find full payload of request.", params: event }),
      });
      return;
    }

    PGLib.functions.getGeoJson(PGLib.lib, payload, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

module.exports.getIsoChrone = (event: any, context: any, callback: any) => {
  try {
    const payload = event.body;
    if (!payload.query) {
      console.error("API--LAMBDA--DYNAMODB--ERROR: Improper payload: " + event.body);
      callback(null, {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ msg: "Bad Request. Could not find query parameter.", params: event }),
      });
      return;
    }

    PGLib.functions.getIsoChrone(PGLib.lib, payload, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

module.exports.getAll = (event: any, context: any, callback: any) => {
  if (!process.env.queryString) {
    console.error("API--LAMBDA--POSTGRESQL--ERROR: Bad setup, no queryString.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Tablename not found.",
    });
    return;
  }
  try {
    PGLib.functions.getAll(PGLib.lib, process.env.queryString, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

module.exports.getByRoleQueryAndCohort = (event: any, context: any, callback: any) => {
  if (!process.env.queryString || (!process.env.role && process.env.role !== "")) {
    console.error("API--LAMBDA--POSTGRESQL--ERROR: Bad setup, no queryString or role.");
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Bad Request. Query not found.",
    });
    return;
  }
  try {
    const decodedToken = decodetoken(event.headers.Authorization || event.headers.authorization);
    const userroles = decodedToken["roles"] || [];
    let includeswhere = false;
    if (process.env.queryString.includes("WHERE")) {
      includeswhere = true;
    }
    const rolecheck = checkRole(!includeswhere, userroles, process.env.role);
    if (rolecheck === "" || rolecheck === "error") {
      console.error("API--LAMBDA--POSTGRESQL--FAILED: Denied due to lack of role");
      callback(null, {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
        body: "Access denied. Insufficient permissions to view any patients details.",
      });
      return;
    }

    const cohort = event["queryStringParameters"]["cohort"];
    let query = process.env.queryString + ` ` + rolecheck + cohortClause(cohort);
    const orderString = process.env.orderString || "";
    if (orderString) query += " ORDER BY " + orderString;
    PGLib.functions.getByQuery(PGLib.lib, query, (error: any, result: any) => {
      if (error) {
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
          body: "Could not reach Database.",
        });
        return;
      }
      const response = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(result),
      };
      callback(null, response);
    });
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

const exclusions = ["FCntDimension", "LCntDimension", "numberSelFlag", "numberSelLtc", "DDimension", "MDimension"];
const nonestatement = `M.asthma IS NOT TRUE AND M.chd IS NOT TRUE AND M.heart_failure IS NOT TRUE AND M.cancer IS NOT TRUE AND M.copd IS NOT TRUE AND
M.depression IS NOT TRUE AND M.diabetes IS NOT TRUE AND M.hypertension IS NOT TRUE AND M.atrial_fibrillation IS NOT TRUE AND
M.ckd IS NOT TRUE AND M.dementia IS NOT TRUE AND M.epilepsy IS NOT TRUE AND M.hypothyroid IS NOT TRUE AND M.mental_health IS NOT TRUE AND
M.learning_disabilities IS NOT TRUE AND M.osteoporosis IS NOT TRUE AND M.pad IS NOT TRUE AND
M.rheumatoid_arthritis IS NOT TRUE AND M.stroke_tia IS NOT TRUE AND M.palliative_care_flag IS NOT TRUE AND M.psychotic_disorder_flag IS NOT TRUE AND
M.spl IS NOT TRUE AND M.chemo_radiotherapy IS NOT TRUE AND M.haematological_cancers IS NOT TRUE AND M.rare_diseases IS NOT TRUE AND M.respiratory IS NOT TRUE`;
const noneflagstatement = `D.other_shielded_category IS NULL AND D.assisted_collection IS NULL AND D.home_care_link IS NOT TRUE AND
D.single_occupancy IS NULL AND D.disabled_facilities_grant IS NOT TRUE AND D.council_tax IS NULL AND D."neighbourhood_linked_to_PCN"
IS NOT TRUE AND D.universal_credit IS NOT TRUE AND D.housing_benefit IS NOT TRUE AND D.business_grant IS NOT TRUE`;

function cohortClause(cohorturl: any) {
  if (cohorturl === "" || cohorturl === null || cohorturl === "{}") {
    return "";
  } else {
    let statement = "";
    const ch = JSON.parse(cohorturl);
    const keys = Object.keys(ch);
    keys.forEach((k) => {
      if (exclusions.indexOf(k) === -1) statement += convertKeytoField(k) + convertValuetoSQL(k, ch[k]) + " AND ";
    });
    statement = statement.substr(0, statement.length - 4);
    return ` (` + statement + `) `;
  }
}

function convertKeytoField(dimensionName: any) {
  switch (dimensionName) {
    case "SexDimension":
      return `M.sex`;
      break;
    case "AgeDimension":
      return `M.age`;
      break;
    case "RskDimension":
      return `M.risk_score_int`;
      break;
    case "WDimension":
      return `M.electoral_ward_or_division`;
      break;
    case "GPDimension":
      return `M.gpp_code`;
      break;
    case "LDimension":
      return `M.pcn`;
      break;
    case "CCGDimension":
      return `M.ccg_code`;
      break;
    case "LTCs2Dimension":
    case "MatrixDimension":
    case "Flags2Dimension":
      return ``;
      break;
    default:
      return `"nhs_number"`;
  }
}

function convertValuetoSQL(dimensionName: any, value: any) {
  switch (dimensionName) {
    case "SexDimension":
    case "LDimension":
    case "GPDimension":
      if (value.length === 0) return " IS NOT NULL ";
      else if (value.length === 1) return ` = '` + value[0] + `'`;
      else {
        let list = ` in (`;
        value.forEach((element: any) => {
          list += `'` + element + `',`;
        });
        return list.substr(0, list.length - 1) + `)`;
      }
      break;
    case "WDimension":
    case "CCGDimension":
      if (value.length === 0) return " IS NOT NULL ";
      else if (value.length === 1) return ` = '` + value[0] + `'`;
      else {
        let list = ` in (`;
        value.forEach((element: any) => {
          list += `'` + element + `',`;
        });
        return list.substr(0, list.length - 1) + `)`;
      }
      break;
    case "AgeDimension":
      return ` >= ` + value[0][0] + ` AND M.age <= ` + value[0][1];
      break;
    case "RskDimension":
      return ` >= ` + value[0][0] + ` AND M.risk_score_int <= ` + value[0][1];
      break;
    case "LTCs2Dimension":
      let noneflag = false;
      value.forEach((element: any) => {
        if (element[0] === "None") noneflag = true;
      });
      if (noneflag) {
        return "(" + nonestatement + ")";
      } else {
        let statement = " (";
        value.forEach((element: any) => {
          const lookup = LTCLookup.filter((x) => x.displayName === element[0]);
          if (lookup.length > 0) {
            statement += lookup[0].dbname + " IS TRUE AND ";
          } else {
            statement += element[0].toLowerCase().split(" ").join("_") + " IS TRUE AND ";
          }
        });
        return statement.substr(0, statement.length - 4) + `)`;
      }
      break;
    case "Flags2Dimension":
      let noneflag2 = false;
      value.forEach((element: any) => {
        if (element[0] === "None") noneflag2 = true;
      });
      if (noneflag2) {
        return "(" + noneflagstatement + ")";
      } else {
        let statement2 = " (";
        value.forEach((element: any) => {
          const lookup = FlagLookup.filter((x) => x.displayName === element[0]);
          if (lookup.length > 0) {
            statement2 += lookup[0].dbname + lookup[0].truth + " AND ";
          } else {
            statement2 += element[0].toLowerCase().split(" ").join("_") + " IS TRUE AND ";
          }
        });
        return statement2.substr(0, statement2.length - 4) + `)`;
      }
      break;
    case "MatrixDimension":
      let whereClause = "";
      value.forEach((valuePair: any, i: any) => {
        if (valuePair[0] && valuePair[1]) {
          whereClause += `covid_risk like '${valuePair[0]}' AND covid_vuln like '${valuePair[1]}'`;
          // Not the first pair and not the last do we add the `AND`
          if (value.length > 1 && i !== value.length - 1) {
            whereClause += ` AND `;
          }
        }
      });
      whereClause = ` (${whereClause}) `;
      return whereClause;
      break;
    default:
      return " = '0000000000'";
  }
}

const LTCLookup = [
  { dbname: "chd", displayName: "Coronary Artery Disease" },
  { dbname: "heart_failure", displayName: "Congestive Heart Failure" },
  { dbname: "ckd", displayName: "Chronic Kidney Disease" },
  { dbname: "pad", displayName: "Peripheral Artery Disease" },
];

const FlagLookup = [
  { dbname: "D.other_shielded_category", displayName: "District Shielded", truth: " = 1" },
  { dbname: "D.assisted_collection", displayName: "Assisted Bin Collection", truth: " = 'Y'" },
  { dbname: "D.home_care_link", displayName: "Home Care Link", truth: " IS TRUE" },
  { dbname: "D.single_occupancy", displayName: "Single Occupancy", truth: " = 'Y'" },
  { dbname: "D.disabled_facilities_grant", displayName: "Disabled Facilities Grant", truth: " IS TRUE" },
  { dbname: "D.council_tax", displayName: "Council Tax", truth: " = 'Y'" },
  { dbname: 'D."neighbourhood_linked_to_PCN"', displayName: "Neighbourhood Linked to PCN", truth: " IS TRUE" },
  { dbname: "D.universal_credit", displayName: "Universal Credit", truth: " IS TRUE" },
  { dbname: "D.housing_benefit", displayName: "Housing Benefit", truth: " IS TRUE" },
  { dbname: "D.business_grant", displayName: "Business Grant", truth: " IS TRUE" },
];

export const _SQLSettings: LambdaPGInfo[] = [
  {
    name: "cdk-api-postgresql-Outbreak",
    filename: "postgresql",
    functions: [
      {
        method: "mapinfo",
        handlermethod: "getByQueryString",
        methodType: "GET",
        queryString: `SELECT 'FeatureCollection' AS TYPE, array_to_json(array_agg(f)) AS features FROM ( SELECT 'Feature' AS TYPE, ST_AsGeoJSON (lg.geom, 4)::json AS geometry, row_to_json(row(id, "time", lat, lng, tme, optim_var), true) AS properties FROM public.isochrone_outbreak AS lg) AS f`,
        params: [],
      },
    ],
    baseendpoint: "outbreak",
  },
  {
    name: "cdk-api-postgresql-GPPractices",
    filename: "gppractices",
    functions: [
      {
        method: "getAll",
        methodType: "GET",
        handlermethod: "getGeoJson",
        queryString: "",
        params: {
          tablename: "public.gps",
          st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
          as_properties: `(select row_to_json(_) AS properties from (select lg.organisation_code AS "Code",
          lg.name AS "Name",
          ST_X(lg.geom) AS "Long",
          ST_Y(lg.geom) AS "Lat") as _)
          --row_to_json((organisation_code, name), true) AS properties`,
          whereclause: "WHERE lg.ccg in ('00Q', '00R', '00X', '01A', '01E', '01K', '02G', '02M') AND (LEFT(lg.organisation_code,1) != 'Y') OR lg.organisation_code='Y01008'",
        },
      },
    ],
    baseendpoint: "gppractices",
    customAuth: "public",
  },
  // {
  //   name: "cdk-api-postgresql-HouseholdIsochrone",
  //   filename: "postgresql",
  //   functions: [
  //     {
  //       method: "getHousesWithinIsochrone",
  //       methodType: "POST",
  //       handlermethod: "getIsoChrone",
  //       queryString: "",
  //       params: [],
  //     },
  //   ],
  //   baseendpoint: "isochrone",
  // },
  // {
  //   name: "cdk-api-postgresql-Boundaries",
  //   filename: "orgboundaries",
  //   baseendpoint: "orgboundaries",
  //   functions: [
  //     {
  //       method: "getTopoJSON",
  //       methodType: "GET",
  //       handlermethod: "getGeoJson",
  //       queryString: "",
  //       params: {
  //         tablename: "public.icps",
  //         st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
  //         as_properties: `(select row_to_json(_) AS properties from (select lg.icp AS "ICP") as _)
  //         --row_to_json((organisation_code, name), true) AS properties`,
  //       },
  //     },
  //   ],
  // },
  // {
  //   name: "cdk-api-postgresql-PCNInformation",
  //   filename: "postgresql",
  //   baseendpoint: "pcninformation",
  //   functions: [
  //     {
  //       method: "getTopoJSON",
  //       methodType: "GET",
  //       handlermethod: "getGeoJson",
  //       queryString: "",
  //       params: {
  //         tablename: "public.icps",
  //         st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
  //         as_properties: `(select row_to_json(_) AS properties from (select lg.icp AS "ICP") as _) --row_to_json((organisation_code, name), true) AS properties`,
  //       },
  //     },
  //     {
  //       method: "getHexGeojson",
  //       methodType: "GET",
  //       handlermethod: "getGeoJson",
  //       queryString: "",
  //       params: {
  //         tablename: "public.pcn_hex_geo",
  //         st_asgeojson: "lg.geom",
  //         as_properties: `(select row_to_json(_) AS properties from (select id, pcn) as _)`,
  //       },
  //     },
  //     {
  //       method: "getData",
  //       handlermethod: "getAll",
  //       methodType: "GET",
  //       queryString: `public.mosaicpcn`,
  //       params: [],
  //     },
  //   ],
  // },
  // {
  //   name: "cdk-api-postgresql-Wards",
  //   filename: "wards",
  //   baseendpoint: "wards",
  //   functions: [
  //     {
  //       method: "getAll",
  //       methodType: "GET",
  //       handlermethod: "getGeoJson",
  //       queryString: "",
  //       params: {
  //         tablename: "public.wards",
  //         st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
  //         as_properties: `(select row_to_json(_) AS properties from (select st_areasha, st_lengths, objectid, lad15nm, lad15cd, wd15nmw, wd15nm, wd15cd) as _) --row_to_json((organisation_code, name), true) AS properties`,
  //       },
  //     },
  //   ],
  // },
  // {
  //   name: "cdk-api-postgresql-GrandIndex",
  //   filename: "postgresql",
  //   baseendpoint: "grandindex",
  //   functions: [
  //     {
  //       method: "getAll",
  //       methodType: "GET",
  //       handlermethod: "getByQueryString",
  //       queryString: grandIndexQuery,
  //       params: [],
  //     },
  //   ],
  // },
  // {
  //   name: "cdk-api-postgresql-PostCodes",
  //   filename: "postgresql",
  //   baseendpoint: "postcodes",
  //   functions: [
  //     {
  //       method: "getAll",
  //       methodType: "GET",
  //       handlermethod: "getByQueryString",
  //       queryString: `SELECT 'FeatureCollection' AS TYPE, array_to_json(array_agg(f)) AS features
  //       FROM ( SELECT 'Feature' AS TYPE, ST_AsGeoJSON (ST_Simplify (lg.geom, 0.0001, TRUE), 4)::json AS geometry, row_to_json(row(mostype, pop), true) AS properties
  //       FROM mosaicpostcode AS lg ) AS f`,
  //       params: [],
  //     },
  //   ],
  // },
  // {
  //   name: "cdk-api-postgresql-PatientDemographics",
  //   filename: "postgresql",
  //   baseendpoint: "demographics",
  //   functions: [
  //     {
  //       method: "demographicsbynhsnumber",
  //       methodType: "GET",
  //       handlermethod: "getByRoleQueryAndCondition",
  //       queryString: `SELECT sex AS Gender, nhs_number AS NHSNumber, address_line_1 AS AddressLine1, address_line_2 AS AddressLine2, address_line_3 AS AddressLine3, address_line_4 AS AddressLine4, address_line_5 AS AddressLine5, postcode AS PostCode, title AS Title, forename AS Forename, other_forenames AS OtherForenames, surname AS Surname, date_of_birth AS DOB FROM public.population_master`,
  //       params: ["nhs_number"],
  //       role: "population",
  //     },
  //     {
  //       method: "validateNHSNumber",
  //       methodType: "POST",
  //       handlermethod: "validateExists",
  //       queryString: `SELECT nhs_number, date_of_birth FROM public.population_master`,
  //       params: ["nhs_number", "date_of_birth"],
  //       role: "population",
  //     },
  //     {
  //       method: "findMyNHSNumber",
  //       methodType: "POST",
  //       handlermethod: "validateExists",
  //       queryString: `SELECT nhs_number FROM public.population_master`,
  //       params: ["sex", "date_of_birth", "postcode", "forename"],
  //     },
  //   ],
  // },
];

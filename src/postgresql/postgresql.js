"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._SQLSettings = void 0;
const grandindexquery_1 = require("./grandindexquery");
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
module.exports.getByQueryString = (event, context, callback) => {
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
        PGLib.functions.getByQuery(PGLib.lib, process.env.queryString, (error, result) => {
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
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
};
module.exports.getByRoleQueryString = (event, context, callback) => {
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
        if (orderString)
            query += " ORDER BY " + orderString;
        PGLib.functions.getByQuery(PGLib.lib, query, (error, result) => {
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
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
};
module.exports.validateExists = (event, context, callback) => {
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
        const conditions = JSON.parse(process.env.params) || [];
        let conditionlist = "";
        conditions.forEach((conditionName) => {
            conditionlist = +` AND "` + conditionName + `" = '` + event["queryStringParameters"][conditionName] + `'`;
        });
        let query = process.env.queryString + ` ` + rolecheck + conditionlist;
        const orderString = process.env.orderString || "";
        if (orderString)
            query += " ORDER BY " + orderString;
        PGLib.functions.getByQuery(PGLib.lib, query, (error, result) => {
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
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
};
module.exports.update = (event, context, callback) => {
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
        const conditionName = JSON.parse(process.env.params)[0] || "ERROR";
        const x = buildUpdateList(JSON.parse(event.body));
        const query = "UPDATE " + process.env.queryString + " SET " + x + " WHERE " + conditionName `= '` + event["queryStringParameters"][conditionName] + `'`;
        PGLib.functions.getByQuery(PGLib.lib, query, (error, result) => {
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
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
};
function buildUpdateList(updateArray) {
    let output = "";
    const keys = Object.keys(updateArray);
    keys.forEach((key) => {
        output += "SET " + key + clearedValue(updateArray[key]) + " ";
    });
    return output;
}
function clearedValue(value) {
    if (value === "NULL")
        return "IS NULL";
    else if (value === "CURRENT_TIMESTAMP")
        return " = CURRENT_TIMESTAMP";
    else {
        return " ='" + value + "'";
    }
}
module.exports.getByRoleQueryAndCondition = (event, context, callback) => {
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
        const conditionName = JSON.parse(process.env.params)[0] || "ERROR";
        let query = process.env.queryString + ` ` + rolecheck + ` AND "` + conditionName + `" = '` + event["queryStringParameters"][conditionName] + `'`;
        const orderString = process.env.orderString || "";
        if (orderString)
            query += " ORDER BY " + orderString;
        PGLib.functions.getByQuery(PGLib.lib, query, (error, result) => {
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
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
};
function decodetoken(authorizationHeader) {
    const jwtonly = authorizationHeader.replace("JWT ", "");
    try {
        const decoded = jwt.decode(jwtonly);
        return decoded;
    }
    catch (ex) {
        console.log("AUTHORIZATION--AUTHORIZER--TOKENVERIFICATION--ERROR: " + jwtonly);
        return { roles: [] };
    }
}
function checkRole(alone, userroles, table) {
    let whereclause = "";
    if (userroles.length > 0) {
        userroles.forEach((role) => {
            const item = JSON.stringify(role);
            const keys = Object.keys(role);
            if (item.includes(table + "_")) {
                if (keys.length > 1) {
                    let current = null;
                    whereclause += "(";
                    keys.forEach((k) => {
                        if (k.includes(table + "_")) {
                            current = k.replace(table + "_", "");
                            whereclause += k.replace(table + "_", "") + " like '" + role[k] + "' AND ";
                        }
                        else {
                            whereclause += current + " like '" + role[k] + "' AND ";
                        }
                    });
                    whereclause = whereclause.substr(0, whereclause.length - 4);
                    whereclause += ") OR ";
                }
                else {
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
        }
        else {
            whereclause = "(" + whereclause + ") AND ";
        }
    }
    return whereclause;
}
module.exports.getGeoJson = (event, context, callback) => {
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
        PGLib.functions.getGeoJson(PGLib.lib, payload, (error, result) => {
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
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
};
module.exports.getIsoChrone = (event, context, callback) => {
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
        PGLib.functions.getIsoChrone(PGLib.lib, payload, (error, result) => {
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
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
};
module.exports.getAll = (event, context, callback) => {
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
        PGLib.functions.getAll(PGLib.lib, process.env.queryString, (error, result) => {
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
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--POSTGRESQL--ERROR: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
};
module.exports.getByRoleQueryAndCohort = (event, context, callback) => {
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
        if (orderString)
            query += " ORDER BY " + orderString;
        PGLib.functions.getByQuery(PGLib.lib, query, (error, result) => {
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
    }
    catch (error) {
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
function cohortClause(cohorturl) {
    if (cohorturl === "" || cohorturl === null || cohorturl === "{}") {
        return "";
    }
    else {
        let statement = "";
        const ch = JSON.parse(cohorturl);
        const keys = Object.keys(ch);
        keys.forEach((k) => {
            if (exclusions.indexOf(k) === -1)
                statement += convertKeytoField(k) + convertValuetoSQL(k, ch[k]) + " AND ";
        });
        statement = statement.substr(0, statement.length - 4);
        return ` (` + statement + `) `;
    }
}
function convertKeytoField(dimensionName) {
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
function convertValuetoSQL(dimensionName, value) {
    switch (dimensionName) {
        case "SexDimension":
        case "LDimension":
        case "GPDimension":
            if (value.length === 0)
                return " IS NOT NULL ";
            else if (value.length === 1)
                return ` = '` + value[0] + `'`;
            else {
                let list = ` in (`;
                value.forEach((element) => {
                    list += `'` + element + `',`;
                });
                return list.substr(0, list.length - 1) + `)`;
            }
            break;
        case "WDimension":
        case "CCGDimension":
            if (value.length === 0)
                return " IS NOT NULL ";
            else if (value.length === 1)
                return ` = '` + value[0] + `'`;
            else {
                let list = ` in (`;
                value.forEach((element) => {
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
            value.forEach((element) => {
                if (element[0] === "None")
                    noneflag = true;
            });
            if (noneflag) {
                return "(" + nonestatement + ")";
            }
            else {
                let statement = " (";
                value.forEach((element) => {
                    const lookup = LTCLookup.filter((x) => x.displayName === element[0]);
                    if (lookup.length > 0) {
                        statement += lookup[0].dbname + " IS TRUE AND ";
                    }
                    else {
                        statement += element[0].toLowerCase().split(" ").join("_") + " IS TRUE AND ";
                    }
                });
                return statement.substr(0, statement.length - 4) + `)`;
            }
            break;
        case "Flags2Dimension":
            let noneflag2 = false;
            value.forEach((element) => {
                if (element[0] === "None")
                    noneflag2 = true;
            });
            if (noneflag2) {
                return "(" + noneflagstatement + ")";
            }
            else {
                let statement2 = " (";
                value.forEach((element) => {
                    const lookup = FlagLookup.filter((x) => x.displayName === element[0]);
                    if (lookup.length > 0) {
                        statement2 += lookup[0].dbname + lookup[0].truth + " AND ";
                    }
                    else {
                        statement2 += element[0].toLowerCase().split(" ").join("_") + " IS TRUE AND ";
                    }
                });
                return statement2.substr(0, statement2.length - 4) + `)`;
            }
            break;
        case "MatrixDimension":
            let whereClause = "";
            value.forEach((valuePair, i) => {
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
exports._SQLSettings = [
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
    {
        name: "cdk-api-postgresql-HouseholdIsochrone",
        filename: "postgresql",
        functions: [
            {
                method: "getHousesWithinIsochrone",
                methodType: "POST",
                handlermethod: "getIsoChrone",
                queryString: "",
                params: [],
            },
        ],
        baseendpoint: "isochrone",
    },
    {
        name: "cdk-api-postgresql-Boundaries",
        filename: "orgboundaries",
        baseendpoint: "orgboundaries",
        functions: [
            {
                method: "getTopoJSON",
                methodType: "GET",
                handlermethod: "getGeoJson",
                queryString: "",
                params: {
                    tablename: "public.icps",
                    st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
                    as_properties: `(select row_to_json(_) AS properties from (select lg.icp AS "ICP") as _)
          --row_to_json((organisation_code, name), true) AS properties`,
                },
            },
        ],
    },
    {
        name: "cdk-api-postgresql-PCNInformation",
        filename: "postgresql",
        baseendpoint: "pcninformation",
        functions: [
            {
                method: "getTopoJSON",
                methodType: "GET",
                handlermethod: "getGeoJson",
                queryString: "",
                params: {
                    tablename: "public.icps",
                    st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
                    as_properties: `(select row_to_json(_) AS properties from (select lg.icp AS "ICP") as _) --row_to_json((organisation_code, name), true) AS properties`,
                },
            },
            {
                method: "getHexGeojson",
                methodType: "GET",
                handlermethod: "getGeoJson",
                queryString: "",
                params: {
                    tablename: "public.pcn_hex_geo",
                    st_asgeojson: "lg.geom",
                    as_properties: `(select row_to_json(_) AS properties from (select id, pcn) as _)`,
                },
            },
            {
                method: "getData",
                handlermethod: "getAll",
                methodType: "GET",
                queryString: `public.mosaicpcn`,
                params: [],
            },
        ],
    },
    {
        name: "cdk-api-postgresql-Wards",
        filename: "wards",
        baseendpoint: "wards",
        functions: [
            {
                method: "getAll",
                methodType: "GET",
                handlermethod: "getGeoJson",
                queryString: "",
                params: {
                    tablename: "public.wards",
                    st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
                    as_properties: `(select row_to_json(_) AS properties from (select st_areasha, st_lengths, objectid, lad15nm, lad15cd, wd15nmw, wd15nm, wd15cd) as _) --row_to_json((organisation_code, name), true) AS properties`,
                },
            },
        ],
    },
    {
        name: "cdk-api-postgresql-GrandIndex",
        filename: "postgresql",
        baseendpoint: "grandindex",
        functions: [
            {
                method: "getAll",
                methodType: "GET",
                handlermethod: "getByQueryString",
                queryString: grandindexquery_1.grandIndexQuery,
                params: [],
            },
        ],
    },
    {
        name: "cdk-api-postgresql-PostCodes",
        filename: "postgresql",
        baseendpoint: "postcodes",
        functions: [
            {
                method: "getAll",
                methodType: "GET",
                handlermethod: "getByQueryString",
                queryString: `SELECT 'FeatureCollection' AS TYPE, array_to_json(array_agg(f)) AS features
        FROM ( SELECT 'Feature' AS TYPE, ST_AsGeoJSON (ST_Simplify (lg.geom, 0.0001, TRUE), 4)::json AS geometry, row_to_json(row(mostype, pop), true) AS properties
        FROM mosaicpostcode AS lg ) AS f`,
                params: [],
            },
        ],
    },
    {
        name: "cdk-api-postgresql-PatientDemographics",
        filename: "postgresql",
        baseendpoint: "demographics",
        functions: [
            {
                method: "demographicsbynhsnumber",
                methodType: "GET",
                handlermethod: "getByRoleQueryAndCondition",
                queryString: `SELECT sex AS Gender, nhs_number AS NHSNumber, address_line_1 AS AddressLine1, address_line_2 AS AddressLine2, address_line_3 AS AddressLine3, address_line_4 AS AddressLine4, address_line_5 AS AddressLine5, postcode AS PostCode, title AS Title, forename AS Forename, other_forenames AS OtherForenames, surname AS Surname, date_of_birth AS DOB FROM public.population_master`,
                params: ["nhs_number"],
                role: "population",
            },
            {
                method: "validateNHSNumber",
                methodType: "POST",
                handlermethod: "validateExists",
                queryString: `SELECT nhs_number, date_of_birth FROM public.population_master`,
                params: ["nhs_number", "date_of_birth"],
                role: "population",
            },
            {
                method: "findMyNHSNumber",
                methodType: "POST",
                handlermethod: "validateExists",
                queryString: `SELECT nhs_number FROM public.population_master`,
                params: ["sex", "date_of_birth", "postcode", "forename"],
            },
        ],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGdyZXNxbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBvc3RncmVzcWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsdURBQW9EO0FBRXBELE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUVwQyxNQUFNLE1BQU0sR0FBRztJQUNiLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVU7SUFDbEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTTtJQUMxQixXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXO0lBQ3BDLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVc7Q0FDckMsQ0FBQztBQUNGLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDbkUsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQyxNQUFNLEtBQUssR0FBRyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDO0FBRXpELE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxLQUFVLEVBQUUsT0FBWSxFQUFFLFFBQWEsRUFBRSxFQUFFO0lBQzVFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRTtRQUM1QixPQUFPLENBQUMsS0FBSyxDQUFDLDREQUE0RCxDQUFDLENBQUM7UUFDNUUsUUFBUSxDQUFDLElBQUksRUFBRTtZQUNiLFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFLEVBQUUsNkJBQTZCLEVBQUUsR0FBRyxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUU7WUFDN0UsSUFBSSxFQUFFLCtCQUErQjtTQUN0QyxDQUFDLENBQUM7UUFDSCxPQUFPO0tBQ1I7SUFDRCxJQUFJO1FBQ0YsS0FB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Q0Y7SUFDRDtRQUNFLElBQUksRUFBRSx3Q0FBd0M7UUFDOUMsUUFBUSxFQUFFLFlBQVk7UUFDdEIsWUFBWSxFQUFFLGNBQWM7UUFDNUIsU0FBUyxFQUFFO1lBQ1Q7Z0JBQ0UsTUFBTSxFQUFFLHlCQUF5QjtnQkFDakMsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLGFBQWEsRUFBRSw0QkFBNEI7Z0JBQzNDLFdBQVcsRUFBRSxzWEFBc1g7Z0JBQ25ZLE1BQU0sRUFBRSxDQUFDLFlBQVksQ0FBQztnQkFDdEIsSUFBSSxFQUFFLFlBQVk7YUFDbkI7WUFDRDtnQkFDRSxNQUFNLEVBQUUsbUJBQW1CO2dCQUMzQixVQUFVLEVBQUUsTUFBTTtnQkFDbEIsYUFBYSxFQUFFLGdCQUFnQjtnQkFDL0IsV0FBVyxFQUFFLGdFQUFnRTtnQkFDN0UsTUFBTSxFQUFFLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQztnQkFDdkMsSUFBSSxFQUFFLFlBQVk7YUFDbkI7WUFDRDtnQkFDRSxNQUFNLEVBQUUsaUJBQWlCO2dCQUN6QixVQUFVLEVBQUUsTUFBTTtnQkFDbEIsYUFBYSxFQUFFLGdCQUFnQjtnQkFDL0IsV0FBVyxFQUFFLGlEQUFpRDtnQkFDOUQsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDO2FBQ3pEO1NBQ0Y7S0FDRjtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMYW1iZGFQR0luZm8gfSBmcm9tIFwiLi4vLi4vbGliL3R5cGVzL2ludGVyZmFjZXNcIjtcclxuaW1wb3J0IHsgZ3JhbmRJbmRleFF1ZXJ5IH0gZnJvbSBcIi4vZ3JhbmRpbmRleHF1ZXJ5XCI7XHJcblxyXG5jb25zdCBqd3QgPSByZXF1aXJlKFwianNvbndlYnRva2VuXCIpO1xyXG5cclxuY29uc3QgY29uZmlnID0ge1xyXG4gIHBnZGF0YWJhc2U6IHByb2Nlc3MuZW52LlBHREFUQUJBU0UsXHJcbiAgcGdwb3J0OiBwcm9jZXNzLmVudi5QR1BPUlQsXHJcbiAgcG9zdGdyZXNfdW46IHByb2Nlc3MuZW52LlBPU1RHUkVTX1VOLFxyXG4gIHBvc3RncmVzX3B3OiBwcm9jZXNzLmVudi5QT1NUR1JFU19QVyxcclxufTtcclxuY29uc3QgUG9zdGdyZXNJID0gcmVxdWlyZShcImRpdS1kYXRhLWZ1bmN0aW9uc1wiKS5NZXRob2RzLlBvc3RncmVzcWw7XHJcbmNvbnN0IFBHQ29uc3RydWN0ID0gUG9zdGdyZXNJLmluaXQoY29uZmlnKTtcclxuY29uc3QgUEdMaWIgPSB7IGxpYjogUEdDb25zdHJ1Y3QsIGZ1bmN0aW9uczogUG9zdGdyZXNJIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5nZXRCeVF1ZXJ5U3RyaW5nID0gKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkgPT4ge1xyXG4gIGlmICghcHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IEJhZCBzZXR1cCwgbm8gcXVlcnlTdHJpbmcuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFF1ZXJ5IG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgUEdMaWIuZnVuY3Rpb25zLmdldEJ5UXVlcnkoUEdMaWIubGliLCBwcm9jZXNzLmVudi5xdWVyeVN0cmluZywgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICAgIGJvZHk6IFwiQ291bGQgbm90IHJlYWNoIERhdGFiYXNlLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdCksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICB2YXIgYm9keSA9IEpTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5nZXRCeVJvbGVRdWVyeVN0cmluZyA9IChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpID0+IHtcclxuICBpZiAoIXByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nIHx8ICghcHJvY2Vzcy5lbnYucm9sZSAmJiBwcm9jZXNzLmVudi5yb2xlICE9PSBcIlwiKSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogQmFkIHNldHVwLCBubyBxdWVyeVN0cmluZyBvciByb2xlLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBRdWVyeSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGRlY29kZXRva2VuKGV2ZW50LmhlYWRlcnMuQXV0aG9yaXphdGlvbiB8fCBldmVudC5oZWFkZXJzLmF1dGhvcml6YXRpb24pO1xyXG4gICAgY29uc3QgdXNlcnJvbGVzID0gZGVjb2RlZFRva2VuW1wicm9sZXNcIl0gfHwgW107XHJcbiAgICBjb25zdCByb2xlY2hlY2sgPSBjaGVja1JvbGUodHJ1ZSwgdXNlcnJvbGVzLCBwcm9jZXNzLmVudi5yb2xlKTtcclxuICAgIGlmIChyb2xlY2hlY2sgPT09IFwiXCIgfHwgcm9sZWNoZWNrID09PSBcImVycm9yXCIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1GQUlMRUQ6IERlbmllZCBkdWUgdG8gbGFjayBvZiByb2xlXCIpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogNDAxLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgYm9keTogXCJBY2Nlc3MgZGVuaWVkLiBJbnN1ZmZpY2llbnQgcGVybWlzc2lvbnMgdG8gdmlldyBhbnkgcGF0aWVudHMgZGV0YWlscy5cIixcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGxldCBxdWVyeSA9IHByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nICsgXCIgXCIgKyByb2xlY2hlY2s7XHJcbiAgICBjb25zdCBvcmRlclN0cmluZyA9IHByb2Nlc3MuZW52Lm9yZGVyU3RyaW5nIHx8IFwiXCI7XHJcbiAgICBpZiAob3JkZXJTdHJpbmcpIHF1ZXJ5ICs9IFwiIE9SREVSIEJZIFwiICsgb3JkZXJTdHJpbmc7XHJcbiAgICBQR0xpYi5mdW5jdGlvbnMuZ2V0QnlRdWVyeShQR0xpYi5saWIsIHF1ZXJ5LCAoZXJyb3I6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgICAgYm9keTogXCJDb3VsZCBub3QgcmVhY2ggRGF0YWJhc2UuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0KSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHZhciBib2R5ID0gSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpO1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogXCIgKyBKU09OLnN0cmluZ2lmeShib2R5KSk7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzLnZhbGlkYXRlRXhpc3RzID0gKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkgPT4ge1xyXG4gIGlmICghcHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcgfHwgKCFwcm9jZXNzLmVudi5yb2xlICYmIHByb2Nlc3MuZW52LnJvbGUgIT09IFwiXCIpKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBCYWQgc2V0dXAsIG5vIHF1ZXJ5U3RyaW5nIG9yIHJvbGUuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFF1ZXJ5IG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgZGVjb2RlZFRva2VuID0gZGVjb2RldG9rZW4oZXZlbnQuaGVhZGVycy5BdXRob3JpemF0aW9uIHx8IGV2ZW50LmhlYWRlcnMuYXV0aG9yaXphdGlvbik7XHJcbiAgICBjb25zdCB1c2Vycm9sZXMgPSBkZWNvZGVkVG9rZW5bXCJyb2xlc1wiXSB8fCBbXTtcclxuICAgIGxldCBpbmNsdWRlc3doZXJlID0gZmFsc2U7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcuaW5jbHVkZXMoXCJXSEVSRVwiKSkge1xyXG4gICAgICBpbmNsdWRlc3doZXJlID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJvbGVjaGVjayA9IGNoZWNrUm9sZSghaW5jbHVkZXN3aGVyZSwgdXNlcnJvbGVzLCBwcm9jZXNzLmVudi5yb2xlKTtcclxuICAgIGlmIChyb2xlY2hlY2sgPT09IFwiXCIgfHwgcm9sZWNoZWNrID09PSBcImVycm9yXCIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1GQUlMRUQ6IERlbmllZCBkdWUgdG8gbGFjayBvZiByb2xlXCIpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogNDAxLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgYm9keTogXCJBY2Nlc3MgZGVuaWVkLiBJbnN1ZmZpY2llbnQgcGVybWlzc2lvbnMgdG8gdmlldyBhbnkgcGF0aWVudHMgZGV0YWlscy5cIixcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IGNvbmRpdGlvbnMgPSBKU09OLnBhcnNlKHByb2Nlc3MuZW52LnBhcmFtcyEpIHx8IFtdO1xyXG4gICAgbGV0IGNvbmRpdGlvbmxpc3QgPSBcIlwiO1xyXG4gICAgY29uZGl0aW9ucy5mb3JFYWNoKChjb25kaXRpb25OYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgY29uZGl0aW9ubGlzdCA9ICtgIEFORCBcImAgKyBjb25kaXRpb25OYW1lICsgYFwiID0gJ2AgKyBldmVudFtcInF1ZXJ5U3RyaW5nUGFyYW1ldGVyc1wiXVtjb25kaXRpb25OYW1lXSArIGAnYDtcclxuICAgIH0pO1xyXG4gICAgbGV0IHF1ZXJ5ID0gcHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcgKyBgIGAgKyByb2xlY2hlY2sgKyBjb25kaXRpb25saXN0O1xyXG4gICAgY29uc3Qgb3JkZXJTdHJpbmcgPSBwcm9jZXNzLmVudi5vcmRlclN0cmluZyB8fCBcIlwiO1xyXG4gICAgaWYgKG9yZGVyU3RyaW5nKSBxdWVyeSArPSBcIiBPUkRFUiBCWSBcIiArIG9yZGVyU3RyaW5nO1xyXG4gICAgUEdMaWIuZnVuY3Rpb25zLmdldEJ5UXVlcnkoUEdMaWIubGliLCBxdWVyeSwgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICAgIGJvZHk6IFwiQ291bGQgbm90IHJlYWNoIERhdGFiYXNlLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdCksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICB2YXIgYm9keSA9IEpTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cy51cGRhdGUgPSAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSA9PiB7XHJcbiAgaWYgKCFwcm9jZXNzLmVudi5xdWVyeVN0cmluZykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogQmFkIHNldHVwLCBubyBxdWVyeVN0cmluZy5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gUXVlcnkgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjb25kaXRpb25OYW1lID0gSlNPTi5wYXJzZShwcm9jZXNzLmVudi5wYXJhbXMhKVswXSB8fCBcIkVSUk9SXCI7XHJcbiAgICBjb25zdCB4ID0gYnVpbGRVcGRhdGVMaXN0KEpTT04ucGFyc2UoZXZlbnQuYm9keSkpO1xyXG4gICAgY29uc3QgcXVlcnkgPSBcIlVQREFURSBcIiArIHByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nICsgXCIgU0VUIFwiICsgeCArIFwiIFdIRVJFIFwiICsgY29uZGl0aW9uTmFtZWA9ICdgICsgZXZlbnRbXCJxdWVyeVN0cmluZ1BhcmFtZXRlcnNcIl1bY29uZGl0aW9uTmFtZV0gKyBgJ2A7XHJcbiAgICBQR0xpYi5mdW5jdGlvbnMuZ2V0QnlRdWVyeShQR0xpYi5saWIsIHF1ZXJ5LCAoZXJyb3I6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgICAgYm9keTogXCJDb3VsZCBub3QgcmVhY2ggRGF0YWJhc2UuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0KSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHZhciBib2R5ID0gSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpO1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogXCIgKyBKU09OLnN0cmluZ2lmeShib2R5KSk7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGJ1aWxkVXBkYXRlTGlzdCh1cGRhdGVBcnJheTogYW55KSB7XHJcbiAgbGV0IG91dHB1dCA9IFwiXCI7XHJcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHVwZGF0ZUFycmF5KTtcclxuICBrZXlzLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XHJcbiAgICBvdXRwdXQgKz0gXCJTRVQgXCIgKyBrZXkgKyBjbGVhcmVkVmFsdWUodXBkYXRlQXJyYXlba2V5XSkgKyBcIiBcIjtcclxuICB9KTtcclxuICByZXR1cm4gb3V0cHV0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbGVhcmVkVmFsdWUodmFsdWU6IHN0cmluZykge1xyXG4gIGlmICh2YWx1ZSA9PT0gXCJOVUxMXCIpIHJldHVybiBcIklTIE5VTExcIjtcclxuICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJDVVJSRU5UX1RJTUVTVEFNUFwiKSByZXR1cm4gXCIgPSBDVVJSRU5UX1RJTUVTVEFNUFwiO1xyXG4gIGVsc2Uge1xyXG4gICAgcmV0dXJuIFwiID0nXCIgKyB2YWx1ZSArIFwiJ1wiO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0QnlSb2xlUXVlcnlBbmRDb25kaXRpb24gPSAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSA9PiB7XHJcbiAgaWYgKCFwcm9jZXNzLmVudi5xdWVyeVN0cmluZyB8fCAoIXByb2Nlc3MuZW52LnJvbGUgJiYgcHJvY2Vzcy5lbnYucm9sZSAhPT0gXCJcIikpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IEJhZCBzZXR1cCwgbm8gcXVlcnlTdHJpbmcgb3Igcm9sZS5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gUXVlcnkgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBkZWNvZGV0b2tlbihldmVudC5oZWFkZXJzLkF1dGhvcml6YXRpb24gfHwgZXZlbnQuaGVhZGVycy5hdXRob3JpemF0aW9uKTtcclxuICAgIGNvbnN0IHVzZXJyb2xlcyA9IGRlY29kZWRUb2tlbltcInJvbGVzXCJdIHx8IFtdO1xyXG4gICAgbGV0IGluY2x1ZGVzd2hlcmUgPSBmYWxzZTtcclxuICAgIGlmIChwcm9jZXNzLmVudi5xdWVyeVN0cmluZy5pbmNsdWRlcyhcIldIRVJFXCIpKSB7XHJcbiAgICAgIGluY2x1ZGVzd2hlcmUgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgcm9sZWNoZWNrID0gY2hlY2tSb2xlKCFpbmNsdWRlc3doZXJlLCB1c2Vycm9sZXMsIHByb2Nlc3MuZW52LnJvbGUpO1xyXG4gICAgaWYgKHJvbGVjaGVjayA9PT0gXCJcIiB8fCByb2xlY2hlY2sgPT09IFwiZXJyb3JcIikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUZBSUxFRDogRGVuaWVkIGR1ZSB0byBsYWNrIG9mIHJvbGVcIik7XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICBzdGF0dXNDb2RlOiA0MDEsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICBib2R5OiBcIkFjY2VzcyBkZW5pZWQuIEluc3VmZmljaWVudCBwZXJtaXNzaW9ucyB0byB2aWV3IGFueSBwYXRpZW50cyBkZXRhaWxzLlwiLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgY29uZGl0aW9uTmFtZSA9IEpTT04ucGFyc2UocHJvY2Vzcy5lbnYucGFyYW1zISlbMF0gfHwgXCJFUlJPUlwiO1xyXG4gICAgbGV0IHF1ZXJ5ID0gcHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcgKyBgIGAgKyByb2xlY2hlY2sgKyBgIEFORCBcImAgKyBjb25kaXRpb25OYW1lICsgYFwiID0gJ2AgKyBldmVudFtcInF1ZXJ5U3RyaW5nUGFyYW1ldGVyc1wiXVtjb25kaXRpb25OYW1lXSArIGAnYDtcclxuICAgIGNvbnN0IG9yZGVyU3RyaW5nID0gcHJvY2Vzcy5lbnYub3JkZXJTdHJpbmcgfHwgXCJcIjtcclxuICAgIGlmIChvcmRlclN0cmluZykgcXVlcnkgKz0gXCIgT1JERVIgQlkgXCIgKyBvcmRlclN0cmluZztcclxuICAgIFBHTGliLmZ1bmN0aW9ucy5nZXRCeVF1ZXJ5KFBHTGliLmxpYiwgcXVlcnksIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBcIkNvdWxkIG5vdCByZWFjaCBEYXRhYmFzZS5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQpLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgdmFyIGJvZHkgPSBKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMik7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gZGVjb2RldG9rZW4oYXV0aG9yaXphdGlvbkhlYWRlcjogc3RyaW5nKSB7XHJcbiAgY29uc3Qgand0b25seSA9IGF1dGhvcml6YXRpb25IZWFkZXIucmVwbGFjZShcIkpXVCBcIiwgXCJcIik7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRlY29kZWQgPSBqd3QuZGVjb2RlKGp3dG9ubHkpO1xyXG4gICAgcmV0dXJuIGRlY29kZWQ7XHJcbiAgfSBjYXRjaCAoZXgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiQVVUSE9SSVpBVElPTi0tQVVUSE9SSVpFUi0tVE9LRU5WRVJJRklDQVRJT04tLUVSUk9SOiBcIiArIGp3dG9ubHkpO1xyXG4gICAgcmV0dXJuIHsgcm9sZXM6IFtdIH07XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja1JvbGUoYWxvbmU6IGJvb2xlYW4sIHVzZXJyb2xlczogYW55LCB0YWJsZTogc3RyaW5nKSB7XHJcbiAgbGV0IHdoZXJlY2xhdXNlID0gXCJcIjtcclxuXHJcbiAgaWYgKHVzZXJyb2xlcy5sZW5ndGggPiAwKSB7XHJcbiAgICB1c2Vycm9sZXMuZm9yRWFjaCgocm9sZTogYW55KSA9PiB7XHJcbiAgICAgIGNvbnN0IGl0ZW0gPSBKU09OLnN0cmluZ2lmeShyb2xlKTtcclxuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHJvbGUpO1xyXG4gICAgICBpZiAoaXRlbS5pbmNsdWRlcyh0YWJsZSArIFwiX1wiKSkge1xyXG4gICAgICAgIGlmIChrZXlzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgIGxldCBjdXJyZW50OiBhbnkgPSBudWxsO1xyXG4gICAgICAgICAgd2hlcmVjbGF1c2UgKz0gXCIoXCI7XHJcbiAgICAgICAgICBrZXlzLmZvckVhY2goKGspID0+IHtcclxuICAgICAgICAgICAgaWYgKGsuaW5jbHVkZXModGFibGUgKyBcIl9cIikpIHtcclxuICAgICAgICAgICAgICBjdXJyZW50ID0gay5yZXBsYWNlKHRhYmxlICsgXCJfXCIsIFwiXCIpO1xyXG4gICAgICAgICAgICAgIHdoZXJlY2xhdXNlICs9IGsucmVwbGFjZSh0YWJsZSArIFwiX1wiLCBcIlwiKSArIFwiIGxpa2UgJ1wiICsgcm9sZVtrXSArIFwiJyBBTkQgXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgd2hlcmVjbGF1c2UgKz0gY3VycmVudCArIFwiIGxpa2UgJ1wiICsgcm9sZVtrXSArIFwiJyBBTkQgXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgd2hlcmVjbGF1c2UgPSB3aGVyZWNsYXVzZS5zdWJzdHIoMCwgd2hlcmVjbGF1c2UubGVuZ3RoIC0gNCk7XHJcbiAgICAgICAgICB3aGVyZWNsYXVzZSArPSBcIikgT1IgXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHdoZXJlY2xhdXNlICs9IGtleXNbMF0ucmVwbGFjZSh0YWJsZSArIFwiX1wiLCBcIlwiKSArIFwiIGxpa2UgJ1wiICsgcm9sZVtrZXlzWzBdXSArIFwiJ1wiO1xyXG4gICAgICAgICAgd2hlcmVjbGF1c2UgKz0gXCIgT1IgXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGlmICh3aGVyZWNsYXVzZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHdoZXJlY2xhdXNlID0gd2hlcmVjbGF1c2Uuc3Vic3RyKDAsIHdoZXJlY2xhdXNlLmxlbmd0aCAtIDQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKHdoZXJlY2xhdXNlLmxlbmd0aCA+IDApIHtcclxuICAgIGlmIChhbG9uZSkge1xyXG4gICAgICB3aGVyZWNsYXVzZSA9IFwiIFdIRVJFIFwiICsgd2hlcmVjbGF1c2U7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB3aGVyZWNsYXVzZSA9IFwiKFwiICsgd2hlcmVjbGF1c2UgKyBcIikgQU5EIFwiO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gd2hlcmVjbGF1c2U7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLmdldEdlb0pzb24gPSAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHBhcmFtcyA9IHByb2Nlc3MuZW52LnBhcmFtcyB8fCBcIlwiO1xyXG4gICAgY29uc3QgcGF5bG9hZCA9IEpTT04ucGFyc2UocGFyYW1zKTtcclxuICAgIGlmICghcHJvY2Vzcy5lbnYucGFyYW1zIHx8ICFwYXlsb2FkLnRhYmxlbmFtZSB8fCAhcGF5bG9hZC5zdF9hc2dlb2pzb24gfHwgIXBheWxvYWQuYXNfcHJvcGVydGllcykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1FUlJPUjogSW1wcm9wZXIgcGF5bG9hZDogXCIgKyBldmVudC5ib2R5KTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbXNnOiBcIkJhZCBSZXF1ZXN0LiBDb3VsZCBub3QgZmluZCBmdWxsIHBheWxvYWQgb2YgcmVxdWVzdC5cIiwgcGFyYW1zOiBldmVudCB9KSxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBQR0xpYi5mdW5jdGlvbnMuZ2V0R2VvSnNvbihQR0xpYi5saWIsIHBheWxvYWQsIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBcIkNvdWxkIG5vdCByZWFjaCBEYXRhYmFzZS5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQpLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgdmFyIGJvZHkgPSBKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMik7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0SXNvQ2hyb25lID0gKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwYXlsb2FkID0gZXZlbnQuYm9keTtcclxuICAgIGlmICghcGF5bG9hZC5xdWVyeSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1FUlJPUjogSW1wcm9wZXIgcGF5bG9hZDogXCIgKyBldmVudC5ib2R5KTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbXNnOiBcIkJhZCBSZXF1ZXN0LiBDb3VsZCBub3QgZmluZCBxdWVyeSBwYXJhbWV0ZXIuXCIsIHBhcmFtczogZXZlbnQgfSksXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgUEdMaWIuZnVuY3Rpb25zLmdldElzb0Nocm9uZShQR0xpYi5saWIsIHBheWxvYWQsIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBcIkNvdWxkIG5vdCByZWFjaCBEYXRhYmFzZS5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQpLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgdmFyIGJvZHkgPSBKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMik7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0QWxsID0gKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkgPT4ge1xyXG4gIGlmICghcHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IEJhZCBzZXR1cCwgbm8gcXVlcnlTdHJpbmcuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFRhYmxlbmFtZSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIFBHTGliLmZ1bmN0aW9ucy5nZXRBbGwoUEdMaWIubGliLCBwcm9jZXNzLmVudi5xdWVyeVN0cmluZywgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICAgIGJvZHk6IFwiQ291bGQgbm90IHJlYWNoIERhdGFiYXNlLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdCksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICB2YXIgYm9keSA9IEpTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5nZXRCeVJvbGVRdWVyeUFuZENvaG9ydCA9IChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpID0+IHtcclxuICBpZiAoIXByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nIHx8ICghcHJvY2Vzcy5lbnYucm9sZSAmJiBwcm9jZXNzLmVudi5yb2xlICE9PSBcIlwiKSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogQmFkIHNldHVwLCBubyBxdWVyeVN0cmluZyBvciByb2xlLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBRdWVyeSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGRlY29kZXRva2VuKGV2ZW50LmhlYWRlcnMuQXV0aG9yaXphdGlvbiB8fCBldmVudC5oZWFkZXJzLmF1dGhvcml6YXRpb24pO1xyXG4gICAgY29uc3QgdXNlcnJvbGVzID0gZGVjb2RlZFRva2VuW1wicm9sZXNcIl0gfHwgW107XHJcbiAgICBsZXQgaW5jbHVkZXN3aGVyZSA9IGZhbHNlO1xyXG4gICAgaWYgKHByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nLmluY2x1ZGVzKFwiV0hFUkVcIikpIHtcclxuICAgICAgaW5jbHVkZXN3aGVyZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBjb25zdCByb2xlY2hlY2sgPSBjaGVja1JvbGUoIWluY2x1ZGVzd2hlcmUsIHVzZXJyb2xlcywgcHJvY2Vzcy5lbnYucm9sZSk7XHJcbiAgICBpZiAocm9sZWNoZWNrID09PSBcIlwiIHx8IHJvbGVjaGVjayA9PT0gXCJlcnJvclwiKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRkFJTEVEOiBEZW5pZWQgZHVlIHRvIGxhY2sgb2Ygcm9sZVwiKTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMSxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgIGJvZHk6IFwiQWNjZXNzIGRlbmllZC4gSW5zdWZmaWNpZW50IHBlcm1pc3Npb25zIHRvIHZpZXcgYW55IHBhdGllbnRzIGRldGFpbHMuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29ob3J0ID0gZXZlbnRbXCJxdWVyeVN0cmluZ1BhcmFtZXRlcnNcIl1bXCJjb2hvcnRcIl07XHJcbiAgICBsZXQgcXVlcnkgPSBwcm9jZXNzLmVudi5xdWVyeVN0cmluZyArIGAgYCArIHJvbGVjaGVjayArIGNvaG9ydENsYXVzZShjb2hvcnQpO1xyXG4gICAgY29uc3Qgb3JkZXJTdHJpbmcgPSBwcm9jZXNzLmVudi5vcmRlclN0cmluZyB8fCBcIlwiO1xyXG4gICAgaWYgKG9yZGVyU3RyaW5nKSBxdWVyeSArPSBcIiBPUkRFUiBCWSBcIiArIG9yZGVyU3RyaW5nO1xyXG4gICAgUEdMaWIuZnVuY3Rpb25zLmdldEJ5UXVlcnkoUEdMaWIubGliLCBxdWVyeSwgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICAgIGJvZHk6IFwiQ291bGQgbm90IHJlYWNoIERhdGFiYXNlLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdCksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICB2YXIgYm9keSA9IEpTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5jb25zdCBleGNsdXNpb25zID0gW1wiRkNudERpbWVuc2lvblwiLCBcIkxDbnREaW1lbnNpb25cIiwgXCJudW1iZXJTZWxGbGFnXCIsIFwibnVtYmVyU2VsTHRjXCIsIFwiRERpbWVuc2lvblwiLCBcIk1EaW1lbnNpb25cIl07XHJcbmNvbnN0IG5vbmVzdGF0ZW1lbnQgPSBgTS5hc3RobWEgSVMgTk9UIFRSVUUgQU5EIE0uY2hkIElTIE5PVCBUUlVFIEFORCBNLmhlYXJ0X2ZhaWx1cmUgSVMgTk9UIFRSVUUgQU5EIE0uY2FuY2VyIElTIE5PVCBUUlVFIEFORCBNLmNvcGQgSVMgTk9UIFRSVUUgQU5EXHJcbk0uZGVwcmVzc2lvbiBJUyBOT1QgVFJVRSBBTkQgTS5kaWFiZXRlcyBJUyBOT1QgVFJVRSBBTkQgTS5oeXBlcnRlbnNpb24gSVMgTk9UIFRSVUUgQU5EIE0uYXRyaWFsX2ZpYnJpbGxhdGlvbiBJUyBOT1QgVFJVRSBBTkRcclxuTS5ja2QgSVMgTk9UIFRSVUUgQU5EIE0uZGVtZW50aWEgSVMgTk9UIFRSVUUgQU5EIE0uZXBpbGVwc3kgSVMgTk9UIFRSVUUgQU5EIE0uaHlwb3RoeXJvaWQgSVMgTk9UIFRSVUUgQU5EIE0ubWVudGFsX2hlYWx0aCBJUyBOT1QgVFJVRSBBTkRcclxuTS5sZWFybmluZ19kaXNhYmlsaXRpZXMgSVMgTk9UIFRSVUUgQU5EIE0ub3N0ZW9wb3Jvc2lzIElTIE5PVCBUUlVFIEFORCBNLnBhZCBJUyBOT1QgVFJVRSBBTkRcclxuTS5yaGV1bWF0b2lkX2FydGhyaXRpcyBJUyBOT1QgVFJVRSBBTkQgTS5zdHJva2VfdGlhIElTIE5PVCBUUlVFIEFORCBNLnBhbGxpYXRpdmVfY2FyZV9mbGFnIElTIE5PVCBUUlVFIEFORCBNLnBzeWNob3RpY19kaXNvcmRlcl9mbGFnIElTIE5PVCBUUlVFIEFORFxyXG5NLnNwbCBJUyBOT1QgVFJVRSBBTkQgTS5jaGVtb19yYWRpb3RoZXJhcHkgSVMgTk9UIFRSVUUgQU5EIE0uaGFlbWF0b2xvZ2ljYWxfY2FuY2VycyBJUyBOT1QgVFJVRSBBTkQgTS5yYXJlX2Rpc2Vhc2VzIElTIE5PVCBUUlVFIEFORCBNLnJlc3BpcmF0b3J5IElTIE5PVCBUUlVFYDtcclxuY29uc3Qgbm9uZWZsYWdzdGF0ZW1lbnQgPSBgRC5vdGhlcl9zaGllbGRlZF9jYXRlZ29yeSBJUyBOVUxMIEFORCBELmFzc2lzdGVkX2NvbGxlY3Rpb24gSVMgTlVMTCBBTkQgRC5ob21lX2NhcmVfbGluayBJUyBOT1QgVFJVRSBBTkRcclxuRC5zaW5nbGVfb2NjdXBhbmN5IElTIE5VTEwgQU5EIEQuZGlzYWJsZWRfZmFjaWxpdGllc19ncmFudCBJUyBOT1QgVFJVRSBBTkQgRC5jb3VuY2lsX3RheCBJUyBOVUxMIEFORCBELlwibmVpZ2hib3VyaG9vZF9saW5rZWRfdG9fUENOXCJcclxuSVMgTk9UIFRSVUUgQU5EIEQudW5pdmVyc2FsX2NyZWRpdCBJUyBOT1QgVFJVRSBBTkQgRC5ob3VzaW5nX2JlbmVmaXQgSVMgTk9UIFRSVUUgQU5EIEQuYnVzaW5lc3NfZ3JhbnQgSVMgTk9UIFRSVUVgO1xyXG5cclxuZnVuY3Rpb24gY29ob3J0Q2xhdXNlKGNvaG9ydHVybDogYW55KSB7XHJcbiAgaWYgKGNvaG9ydHVybCA9PT0gXCJcIiB8fCBjb2hvcnR1cmwgPT09IG51bGwgfHwgY29ob3J0dXJsID09PSBcInt9XCIpIHtcclxuICAgIHJldHVybiBcIlwiO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBsZXQgc3RhdGVtZW50ID0gXCJcIjtcclxuICAgIGNvbnN0IGNoID0gSlNPTi5wYXJzZShjb2hvcnR1cmwpO1xyXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGNoKTtcclxuICAgIGtleXMuZm9yRWFjaCgoaykgPT4ge1xyXG4gICAgICBpZiAoZXhjbHVzaW9ucy5pbmRleE9mKGspID09PSAtMSkgc3RhdGVtZW50ICs9IGNvbnZlcnRLZXl0b0ZpZWxkKGspICsgY29udmVydFZhbHVldG9TUUwoaywgY2hba10pICsgXCIgQU5EIFwiO1xyXG4gICAgfSk7XHJcbiAgICBzdGF0ZW1lbnQgPSBzdGF0ZW1lbnQuc3Vic3RyKDAsIHN0YXRlbWVudC5sZW5ndGggLSA0KTtcclxuICAgIHJldHVybiBgIChgICsgc3RhdGVtZW50ICsgYCkgYDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbnZlcnRLZXl0b0ZpZWxkKGRpbWVuc2lvbk5hbWU6IGFueSkge1xyXG4gIHN3aXRjaCAoZGltZW5zaW9uTmFtZSkge1xyXG4gICAgY2FzZSBcIlNleERpbWVuc2lvblwiOlxyXG4gICAgICByZXR1cm4gYE0uc2V4YDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiQWdlRGltZW5zaW9uXCI6XHJcbiAgICAgIHJldHVybiBgTS5hZ2VgO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJSc2tEaW1lbnNpb25cIjpcclxuICAgICAgcmV0dXJuIGBNLnJpc2tfc2NvcmVfaW50YDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiV0RpbWVuc2lvblwiOlxyXG4gICAgICByZXR1cm4gYE0uZWxlY3RvcmFsX3dhcmRfb3JfZGl2aXNpb25gO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJHUERpbWVuc2lvblwiOlxyXG4gICAgICByZXR1cm4gYE0uZ3BwX2NvZGVgO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJMRGltZW5zaW9uXCI6XHJcbiAgICAgIHJldHVybiBgTS5wY25gO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJDQ0dEaW1lbnNpb25cIjpcclxuICAgICAgcmV0dXJuIGBNLmNjZ19jb2RlYDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiTFRDczJEaW1lbnNpb25cIjpcclxuICAgIGNhc2UgXCJNYXRyaXhEaW1lbnNpb25cIjpcclxuICAgIGNhc2UgXCJGbGFnczJEaW1lbnNpb25cIjpcclxuICAgICAgcmV0dXJuIGBgO1xyXG4gICAgICBicmVhaztcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHJldHVybiBgXCJuaHNfbnVtYmVyXCJgO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY29udmVydFZhbHVldG9TUUwoZGltZW5zaW9uTmFtZTogYW55LCB2YWx1ZTogYW55KSB7XHJcbiAgc3dpdGNoIChkaW1lbnNpb25OYW1lKSB7XHJcbiAgICBjYXNlIFwiU2V4RGltZW5zaW9uXCI6XHJcbiAgICBjYXNlIFwiTERpbWVuc2lvblwiOlxyXG4gICAgY2FzZSBcIkdQRGltZW5zaW9uXCI6XHJcbiAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDApIHJldHVybiBcIiBJUyBOT1QgTlVMTCBcIjtcclxuICAgICAgZWxzZSBpZiAodmFsdWUubGVuZ3RoID09PSAxKSByZXR1cm4gYCA9ICdgICsgdmFsdWVbMF0gKyBgJ2A7XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGxldCBsaXN0ID0gYCBpbiAoYDtcclxuICAgICAgICB2YWx1ZS5mb3JFYWNoKChlbGVtZW50OiBhbnkpID0+IHtcclxuICAgICAgICAgIGxpc3QgKz0gYCdgICsgZWxlbWVudCArIGAnLGA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGxpc3Quc3Vic3RyKDAsIGxpc3QubGVuZ3RoIC0gMSkgKyBgKWA7XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiV0RpbWVuc2lvblwiOlxyXG4gICAgY2FzZSBcIkNDR0RpbWVuc2lvblwiOlxyXG4gICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwKSByZXR1cm4gXCIgSVMgTk9UIE5VTEwgXCI7XHJcbiAgICAgIGVsc2UgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGAgPSAnYCArIHZhbHVlWzBdICsgYCdgO1xyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBsZXQgbGlzdCA9IGAgaW4gKGA7XHJcbiAgICAgICAgdmFsdWUuZm9yRWFjaCgoZWxlbWVudDogYW55KSA9PiB7XHJcbiAgICAgICAgICBsaXN0ICs9IGAnYCArIGVsZW1lbnQgKyBgJyxgO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBsaXN0LnN1YnN0cigwLCBsaXN0Lmxlbmd0aCAtIDEpICsgYClgO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcIkFnZURpbWVuc2lvblwiOlxyXG4gICAgICByZXR1cm4gYCA+PSBgICsgdmFsdWVbMF1bMF0gKyBgIEFORCBNLmFnZSA8PSBgICsgdmFsdWVbMF1bMV07XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcIlJza0RpbWVuc2lvblwiOlxyXG4gICAgICByZXR1cm4gYCA+PSBgICsgdmFsdWVbMF1bMF0gKyBgIEFORCBNLnJpc2tfc2NvcmVfaW50IDw9IGAgKyB2YWx1ZVswXVsxXTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiTFRDczJEaW1lbnNpb25cIjpcclxuICAgICAgbGV0IG5vbmVmbGFnID0gZmFsc2U7XHJcbiAgICAgIHZhbHVlLmZvckVhY2goKGVsZW1lbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50WzBdID09PSBcIk5vbmVcIikgbm9uZWZsYWcgPSB0cnVlO1xyXG4gICAgICB9KTtcclxuICAgICAgaWYgKG5vbmVmbGFnKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiKFwiICsgbm9uZXN0YXRlbWVudCArIFwiKVwiO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCBzdGF0ZW1lbnQgPSBcIiAoXCI7XHJcbiAgICAgICAgdmFsdWUuZm9yRWFjaCgoZWxlbWVudDogYW55KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBsb29rdXAgPSBMVENMb29rdXAuZmlsdGVyKCh4KSA9PiB4LmRpc3BsYXlOYW1lID09PSBlbGVtZW50WzBdKTtcclxuICAgICAgICAgIGlmIChsb29rdXAubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBzdGF0ZW1lbnQgKz0gbG9va3VwWzBdLmRibmFtZSArIFwiIElTIFRSVUUgQU5EIFwiO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3RhdGVtZW50ICs9IGVsZW1lbnRbMF0udG9Mb3dlckNhc2UoKS5zcGxpdChcIiBcIikuam9pbihcIl9cIikgKyBcIiBJUyBUUlVFIEFORCBcIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gc3RhdGVtZW50LnN1YnN0cigwLCBzdGF0ZW1lbnQubGVuZ3RoIC0gNCkgKyBgKWA7XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiRmxhZ3MyRGltZW5zaW9uXCI6XHJcbiAgICAgIGxldCBub25lZmxhZzIgPSBmYWxzZTtcclxuICAgICAgdmFsdWUuZm9yRWFjaCgoZWxlbWVudDogYW55KSA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbMF0gPT09IFwiTm9uZVwiKSBub25lZmxhZzIgPSB0cnVlO1xyXG4gICAgICB9KTtcclxuICAgICAgaWYgKG5vbmVmbGFnMikge1xyXG4gICAgICAgIHJldHVybiBcIihcIiArIG5vbmVmbGFnc3RhdGVtZW50ICsgXCIpXCI7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbGV0IHN0YXRlbWVudDIgPSBcIiAoXCI7XHJcbiAgICAgICAgdmFsdWUuZm9yRWFjaCgoZWxlbWVudDogYW55KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBsb29rdXAgPSBGbGFnTG9va3VwLmZpbHRlcigoeCkgPT4geC5kaXNwbGF5TmFtZSA9PT0gZWxlbWVudFswXSk7XHJcbiAgICAgICAgICBpZiAobG9va3VwLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgc3RhdGVtZW50MiArPSBsb29rdXBbMF0uZGJuYW1lICsgbG9va3VwWzBdLnRydXRoICsgXCIgQU5EIFwiO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3RhdGVtZW50MiArPSBlbGVtZW50WzBdLnRvTG93ZXJDYXNlKCkuc3BsaXQoXCIgXCIpLmpvaW4oXCJfXCIpICsgXCIgSVMgVFJVRSBBTkQgXCI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHN0YXRlbWVudDIuc3Vic3RyKDAsIHN0YXRlbWVudDIubGVuZ3RoIC0gNCkgKyBgKWA7XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiTWF0cml4RGltZW5zaW9uXCI6XHJcbiAgICAgIGxldCB3aGVyZUNsYXVzZSA9IFwiXCI7XHJcbiAgICAgIHZhbHVlLmZvckVhY2goKHZhbHVlUGFpcjogYW55LCBpOiBhbnkpID0+IHtcclxuICAgICAgICBpZiAodmFsdWVQYWlyWzBdICYmIHZhbHVlUGFpclsxXSkge1xyXG4gICAgICAgICAgd2hlcmVDbGF1c2UgKz0gYGNvdmlkX3Jpc2sgbGlrZSAnJHt2YWx1ZVBhaXJbMF19JyBBTkQgY292aWRfdnVsbiBsaWtlICcke3ZhbHVlUGFpclsxXX0nYDtcclxuICAgICAgICAgIC8vIE5vdCB0aGUgZmlyc3QgcGFpciBhbmQgbm90IHRoZSBsYXN0IGRvIHdlIGFkZCB0aGUgYEFORGBcclxuICAgICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPiAxICYmIGkgIT09IHZhbHVlLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgd2hlcmVDbGF1c2UgKz0gYCBBTkQgYDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICB3aGVyZUNsYXVzZSA9IGAgKCR7d2hlcmVDbGF1c2V9KSBgO1xyXG4gICAgICByZXR1cm4gd2hlcmVDbGF1c2U7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuIFwiID0gJzAwMDAwMDAwMDAnXCI7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBMVENMb29rdXAgPSBbXHJcbiAgeyBkYm5hbWU6IFwiY2hkXCIsIGRpc3BsYXlOYW1lOiBcIkNvcm9uYXJ5IEFydGVyeSBEaXNlYXNlXCIgfSxcclxuICB7IGRibmFtZTogXCJoZWFydF9mYWlsdXJlXCIsIGRpc3BsYXlOYW1lOiBcIkNvbmdlc3RpdmUgSGVhcnQgRmFpbHVyZVwiIH0sXHJcbiAgeyBkYm5hbWU6IFwiY2tkXCIsIGRpc3BsYXlOYW1lOiBcIkNocm9uaWMgS2lkbmV5IERpc2Vhc2VcIiB9LFxyXG4gIHsgZGJuYW1lOiBcInBhZFwiLCBkaXNwbGF5TmFtZTogXCJQZXJpcGhlcmFsIEFydGVyeSBEaXNlYXNlXCIgfSxcclxuXTtcclxuXHJcbmNvbnN0IEZsYWdMb29rdXAgPSBbXHJcbiAgeyBkYm5hbWU6IFwiRC5vdGhlcl9zaGllbGRlZF9jYXRlZ29yeVwiLCBkaXNwbGF5TmFtZTogXCJEaXN0cmljdCBTaGllbGRlZFwiLCB0cnV0aDogXCIgPSAxXCIgfSxcclxuICB7IGRibmFtZTogXCJELmFzc2lzdGVkX2NvbGxlY3Rpb25cIiwgZGlzcGxheU5hbWU6IFwiQXNzaXN0ZWQgQmluIENvbGxlY3Rpb25cIiwgdHJ1dGg6IFwiID0gJ1knXCIgfSxcclxuICB7IGRibmFtZTogXCJELmhvbWVfY2FyZV9saW5rXCIsIGRpc3BsYXlOYW1lOiBcIkhvbWUgQ2FyZSBMaW5rXCIsIHRydXRoOiBcIiBJUyBUUlVFXCIgfSxcclxuICB7IGRibmFtZTogXCJELnNpbmdsZV9vY2N1cGFuY3lcIiwgZGlzcGxheU5hbWU6IFwiU2luZ2xlIE9jY3VwYW5jeVwiLCB0cnV0aDogXCIgPSAnWSdcIiB9LFxyXG4gIHsgZGJuYW1lOiBcIkQuZGlzYWJsZWRfZmFjaWxpdGllc19ncmFudFwiLCBkaXNwbGF5TmFtZTogXCJEaXNhYmxlZCBGYWNpbGl0aWVzIEdyYW50XCIsIHRydXRoOiBcIiBJUyBUUlVFXCIgfSxcclxuICB7IGRibmFtZTogXCJELmNvdW5jaWxfdGF4XCIsIGRpc3BsYXlOYW1lOiBcIkNvdW5jaWwgVGF4XCIsIHRydXRoOiBcIiA9ICdZJ1wiIH0sXHJcbiAgeyBkYm5hbWU6ICdELlwibmVpZ2hib3VyaG9vZF9saW5rZWRfdG9fUENOXCInLCBkaXNwbGF5TmFtZTogXCJOZWlnaGJvdXJob29kIExpbmtlZCB0byBQQ05cIiwgdHJ1dGg6IFwiIElTIFRSVUVcIiB9LFxyXG4gIHsgZGJuYW1lOiBcIkQudW5pdmVyc2FsX2NyZWRpdFwiLCBkaXNwbGF5TmFtZTogXCJVbml2ZXJzYWwgQ3JlZGl0XCIsIHRydXRoOiBcIiBJUyBUUlVFXCIgfSxcclxuICB7IGRibmFtZTogXCJELmhvdXNpbmdfYmVuZWZpdFwiLCBkaXNwbGF5TmFtZTogXCJIb3VzaW5nIEJlbmVmaXRcIiwgdHJ1dGg6IFwiIElTIFRSVUVcIiB9LFxyXG4gIHsgZGJuYW1lOiBcIkQuYnVzaW5lc3NfZ3JhbnRcIiwgZGlzcGxheU5hbWU6IFwiQnVzaW5lc3MgR3JhbnRcIiwgdHJ1dGg6IFwiIElTIFRSVUVcIiB9LFxyXG5dO1xyXG5cclxuZXhwb3J0IGNvbnN0IF9TUUxTZXR0aW5nczogTGFtYmRhUEdJbmZvW10gPSBbXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLXBvc3RncmVzcWwtT3V0YnJlYWtcIixcclxuICAgIGZpbGVuYW1lOiBcInBvc3RncmVzcWxcIixcclxuICAgIGZ1bmN0aW9uczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcIm1hcGluZm9cIixcclxuICAgICAgICBoYW5kbGVybWV0aG9kOiBcImdldEJ5UXVlcnlTdHJpbmdcIixcclxuICAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBgU0VMRUNUICdGZWF0dXJlQ29sbGVjdGlvbicgQVMgVFlQRSwgYXJyYXlfdG9fanNvbihhcnJheV9hZ2coZikpIEFTIGZlYXR1cmVzIEZST00gKCBTRUxFQ1QgJ0ZlYXR1cmUnIEFTIFRZUEUsIFNUX0FzR2VvSlNPTiAobGcuZ2VvbSwgNCk6Ompzb24gQVMgZ2VvbWV0cnksIHJvd190b19qc29uKHJvdyhpZCwgXCJ0aW1lXCIsIGxhdCwgbG5nLCB0bWUsIG9wdGltX3ZhciksIHRydWUpIEFTIHByb3BlcnRpZXMgRlJPTSBwdWJsaWMuaXNvY2hyb25lX291dGJyZWFrIEFTIGxnKSBBUyBmYCxcclxuICAgICAgICBwYXJhbXM6IFtdLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIGJhc2VlbmRwb2ludDogXCJvdXRicmVha1wiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLXBvc3RncmVzcWwtR1BQcmFjdGljZXNcIixcclxuICAgIGZpbGVuYW1lOiBcImdwcHJhY3RpY2VzXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJnZXRBbGxcIixcclxuICAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0R2VvSnNvblwiLFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBcIlwiLFxyXG4gICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgdGFibGVuYW1lOiBcInB1YmxpYy5ncHNcIixcclxuICAgICAgICAgIHN0X2FzZ2VvanNvbjogXCJTVF9TaW1wbGlmeSAobGcuZ2VvbSwgMC4wMDAxLCBUUlVFKVwiLFxyXG4gICAgICAgICAgYXNfcHJvcGVydGllczogYChzZWxlY3Qgcm93X3RvX2pzb24oXykgQVMgcHJvcGVydGllcyBmcm9tIChzZWxlY3QgbGcub3JnYW5pc2F0aW9uX2NvZGUgQVMgXCJDb2RlXCIsXHJcbiAgICAgICAgICBsZy5uYW1lIEFTIFwiTmFtZVwiLFxyXG4gICAgICAgICAgU1RfWChsZy5nZW9tKSBBUyBcIkxvbmdcIixcclxuICAgICAgICAgIFNUX1kobGcuZ2VvbSkgQVMgXCJMYXRcIikgYXMgXylcclxuICAgICAgICAgIC0tcm93X3RvX2pzb24oKG9yZ2FuaXNhdGlvbl9jb2RlLCBuYW1lKSwgdHJ1ZSkgQVMgcHJvcGVydGllc2AsXHJcbiAgICAgICAgICB3aGVyZWNsYXVzZTogXCJXSEVSRSBsZy5jY2cgaW4gKCcwMFEnLCAnMDBSJywgJzAwWCcsICcwMUEnLCAnMDFFJywgJzAxSycsICcwMkcnLCAnMDJNJykgQU5EIChMRUZUKGxnLm9yZ2FuaXNhdGlvbl9jb2RlLDEpICE9ICdZJykgT1IgbGcub3JnYW5pc2F0aW9uX2NvZGU9J1kwMTAwOCdcIixcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIGJhc2VlbmRwb2ludDogXCJncHByYWN0aWNlc1wiLFxyXG4gICAgY3VzdG9tQXV0aDogXCJwdWJsaWNcIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1wb3N0Z3Jlc3FsLUhvdXNlaG9sZElzb2Nocm9uZVwiLFxyXG4gICAgZmlsZW5hbWU6IFwicG9zdGdyZXNxbFwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiZ2V0SG91c2VzV2l0aGluSXNvY2hyb25lXCIsXHJcbiAgICAgICAgbWV0aG9kVHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgaGFuZGxlcm1ldGhvZDogXCJnZXRJc29DaHJvbmVcIixcclxuICAgICAgICBxdWVyeVN0cmluZzogXCJcIixcclxuICAgICAgICBwYXJhbXM6IFtdLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIGJhc2VlbmRwb2ludDogXCJpc29jaHJvbmVcIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1wb3N0Z3Jlc3FsLUJvdW5kYXJpZXNcIixcclxuICAgIGZpbGVuYW1lOiBcIm9yZ2JvdW5kYXJpZXNcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJvcmdib3VuZGFyaWVzXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJnZXRUb3BvSlNPTlwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiR0VUXCIsXHJcbiAgICAgICAgaGFuZGxlcm1ldGhvZDogXCJnZXRHZW9Kc29uXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IFwiXCIsXHJcbiAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICB0YWJsZW5hbWU6IFwicHVibGljLmljcHNcIixcclxuICAgICAgICAgIHN0X2FzZ2VvanNvbjogXCJTVF9TaW1wbGlmeSAobGcuZ2VvbSwgMC4wMDAxLCBUUlVFKVwiLFxyXG4gICAgICAgICAgYXNfcHJvcGVydGllczogYChzZWxlY3Qgcm93X3RvX2pzb24oXykgQVMgcHJvcGVydGllcyBmcm9tIChzZWxlY3QgbGcuaWNwIEFTIFwiSUNQXCIpIGFzIF8pXHJcbiAgICAgICAgICAtLXJvd190b19qc29uKChvcmdhbmlzYXRpb25fY29kZSwgbmFtZSksIHRydWUpIEFTIHByb3BlcnRpZXNgLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLXBvc3RncmVzcWwtUENOSW5mb3JtYXRpb25cIixcclxuICAgIGZpbGVuYW1lOiBcInBvc3RncmVzcWxcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJwY25pbmZvcm1hdGlvblwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiZ2V0VG9wb0pTT05cIixcclxuICAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0R2VvSnNvblwiLFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBcIlwiLFxyXG4gICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgdGFibGVuYW1lOiBcInB1YmxpYy5pY3BzXCIsXHJcbiAgICAgICAgICBzdF9hc2dlb2pzb246IFwiU1RfU2ltcGxpZnkgKGxnLmdlb20sIDAuMDAwMSwgVFJVRSlcIixcclxuICAgICAgICAgIGFzX3Byb3BlcnRpZXM6IGAoc2VsZWN0IHJvd190b19qc29uKF8pIEFTIHByb3BlcnRpZXMgZnJvbSAoc2VsZWN0IGxnLmljcCBBUyBcIklDUFwiKSBhcyBfKSAtLXJvd190b19qc29uKChvcmdhbmlzYXRpb25fY29kZSwgbmFtZSksIHRydWUpIEFTIHByb3BlcnRpZXNgLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiZ2V0SGV4R2VvanNvblwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiR0VUXCIsXHJcbiAgICAgICAgaGFuZGxlcm1ldGhvZDogXCJnZXRHZW9Kc29uXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IFwiXCIsXHJcbiAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICB0YWJsZW5hbWU6IFwicHVibGljLnBjbl9oZXhfZ2VvXCIsXHJcbiAgICAgICAgICBzdF9hc2dlb2pzb246IFwibGcuZ2VvbVwiLFxyXG4gICAgICAgICAgYXNfcHJvcGVydGllczogYChzZWxlY3Qgcm93X3RvX2pzb24oXykgQVMgcHJvcGVydGllcyBmcm9tIChzZWxlY3QgaWQsIHBjbikgYXMgXylgLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiZ2V0RGF0YVwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0QWxsXCIsXHJcbiAgICAgICAgbWV0aG9kVHlwZTogXCJHRVRcIixcclxuICAgICAgICBxdWVyeVN0cmluZzogYHB1YmxpYy5tb3NhaWNwY25gLFxyXG4gICAgICAgIHBhcmFtczogW10sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLXBvc3RncmVzcWwtV2FyZHNcIixcclxuICAgIGZpbGVuYW1lOiBcIndhcmRzXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwid2FyZHNcIixcclxuICAgIGZ1bmN0aW9uczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcImdldEFsbFwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiR0VUXCIsXHJcbiAgICAgICAgaGFuZGxlcm1ldGhvZDogXCJnZXRHZW9Kc29uXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IFwiXCIsXHJcbiAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICB0YWJsZW5hbWU6IFwicHVibGljLndhcmRzXCIsXHJcbiAgICAgICAgICBzdF9hc2dlb2pzb246IFwiU1RfU2ltcGxpZnkgKGxnLmdlb20sIDAuMDAwMSwgVFJVRSlcIixcclxuICAgICAgICAgIGFzX3Byb3BlcnRpZXM6IGAoc2VsZWN0IHJvd190b19qc29uKF8pIEFTIHByb3BlcnRpZXMgZnJvbSAoc2VsZWN0IHN0X2FyZWFzaGEsIHN0X2xlbmd0aHMsIG9iamVjdGlkLCBsYWQxNW5tLCBsYWQxNWNkLCB3ZDE1bm13LCB3ZDE1bm0sIHdkMTVjZCkgYXMgXykgLS1yb3dfdG9fanNvbigob3JnYW5pc2F0aW9uX2NvZGUsIG5hbWUpLCB0cnVlKSBBUyBwcm9wZXJ0aWVzYCxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1wb3N0Z3Jlc3FsLUdyYW5kSW5kZXhcIixcclxuICAgIGZpbGVuYW1lOiBcInBvc3RncmVzcWxcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJncmFuZGluZGV4XCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJnZXRBbGxcIixcclxuICAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0QnlRdWVyeVN0cmluZ1wiLFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBncmFuZEluZGV4UXVlcnksXHJcbiAgICAgICAgcGFyYW1zOiBbXSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktcG9zdGdyZXNxbC1Qb3N0Q29kZXNcIixcclxuICAgIGZpbGVuYW1lOiBcInBvc3RncmVzcWxcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJwb3N0Y29kZXNcIixcclxuICAgIGZ1bmN0aW9uczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcImdldEFsbFwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiR0VUXCIsXHJcbiAgICAgICAgaGFuZGxlcm1ldGhvZDogXCJnZXRCeVF1ZXJ5U3RyaW5nXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IGBTRUxFQ1QgJ0ZlYXR1cmVDb2xsZWN0aW9uJyBBUyBUWVBFLCBhcnJheV90b19qc29uKGFycmF5X2FnZyhmKSkgQVMgZmVhdHVyZXNcclxuICAgICAgICBGUk9NICggU0VMRUNUICdGZWF0dXJlJyBBUyBUWVBFLCBTVF9Bc0dlb0pTT04gKFNUX1NpbXBsaWZ5IChsZy5nZW9tLCAwLjAwMDEsIFRSVUUpLCA0KTo6anNvbiBBUyBnZW9tZXRyeSwgcm93X3RvX2pzb24ocm93KG1vc3R5cGUsIHBvcCksIHRydWUpIEFTIHByb3BlcnRpZXNcclxuICAgICAgICBGUk9NIG1vc2FpY3Bvc3Rjb2RlIEFTIGxnICkgQVMgZmAsXHJcbiAgICAgICAgcGFyYW1zOiBbXSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktcG9zdGdyZXNxbC1QYXRpZW50RGVtb2dyYXBoaWNzXCIsXHJcbiAgICBmaWxlbmFtZTogXCJwb3N0Z3Jlc3FsXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwiZGVtb2dyYXBoaWNzXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJkZW1vZ3JhcGhpY3NieW5oc251bWJlclwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiR0VUXCIsXHJcbiAgICAgICAgaGFuZGxlcm1ldGhvZDogXCJnZXRCeVJvbGVRdWVyeUFuZENvbmRpdGlvblwiLFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBgU0VMRUNUIHNleCBBUyBHZW5kZXIsIG5oc19udW1iZXIgQVMgTkhTTnVtYmVyLCBhZGRyZXNzX2xpbmVfMSBBUyBBZGRyZXNzTGluZTEsIGFkZHJlc3NfbGluZV8yIEFTIEFkZHJlc3NMaW5lMiwgYWRkcmVzc19saW5lXzMgQVMgQWRkcmVzc0xpbmUzLCBhZGRyZXNzX2xpbmVfNCBBUyBBZGRyZXNzTGluZTQsIGFkZHJlc3NfbGluZV81IEFTIEFkZHJlc3NMaW5lNSwgcG9zdGNvZGUgQVMgUG9zdENvZGUsIHRpdGxlIEFTIFRpdGxlLCBmb3JlbmFtZSBBUyBGb3JlbmFtZSwgb3RoZXJfZm9yZW5hbWVzIEFTIE90aGVyRm9yZW5hbWVzLCBzdXJuYW1lIEFTIFN1cm5hbWUsIGRhdGVfb2ZfYmlydGggQVMgRE9CIEZST00gcHVibGljLnBvcHVsYXRpb25fbWFzdGVyYCxcclxuICAgICAgICBwYXJhbXM6IFtcIm5oc19udW1iZXJcIl0sXHJcbiAgICAgICAgcm9sZTogXCJwb3B1bGF0aW9uXCIsXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwidmFsaWRhdGVOSFNOdW1iZXJcIixcclxuICAgICAgICBtZXRob2RUeXBlOiBcIlBPU1RcIixcclxuICAgICAgICBoYW5kbGVybWV0aG9kOiBcInZhbGlkYXRlRXhpc3RzXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IGBTRUxFQ1QgbmhzX251bWJlciwgZGF0ZV9vZl9iaXJ0aCBGUk9NIHB1YmxpYy5wb3B1bGF0aW9uX21hc3RlcmAsXHJcbiAgICAgICAgcGFyYW1zOiBbXCJuaHNfbnVtYmVyXCIsIFwiZGF0ZV9vZl9iaXJ0aFwiXSxcclxuICAgICAgICByb2xlOiBcInBvcHVsYXRpb25cIixcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJmaW5kTXlOSFNOdW1iZXJcIixcclxuICAgICAgICBtZXRob2RUeXBlOiBcIlBPU1RcIixcclxuICAgICAgICBoYW5kbGVybWV0aG9kOiBcInZhbGlkYXRlRXhpc3RzXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IGBTRUxFQ1QgbmhzX251bWJlciBGUk9NIHB1YmxpYy5wb3B1bGF0aW9uX21hc3RlcmAsXHJcbiAgICAgICAgcGFyYW1zOiBbXCJzZXhcIiwgXCJkYXRlX29mX2JpcnRoXCIsIFwicG9zdGNvZGVcIiwgXCJmb3JlbmFtZVwiXSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuXTtcclxuIl19
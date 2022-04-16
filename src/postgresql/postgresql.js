"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._SQLSettings = void 0;
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
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGdyZXNxbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBvc3RncmVzcWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXBDLE1BQU0sTUFBTSxHQUFHO0lBQ2IsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVTtJQUNsQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNO0lBQzFCLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVc7SUFDcEMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVztDQUNyQyxDQUFDO0FBQ0YsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztBQUNuRSxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNDLE1BQU0sS0FBSyxHQUFHLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLENBQUM7QUFFekQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEtBQVUsRUFBRSxPQUFZLEVBQUUsUUFBYSxFQUFFLEVBQUU7SUFDNUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFO1FBQzVCLE9BQU8sQ0FBQyxLQUFLLENBQUMsNERBQTRELENBQUMsQ0FBQztRQUM1RSxRQUFRLENBQUMsSUFBSSxFQUFFO1lBQ2IsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUUsRUFBRSw2QkFBNkIsRUFBRSxHQUFHLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRTtZQUM3RSxJQUFJLEVBQUUsK0JBQStCO1NBQ3RDLENBQUMsQ0FBQztRQUNILE9BQU87S0FDUjtJQUNELElBQUk7UUFDRixLQUFLLENBQUMsU0FBUyxD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bnQiOlsiaW1wb3J0IHsgTGFtYmRhUEdJbmZvIH0gZnJvbSBcIi4uLy4uL2xpYi90eXBlcy9pbnRlcmZhY2VzXCI7XHJcbmltcG9ydCB7IGdyYW5kSW5kZXhRdWVyeSB9IGZyb20gXCIuL2dyYW5kaW5kZXhxdWVyeVwiO1xyXG5cclxuY29uc3Qgand0ID0gcmVxdWlyZShcImpzb253ZWJ0b2tlblwiKTtcclxuXHJcbmNvbnN0IGNvbmZpZyA9IHtcclxuICBwZ2RhdGFiYXNlOiBwcm9jZXNzLmVudi5QR0RBVEFCQVNFLFxyXG4gIHBncG9ydDogcHJvY2Vzcy5lbnYuUEdQT1JULFxyXG4gIHBvc3RncmVzX3VuOiBwcm9jZXNzLmVudi5QT1NUR1JFU19VTixcclxuICBwb3N0Z3Jlc19wdzogcHJvY2Vzcy5lbnYuUE9TVEdSRVNfUFcsXHJcbn07XHJcbmNvbnN0IFBvc3RncmVzSSA9IHJlcXVpcmUoXCJkaXUtZGF0YS1mdW5jdGlvbnNcIikuTWV0aG9kcy5Qb3N0Z3Jlc3FsO1xyXG5jb25zdCBQR0NvbnN0cnVjdCA9IFBvc3RncmVzSS5pbml0KGNvbmZpZyk7XHJcbmNvbnN0IFBHTGliID0geyBsaWI6IFBHQ29uc3RydWN0LCBmdW5jdGlvbnM6IFBvc3RncmVzSSB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0QnlRdWVyeVN0cmluZyA9IChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpID0+IHtcclxuICBpZiAoIXByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBCYWQgc2V0dXAsIG5vIHF1ZXJ5U3RyaW5nLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBRdWVyeSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIFBHTGliLmZ1bmN0aW9ucy5nZXRCeVF1ZXJ5KFBHTGliLmxpYiwgcHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcsIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBcIkNvdWxkIG5vdCByZWFjaCBEYXRhYmFzZS5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQpLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgdmFyIGJvZHkgPSBKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMik7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0QnlSb2xlUXVlcnlTdHJpbmcgPSAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSA9PiB7XHJcbiAgaWYgKCFwcm9jZXNzLmVudi5xdWVyeVN0cmluZyB8fCAoIXByb2Nlc3MuZW52LnJvbGUgJiYgcHJvY2Vzcy5lbnYucm9sZSAhPT0gXCJcIikpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IEJhZCBzZXR1cCwgbm8gcXVlcnlTdHJpbmcgb3Igcm9sZS5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gUXVlcnkgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBkZWNvZGV0b2tlbihldmVudC5oZWFkZXJzLkF1dGhvcml6YXRpb24gfHwgZXZlbnQuaGVhZGVycy5hdXRob3JpemF0aW9uKTtcclxuICAgIGNvbnN0IHVzZXJyb2xlcyA9IGRlY29kZWRUb2tlbltcInJvbGVzXCJdIHx8IFtdO1xyXG4gICAgY29uc3Qgcm9sZWNoZWNrID0gY2hlY2tSb2xlKHRydWUsIHVzZXJyb2xlcywgcHJvY2Vzcy5lbnYucm9sZSk7XHJcbiAgICBpZiAocm9sZWNoZWNrID09PSBcIlwiIHx8IHJvbGVjaGVjayA9PT0gXCJlcnJvclwiKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRkFJTEVEOiBEZW5pZWQgZHVlIHRvIGxhY2sgb2Ygcm9sZVwiKTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMSxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgIGJvZHk6IFwiQWNjZXNzIGRlbmllZC4gSW5zdWZmaWNpZW50IHBlcm1pc3Npb25zIHRvIHZpZXcgYW55IHBhdGllbnRzIGRldGFpbHMuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBsZXQgcXVlcnkgPSBwcm9jZXNzLmVudi5xdWVyeVN0cmluZyArIFwiIFwiICsgcm9sZWNoZWNrO1xyXG4gICAgY29uc3Qgb3JkZXJTdHJpbmcgPSBwcm9jZXNzLmVudi5vcmRlclN0cmluZyB8fCBcIlwiO1xyXG4gICAgaWYgKG9yZGVyU3RyaW5nKSBxdWVyeSArPSBcIiBPUkRFUiBCWSBcIiArIG9yZGVyU3RyaW5nO1xyXG4gICAgUEdMaWIuZnVuY3Rpb25zLmdldEJ5UXVlcnkoUEdMaWIubGliLCBxdWVyeSwgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICAgIGJvZHk6IFwiQ291bGQgbm90IHJlYWNoIERhdGFiYXNlLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdCksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICB2YXIgYm9keSA9IEpTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cy52YWxpZGF0ZUV4aXN0cyA9IChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpID0+IHtcclxuICBpZiAoIXByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nIHx8ICghcHJvY2Vzcy5lbnYucm9sZSAmJiBwcm9jZXNzLmVudi5yb2xlICE9PSBcIlwiKSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogQmFkIHNldHVwLCBubyBxdWVyeVN0cmluZyBvciByb2xlLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBRdWVyeSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGRlY29kZXRva2VuKGV2ZW50LmhlYWRlcnMuQXV0aG9yaXphdGlvbiB8fCBldmVudC5oZWFkZXJzLmF1dGhvcml6YXRpb24pO1xyXG4gICAgY29uc3QgdXNlcnJvbGVzID0gZGVjb2RlZFRva2VuW1wicm9sZXNcIl0gfHwgW107XHJcbiAgICBsZXQgaW5jbHVkZXN3aGVyZSA9IGZhbHNlO1xyXG4gICAgaWYgKHByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nLmluY2x1ZGVzKFwiV0hFUkVcIikpIHtcclxuICAgICAgaW5jbHVkZXN3aGVyZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBjb25zdCByb2xlY2hlY2sgPSBjaGVja1JvbGUoIWluY2x1ZGVzd2hlcmUsIHVzZXJyb2xlcywgcHJvY2Vzcy5lbnYucm9sZSk7XHJcbiAgICBpZiAocm9sZWNoZWNrID09PSBcIlwiIHx8IHJvbGVjaGVjayA9PT0gXCJlcnJvclwiKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRkFJTEVEOiBEZW5pZWQgZHVlIHRvIGxhY2sgb2Ygcm9sZVwiKTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMSxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgIGJvZHk6IFwiQWNjZXNzIGRlbmllZC4gSW5zdWZmaWNpZW50IHBlcm1pc3Npb25zIHRvIHZpZXcgYW55IHBhdGllbnRzIGRldGFpbHMuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBjb25kaXRpb25zID0gSlNPTi5wYXJzZShwcm9jZXNzLmVudi5wYXJhbXMhKSB8fCBbXTtcclxuICAgIGxldCBjb25kaXRpb25saXN0ID0gXCJcIjtcclxuICAgIGNvbmRpdGlvbnMuZm9yRWFjaCgoY29uZGl0aW9uTmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGNvbmRpdGlvbmxpc3QgPSArYCBBTkQgXCJgICsgY29uZGl0aW9uTmFtZSArIGBcIiA9ICdgICsgZXZlbnRbXCJxdWVyeVN0cmluZ1BhcmFtZXRlcnNcIl1bY29uZGl0aW9uTmFtZV0gKyBgJ2A7XHJcbiAgICB9KTtcclxuICAgIGxldCBxdWVyeSA9IHByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nICsgYCBgICsgcm9sZWNoZWNrICsgY29uZGl0aW9ubGlzdDtcclxuICAgIGNvbnN0IG9yZGVyU3RyaW5nID0gcHJvY2Vzcy5lbnYub3JkZXJTdHJpbmcgfHwgXCJcIjtcclxuICAgIGlmIChvcmRlclN0cmluZykgcXVlcnkgKz0gXCIgT1JERVIgQlkgXCIgKyBvcmRlclN0cmluZztcclxuICAgIFBHTGliLmZ1bmN0aW9ucy5nZXRCeVF1ZXJ5KFBHTGliLmxpYiwgcXVlcnksIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBcIkNvdWxkIG5vdCByZWFjaCBEYXRhYmFzZS5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQpLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgdmFyIGJvZHkgPSBKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMik7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMudXBkYXRlID0gKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkgPT4ge1xyXG4gIGlmICghcHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IEJhZCBzZXR1cCwgbm8gcXVlcnlTdHJpbmcuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFF1ZXJ5IG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgY29uZGl0aW9uTmFtZSA9IEpTT04ucGFyc2UocHJvY2Vzcy5lbnYucGFyYW1zISlbMF0gfHwgXCJFUlJPUlwiO1xyXG4gICAgY29uc3QgeCA9IGJ1aWxkVXBkYXRlTGlzdChKU09OLnBhcnNlKGV2ZW50LmJvZHkpKTtcclxuICAgIGNvbnN0IHF1ZXJ5ID0gXCJVUERBVEUgXCIgKyBwcm9jZXNzLmVudi5xdWVyeVN0cmluZyArIFwiIFNFVCBcIiArIHggKyBcIiBXSEVSRSBcIiArIGNvbmRpdGlvbk5hbWVgPSAnYCArIGV2ZW50W1wicXVlcnlTdHJpbmdQYXJhbWV0ZXJzXCJdW2NvbmRpdGlvbk5hbWVdICsgYCdgO1xyXG4gICAgUEdMaWIuZnVuY3Rpb25zLmdldEJ5UXVlcnkoUEdMaWIubGliLCBxdWVyeSwgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICAgIGJvZHk6IFwiQ291bGQgbm90IHJlYWNoIERhdGFiYXNlLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdCksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICB2YXIgYm9keSA9IEpTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IFwiICsgSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBidWlsZFVwZGF0ZUxpc3QodXBkYXRlQXJyYXk6IGFueSkge1xyXG4gIGxldCBvdXRwdXQgPSBcIlwiO1xyXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh1cGRhdGVBcnJheSk7XHJcbiAga2V5cy5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgb3V0cHV0ICs9IFwiU0VUIFwiICsga2V5ICsgY2xlYXJlZFZhbHVlKHVwZGF0ZUFycmF5W2tleV0pICsgXCIgXCI7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIG91dHB1dDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xlYXJlZFZhbHVlKHZhbHVlOiBzdHJpbmcpIHtcclxuICBpZiAodmFsdWUgPT09IFwiTlVMTFwiKSByZXR1cm4gXCJJUyBOVUxMXCI7XHJcbiAgZWxzZSBpZiAodmFsdWUgPT09IFwiQ1VSUkVOVF9USU1FU1RBTVBcIikgcmV0dXJuIFwiID0gQ1VSUkVOVF9USU1FU1RBTVBcIjtcclxuICBlbHNlIHtcclxuICAgIHJldHVybiBcIiA9J1wiICsgdmFsdWUgKyBcIidcIjtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLmdldEJ5Um9sZVF1ZXJ5QW5kQ29uZGl0aW9uID0gKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkgPT4ge1xyXG4gIGlmICghcHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcgfHwgKCFwcm9jZXNzLmVudi5yb2xlICYmIHByb2Nlc3MuZW52LnJvbGUgIT09IFwiXCIpKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBCYWQgc2V0dXAsIG5vIHF1ZXJ5U3RyaW5nIG9yIHJvbGUuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFF1ZXJ5IG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgZGVjb2RlZFRva2VuID0gZGVjb2RldG9rZW4oZXZlbnQuaGVhZGVycy5BdXRob3JpemF0aW9uIHx8IGV2ZW50LmhlYWRlcnMuYXV0aG9yaXphdGlvbik7XHJcbiAgICBjb25zdCB1c2Vycm9sZXMgPSBkZWNvZGVkVG9rZW5bXCJyb2xlc1wiXSB8fCBbXTtcclxuICAgIGxldCBpbmNsdWRlc3doZXJlID0gZmFsc2U7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcuaW5jbHVkZXMoXCJXSEVSRVwiKSkge1xyXG4gICAgICBpbmNsdWRlc3doZXJlID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJvbGVjaGVjayA9IGNoZWNrUm9sZSghaW5jbHVkZXN3aGVyZSwgdXNlcnJvbGVzLCBwcm9jZXNzLmVudi5yb2xlKTtcclxuICAgIGlmIChyb2xlY2hlY2sgPT09IFwiXCIgfHwgcm9sZWNoZWNrID09PSBcImVycm9yXCIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1GQUlMRUQ6IERlbmllZCBkdWUgdG8gbGFjayBvZiByb2xlXCIpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogNDAxLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgYm9keTogXCJBY2Nlc3MgZGVuaWVkLiBJbnN1ZmZpY2llbnQgcGVybWlzc2lvbnMgdG8gdmlldyBhbnkgcGF0aWVudHMgZGV0YWlscy5cIixcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IGNvbmRpdGlvbk5hbWUgPSBKU09OLnBhcnNlKHByb2Nlc3MuZW52LnBhcmFtcyEpWzBdIHx8IFwiRVJST1JcIjtcclxuICAgIGxldCBxdWVyeSA9IHByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nICsgYCBgICsgcm9sZWNoZWNrICsgYCBBTkQgXCJgICsgY29uZGl0aW9uTmFtZSArIGBcIiA9ICdgICsgZXZlbnRbXCJxdWVyeVN0cmluZ1BhcmFtZXRlcnNcIl1bY29uZGl0aW9uTmFtZV0gKyBgJ2A7XHJcbiAgICBjb25zdCBvcmRlclN0cmluZyA9IHByb2Nlc3MuZW52Lm9yZGVyU3RyaW5nIHx8IFwiXCI7XHJcbiAgICBpZiAob3JkZXJTdHJpbmcpIHF1ZXJ5ICs9IFwiIE9SREVSIEJZIFwiICsgb3JkZXJTdHJpbmc7XHJcbiAgICBQR0xpYi5mdW5jdGlvbnMuZ2V0QnlRdWVyeShQR0xpYi5saWIsIHF1ZXJ5LCAoZXJyb3I6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgICAgYm9keTogXCJDb3VsZCBub3QgcmVhY2ggRGF0YWJhc2UuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0KSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHZhciBib2R5ID0gSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpO1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogXCIgKyBKU09OLnN0cmluZ2lmeShib2R5KSk7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGRlY29kZXRva2VuKGF1dGhvcml6YXRpb25IZWFkZXI6IHN0cmluZykge1xyXG4gIGNvbnN0IGp3dG9ubHkgPSBhdXRob3JpemF0aW9uSGVhZGVyLnJlcGxhY2UoXCJKV1QgXCIsIFwiXCIpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkZWNvZGVkID0gand0LmRlY29kZShqd3Rvbmx5KTtcclxuICAgIHJldHVybiBkZWNvZGVkO1xyXG4gIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkFVVEhPUklaQVRJT04tLUFVVEhPUklaRVItLVRPS0VOVkVSSUZJQ0FUSU9OLS1FUlJPUjogXCIgKyBqd3Rvbmx5KTtcclxuICAgIHJldHVybiB7IHJvbGVzOiBbXSB9O1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tSb2xlKGFsb25lOiBib29sZWFuLCB1c2Vycm9sZXM6IGFueSwgdGFibGU6IHN0cmluZykge1xyXG4gIGxldCB3aGVyZWNsYXVzZSA9IFwiXCI7XHJcblxyXG4gIGlmICh1c2Vycm9sZXMubGVuZ3RoID4gMCkge1xyXG4gICAgdXNlcnJvbGVzLmZvckVhY2goKHJvbGU6IGFueSkgPT4ge1xyXG4gICAgICBjb25zdCBpdGVtID0gSlNPTi5zdHJpbmdpZnkocm9sZSk7XHJcbiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhyb2xlKTtcclxuICAgICAgaWYgKGl0ZW0uaW5jbHVkZXModGFibGUgKyBcIl9cIikpIHtcclxuICAgICAgICBpZiAoa2V5cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICBsZXQgY3VycmVudDogYW55ID0gbnVsbDtcclxuICAgICAgICAgIHdoZXJlY2xhdXNlICs9IFwiKFwiO1xyXG4gICAgICAgICAga2V5cy5mb3JFYWNoKChrKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChrLmluY2x1ZGVzKHRhYmxlICsgXCJfXCIpKSB7XHJcbiAgICAgICAgICAgICAgY3VycmVudCA9IGsucmVwbGFjZSh0YWJsZSArIFwiX1wiLCBcIlwiKTtcclxuICAgICAgICAgICAgICB3aGVyZWNsYXVzZSArPSBrLnJlcGxhY2UodGFibGUgKyBcIl9cIiwgXCJcIikgKyBcIiBsaWtlICdcIiArIHJvbGVba10gKyBcIicgQU5EIFwiO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHdoZXJlY2xhdXNlICs9IGN1cnJlbnQgKyBcIiBsaWtlICdcIiArIHJvbGVba10gKyBcIicgQU5EIFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHdoZXJlY2xhdXNlID0gd2hlcmVjbGF1c2Uuc3Vic3RyKDAsIHdoZXJlY2xhdXNlLmxlbmd0aCAtIDQpO1xyXG4gICAgICAgICAgd2hlcmVjbGF1c2UgKz0gXCIpIE9SIFwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB3aGVyZWNsYXVzZSArPSBrZXlzWzBdLnJlcGxhY2UodGFibGUgKyBcIl9cIiwgXCJcIikgKyBcIiBsaWtlICdcIiArIHJvbGVba2V5c1swXV0gKyBcIidcIjtcclxuICAgICAgICAgIHdoZXJlY2xhdXNlICs9IFwiIE9SIFwiO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBpZiAod2hlcmVjbGF1c2UubGVuZ3RoID4gMCkge1xyXG4gICAgICB3aGVyZWNsYXVzZSA9IHdoZXJlY2xhdXNlLnN1YnN0cigwLCB3aGVyZWNsYXVzZS5sZW5ndGggLSA0KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmICh3aGVyZWNsYXVzZS5sZW5ndGggPiAwKSB7XHJcbiAgICBpZiAoYWxvbmUpIHtcclxuICAgICAgd2hlcmVjbGF1c2UgPSBcIiBXSEVSRSBcIiArIHdoZXJlY2xhdXNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2hlcmVjbGF1c2UgPSBcIihcIiArIHdoZXJlY2xhdXNlICsgXCIpIEFORCBcIjtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHdoZXJlY2xhdXNlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5nZXRHZW9Kc29uID0gKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwYXJhbXMgPSBwcm9jZXNzLmVudi5wYXJhbXMgfHwgXCJcIjtcclxuICAgIGNvbnN0IHBheWxvYWQgPSBKU09OLnBhcnNlKHBhcmFtcyk7XHJcbiAgICBpZiAoIXByb2Nlc3MuZW52LnBhcmFtcyB8fCAhcGF5bG9hZC50YWJsZW5hbWUgfHwgIXBheWxvYWQuc3RfYXNnZW9qc29uIHx8ICFwYXlsb2FkLmFzX3Byb3BlcnRpZXMpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRVJST1I6IEltcHJvcGVyIHBheWxvYWQ6IFwiICsgZXZlbnQuYm9keSk7XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1zZzogXCJCYWQgUmVxdWVzdC4gQ291bGQgbm90IGZpbmQgZnVsbCBwYXlsb2FkIG9mIHJlcXVlc3QuXCIsIHBhcmFtczogZXZlbnQgfSksXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgUEdMaWIuZnVuY3Rpb25zLmdldEdlb0pzb24oUEdMaWIubGliLCBwYXlsb2FkLCAoZXJyb3I6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgICAgYm9keTogXCJDb3VsZCBub3QgcmVhY2ggRGF0YWJhc2UuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0KSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHZhciBib2R5ID0gSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpO1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogXCIgKyBKU09OLnN0cmluZ2lmeShib2R5KSk7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzLmdldElzb0Nocm9uZSA9IChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcGF5bG9hZCA9IGV2ZW50LmJvZHk7XHJcbiAgICBpZiAoIXBheWxvYWQucXVlcnkpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRVJST1I6IEltcHJvcGVyIHBheWxvYWQ6IFwiICsgZXZlbnQuYm9keSk7XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1zZzogXCJCYWQgUmVxdWVzdC4gQ291bGQgbm90IGZpbmQgcXVlcnkgcGFyYW1ldGVyLlwiLCBwYXJhbXM6IGV2ZW50IH0pLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIFBHTGliLmZ1bmN0aW9ucy5nZXRJc29DaHJvbmUoUEdMaWIubGliLCBwYXlsb2FkLCAoZXJyb3I6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgICAgYm9keTogXCJDb3VsZCBub3QgcmVhY2ggRGF0YWJhc2UuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0KSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHZhciBib2R5ID0gSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpO1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1QT1NUR1JFU1FMLS1FUlJPUjogXCIgKyBKU09OLnN0cmluZ2lmeShib2R5KSk7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzLmdldEFsbCA9IChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpID0+IHtcclxuICBpZiAoIXByb2Nlc3MuZW52LnF1ZXJ5U3RyaW5nKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBCYWQgc2V0dXAsIG5vIHF1ZXJ5U3RyaW5nLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBUYWJsZW5hbWUgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBQR0xpYi5mdW5jdGlvbnMuZ2V0QWxsKFBHTGliLmxpYiwgcHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcsIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBcIkNvdWxkIG5vdCByZWFjaCBEYXRhYmFzZS5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQpLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgdmFyIGJvZHkgPSBKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMik7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0QnlSb2xlUXVlcnlBbmRDb2hvcnQgPSAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSA9PiB7XHJcbiAgaWYgKCFwcm9jZXNzLmVudi5xdWVyeVN0cmluZyB8fCAoIXByb2Nlc3MuZW52LnJvbGUgJiYgcHJvY2Vzcy5lbnYucm9sZSAhPT0gXCJcIikpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tUE9TVEdSRVNRTC0tRVJST1I6IEJhZCBzZXR1cCwgbm8gcXVlcnlTdHJpbmcgb3Igcm9sZS5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gUXVlcnkgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBkZWNvZGV0b2tlbihldmVudC5oZWFkZXJzLkF1dGhvcml6YXRpb24gfHwgZXZlbnQuaGVhZGVycy5hdXRob3JpemF0aW9uKTtcclxuICAgIGNvbnN0IHVzZXJyb2xlcyA9IGRlY29kZWRUb2tlbltcInJvbGVzXCJdIHx8IFtdO1xyXG4gICAgbGV0IGluY2x1ZGVzd2hlcmUgPSBmYWxzZTtcclxuICAgIGlmIChwcm9jZXNzLmVudi5xdWVyeVN0cmluZy5pbmNsdWRlcyhcIldIRVJFXCIpKSB7XHJcbiAgICAgIGluY2x1ZGVzd2hlcmUgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgcm9sZWNoZWNrID0gY2hlY2tSb2xlKCFpbmNsdWRlc3doZXJlLCB1c2Vycm9sZXMsIHByb2Nlc3MuZW52LnJvbGUpO1xyXG4gICAgaWYgKHJvbGVjaGVjayA9PT0gXCJcIiB8fCByb2xlY2hlY2sgPT09IFwiZXJyb3JcIikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUZBSUxFRDogRGVuaWVkIGR1ZSB0byBsYWNrIG9mIHJvbGVcIik7XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICBzdGF0dXNDb2RlOiA0MDEsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICBib2R5OiBcIkFjY2VzcyBkZW5pZWQuIEluc3VmZmljaWVudCBwZXJtaXNzaW9ucyB0byB2aWV3IGFueSBwYXRpZW50cyBkZXRhaWxzLlwiLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvaG9ydCA9IGV2ZW50W1wicXVlcnlTdHJpbmdQYXJhbWV0ZXJzXCJdW1wiY29ob3J0XCJdO1xyXG4gICAgbGV0IHF1ZXJ5ID0gcHJvY2Vzcy5lbnYucXVlcnlTdHJpbmcgKyBgIGAgKyByb2xlY2hlY2sgKyBjb2hvcnRDbGF1c2UoY29ob3J0KTtcclxuICAgIGNvbnN0IG9yZGVyU3RyaW5nID0gcHJvY2Vzcy5lbnYub3JkZXJTdHJpbmcgfHwgXCJcIjtcclxuICAgIGlmIChvcmRlclN0cmluZykgcXVlcnkgKz0gXCIgT1JERVIgQlkgXCIgKyBvcmRlclN0cmluZztcclxuICAgIFBHTGliLmZ1bmN0aW9ucy5nZXRCeVF1ZXJ5KFBHTGliLmxpYiwgcXVlcnksIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBcIkNvdWxkIG5vdCByZWFjaCBEYXRhYmFzZS5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQpLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgdmFyIGJvZHkgPSBKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMik7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLVBPU1RHUkVTUUwtLUVSUk9SOiBcIiArIEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3QgZXhjbHVzaW9ucyA9IFtcIkZDbnREaW1lbnNpb25cIiwgXCJMQ250RGltZW5zaW9uXCIsIFwibnVtYmVyU2VsRmxhZ1wiLCBcIm51bWJlclNlbEx0Y1wiLCBcIkREaW1lbnNpb25cIiwgXCJNRGltZW5zaW9uXCJdO1xyXG5jb25zdCBub25lc3RhdGVtZW50ID0gYE0uYXN0aG1hIElTIE5PVCBUUlVFIEFORCBNLmNoZCBJUyBOT1QgVFJVRSBBTkQgTS5oZWFydF9mYWlsdXJlIElTIE5PVCBUUlVFIEFORCBNLmNhbmNlciBJUyBOT1QgVFJVRSBBTkQgTS5jb3BkIElTIE5PVCBUUlVFIEFORFxyXG5NLmRlcHJlc3Npb24gSVMgTk9UIFRSVUUgQU5EIE0uZGlhYmV0ZXMgSVMgTk9UIFRSVUUgQU5EIE0uaHlwZXJ0ZW5zaW9uIElTIE5PVCBUUlVFIEFORCBNLmF0cmlhbF9maWJyaWxsYXRpb24gSVMgTk9UIFRSVUUgQU5EXHJcbk0uY2tkIElTIE5PVCBUUlVFIEFORCBNLmRlbWVudGlhIElTIE5PVCBUUlVFIEFORCBNLmVwaWxlcHN5IElTIE5PVCBUUlVFIEFORCBNLmh5cG90aHlyb2lkIElTIE5PVCBUUlVFIEFORCBNLm1lbnRhbF9oZWFsdGggSVMgTk9UIFRSVUUgQU5EXHJcbk0ubGVhcm5pbmdfZGlzYWJpbGl0aWVzIElTIE5PVCBUUlVFIEFORCBNLm9zdGVvcG9yb3NpcyBJUyBOT1QgVFJVRSBBTkQgTS5wYWQgSVMgTk9UIFRSVUUgQU5EXHJcbk0ucmhldW1hdG9pZF9hcnRocml0aXMgSVMgTk9UIFRSVUUgQU5EIE0uc3Ryb2tlX3RpYSBJUyBOT1QgVFJVRSBBTkQgTS5wYWxsaWF0aXZlX2NhcmVfZmxhZyBJUyBOT1QgVFJVRSBBTkQgTS5wc3ljaG90aWNfZGlzb3JkZXJfZmxhZyBJUyBOT1QgVFJVRSBBTkRcclxuTS5zcGwgSVMgTk9UIFRSVUUgQU5EIE0uY2hlbW9fcmFkaW90aGVyYXB5IElTIE5PVCBUUlVFIEFORCBNLmhhZW1hdG9sb2dpY2FsX2NhbmNlcnMgSVMgTk9UIFRSVUUgQU5EIE0ucmFyZV9kaXNlYXNlcyBJUyBOT1QgVFJVRSBBTkQgTS5yZXNwaXJhdG9yeSBJUyBOT1QgVFJVRWA7XHJcbmNvbnN0IG5vbmVmbGFnc3RhdGVtZW50ID0gYEQub3RoZXJfc2hpZWxkZWRfY2F0ZWdvcnkgSVMgTlVMTCBBTkQgRC5hc3Npc3RlZF9jb2xsZWN0aW9uIElTIE5VTEwgQU5EIEQuaG9tZV9jYXJlX2xpbmsgSVMgTk9UIFRSVUUgQU5EXHJcbkQuc2luZ2xlX29jY3VwYW5jeSBJUyBOVUxMIEFORCBELmRpc2FibGVkX2ZhY2lsaXRpZXNfZ3JhbnQgSVMgTk9UIFRSVUUgQU5EIEQuY291bmNpbF90YXggSVMgTlVMTCBBTkQgRC5cIm5laWdoYm91cmhvb2RfbGlua2VkX3RvX1BDTlwiXHJcbklTIE5PVCBUUlVFIEFORCBELnVuaXZlcnNhbF9jcmVkaXQgSVMgTk9UIFRSVUUgQU5EIEQuaG91c2luZ19iZW5lZml0IElTIE5PVCBUUlVFIEFORCBELmJ1c2luZXNzX2dyYW50IElTIE5PVCBUUlVFYDtcclxuXHJcbmZ1bmN0aW9uIGNvaG9ydENsYXVzZShjb2hvcnR1cmw6IGFueSkge1xyXG4gIGlmIChjb2hvcnR1cmwgPT09IFwiXCIgfHwgY29ob3J0dXJsID09PSBudWxsIHx8IGNvaG9ydHVybCA9PT0gXCJ7fVwiKSB7XHJcbiAgICByZXR1cm4gXCJcIjtcclxuICB9IGVsc2Uge1xyXG4gICAgbGV0IHN0YXRlbWVudCA9IFwiXCI7XHJcbiAgICBjb25zdCBjaCA9IEpTT04ucGFyc2UoY29ob3J0dXJsKTtcclxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhjaCk7XHJcbiAgICBrZXlzLmZvckVhY2goKGspID0+IHtcclxuICAgICAgaWYgKGV4Y2x1c2lvbnMuaW5kZXhPZihrKSA9PT0gLTEpIHN0YXRlbWVudCArPSBjb252ZXJ0S2V5dG9GaWVsZChrKSArIGNvbnZlcnRWYWx1ZXRvU1FMKGssIGNoW2tdKSArIFwiIEFORCBcIjtcclxuICAgIH0pO1xyXG4gICAgc3RhdGVtZW50ID0gc3RhdGVtZW50LnN1YnN0cigwLCBzdGF0ZW1lbnQubGVuZ3RoIC0gNCk7XHJcbiAgICByZXR1cm4gYCAoYCArIHN0YXRlbWVudCArIGApIGA7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjb252ZXJ0S2V5dG9GaWVsZChkaW1lbnNpb25OYW1lOiBhbnkpIHtcclxuICBzd2l0Y2ggKGRpbWVuc2lvbk5hbWUpIHtcclxuICAgIGNhc2UgXCJTZXhEaW1lbnNpb25cIjpcclxuICAgICAgcmV0dXJuIGBNLnNleGA7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcIkFnZURpbWVuc2lvblwiOlxyXG4gICAgICByZXR1cm4gYE0uYWdlYDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiUnNrRGltZW5zaW9uXCI6XHJcbiAgICAgIHJldHVybiBgTS5yaXNrX3Njb3JlX2ludGA7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcIldEaW1lbnNpb25cIjpcclxuICAgICAgcmV0dXJuIGBNLmVsZWN0b3JhbF93YXJkX29yX2RpdmlzaW9uYDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiR1BEaW1lbnNpb25cIjpcclxuICAgICAgcmV0dXJuIGBNLmdwcF9jb2RlYDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiTERpbWVuc2lvblwiOlxyXG4gICAgICByZXR1cm4gYE0ucGNuYDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiQ0NHRGltZW5zaW9uXCI6XHJcbiAgICAgIHJldHVybiBgTS5jY2dfY29kZWA7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcIkxUQ3MyRGltZW5zaW9uXCI6XHJcbiAgICBjYXNlIFwiTWF0cml4RGltZW5zaW9uXCI6XHJcbiAgICBjYXNlIFwiRmxhZ3MyRGltZW5zaW9uXCI6XHJcbiAgICAgIHJldHVybiBgYDtcclxuICAgICAgYnJlYWs7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICByZXR1cm4gYFwibmhzX251bWJlclwiYDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbnZlcnRWYWx1ZXRvU1FMKGRpbWVuc2lvbk5hbWU6IGFueSwgdmFsdWU6IGFueSkge1xyXG4gIHN3aXRjaCAoZGltZW5zaW9uTmFtZSkge1xyXG4gICAgY2FzZSBcIlNleERpbWVuc2lvblwiOlxyXG4gICAgY2FzZSBcIkxEaW1lbnNpb25cIjpcclxuICAgIGNhc2UgXCJHUERpbWVuc2lvblwiOlxyXG4gICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwKSByZXR1cm4gXCIgSVMgTk9UIE5VTEwgXCI7XHJcbiAgICAgIGVsc2UgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGAgPSAnYCArIHZhbHVlWzBdICsgYCdgO1xyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBsZXQgbGlzdCA9IGAgaW4gKGA7XHJcbiAgICAgICAgdmFsdWUuZm9yRWFjaCgoZWxlbWVudDogYW55KSA9PiB7XHJcbiAgICAgICAgICBsaXN0ICs9IGAnYCArIGVsZW1lbnQgKyBgJyxgO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBsaXN0LnN1YnN0cigwLCBsaXN0Lmxlbmd0aCAtIDEpICsgYClgO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcIldEaW1lbnNpb25cIjpcclxuICAgIGNhc2UgXCJDQ0dEaW1lbnNpb25cIjpcclxuICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiIElTIE5PVCBOVUxMIFwiO1xyXG4gICAgICBlbHNlIGlmICh2YWx1ZS5sZW5ndGggPT09IDEpIHJldHVybiBgID0gJ2AgKyB2YWx1ZVswXSArIGAnYDtcclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgbGV0IGxpc3QgPSBgIGluIChgO1xyXG4gICAgICAgIHZhbHVlLmZvckVhY2goKGVsZW1lbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgbGlzdCArPSBgJ2AgKyBlbGVtZW50ICsgYCcsYDtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gbGlzdC5zdWJzdHIoMCwgbGlzdC5sZW5ndGggLSAxKSArIGApYDtcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJBZ2VEaW1lbnNpb25cIjpcclxuICAgICAgcmV0dXJuIGAgPj0gYCArIHZhbHVlWzBdWzBdICsgYCBBTkQgTS5hZ2UgPD0gYCArIHZhbHVlWzBdWzFdO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJSc2tEaW1lbnNpb25cIjpcclxuICAgICAgcmV0dXJuIGAgPj0gYCArIHZhbHVlWzBdWzBdICsgYCBBTkQgTS5yaXNrX3Njb3JlX2ludCA8PSBgICsgdmFsdWVbMF1bMV07XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcIkxUQ3MyRGltZW5zaW9uXCI6XHJcbiAgICAgIGxldCBub25lZmxhZyA9IGZhbHNlO1xyXG4gICAgICB2YWx1ZS5mb3JFYWNoKChlbGVtZW50OiBhbnkpID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFswXSA9PT0gXCJOb25lXCIpIG5vbmVmbGFnID0gdHJ1ZTtcclxuICAgICAgfSk7XHJcbiAgICAgIGlmIChub25lZmxhZykge1xyXG4gICAgICAgIHJldHVybiBcIihcIiArIG5vbmVzdGF0ZW1lbnQgKyBcIilcIjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgc3RhdGVtZW50ID0gXCIgKFwiO1xyXG4gICAgICAgIHZhbHVlLmZvckVhY2goKGVsZW1lbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgbG9va3VwID0gTFRDTG9va3VwLmZpbHRlcigoeCkgPT4geC5kaXNwbGF5TmFtZSA9PT0gZWxlbWVudFswXSk7XHJcbiAgICAgICAgICBpZiAobG9va3VwLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgc3RhdGVtZW50ICs9IGxvb2t1cFswXS5kYm5hbWUgKyBcIiBJUyBUUlVFIEFORCBcIjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN0YXRlbWVudCArPSBlbGVtZW50WzBdLnRvTG93ZXJDYXNlKCkuc3BsaXQoXCIgXCIpLmpvaW4oXCJfXCIpICsgXCIgSVMgVFJVRSBBTkQgXCI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHN0YXRlbWVudC5zdWJzdHIoMCwgc3RhdGVtZW50Lmxlbmd0aCAtIDQpICsgYClgO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcIkZsYWdzMkRpbWVuc2lvblwiOlxyXG4gICAgICBsZXQgbm9uZWZsYWcyID0gZmFsc2U7XHJcbiAgICAgIHZhbHVlLmZvckVhY2goKGVsZW1lbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50WzBdID09PSBcIk5vbmVcIikgbm9uZWZsYWcyID0gdHJ1ZTtcclxuICAgICAgfSk7XHJcbiAgICAgIGlmIChub25lZmxhZzIpIHtcclxuICAgICAgICByZXR1cm4gXCIoXCIgKyBub25lZmxhZ3N0YXRlbWVudCArIFwiKVwiO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCBzdGF0ZW1lbnQyID0gXCIgKFwiO1xyXG4gICAgICAgIHZhbHVlLmZvckVhY2goKGVsZW1lbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgbG9va3VwID0gRmxhZ0xvb2t1cC5maWx0ZXIoKHgpID0+IHguZGlzcGxheU5hbWUgPT09IGVsZW1lbnRbMF0pO1xyXG4gICAgICAgICAgaWYgKGxvb2t1cC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHN0YXRlbWVudDIgKz0gbG9va3VwWzBdLmRibmFtZSArIGxvb2t1cFswXS50cnV0aCArIFwiIEFORCBcIjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN0YXRlbWVudDIgKz0gZWxlbWVudFswXS50b0xvd2VyQ2FzZSgpLnNwbGl0KFwiIFwiKS5qb2luKFwiX1wiKSArIFwiIElTIFRSVUUgQU5EIFwiO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBzdGF0ZW1lbnQyLnN1YnN0cigwLCBzdGF0ZW1lbnQyLmxlbmd0aCAtIDQpICsgYClgO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcIk1hdHJpeERpbWVuc2lvblwiOlxyXG4gICAgICBsZXQgd2hlcmVDbGF1c2UgPSBcIlwiO1xyXG4gICAgICB2YWx1ZS5mb3JFYWNoKCh2YWx1ZVBhaXI6IGFueSwgaTogYW55KSA9PiB7XHJcbiAgICAgICAgaWYgKHZhbHVlUGFpclswXSAmJiB2YWx1ZVBhaXJbMV0pIHtcclxuICAgICAgICAgIHdoZXJlQ2xhdXNlICs9IGBjb3ZpZF9yaXNrIGxpa2UgJyR7dmFsdWVQYWlyWzBdfScgQU5EIGNvdmlkX3Z1bG4gbGlrZSAnJHt2YWx1ZVBhaXJbMV19J2A7XHJcbiAgICAgICAgICAvLyBOb3QgdGhlIGZpcnN0IHBhaXIgYW5kIG5vdCB0aGUgbGFzdCBkbyB3ZSBhZGQgdGhlIGBBTkRgXHJcbiAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoID4gMSAmJiBpICE9PSB2YWx1ZS5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlICs9IGAgQU5EIGA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgd2hlcmVDbGF1c2UgPSBgICgke3doZXJlQ2xhdXNlfSkgYDtcclxuICAgICAgcmV0dXJuIHdoZXJlQ2xhdXNlO1xyXG4gICAgICBicmVhaztcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHJldHVybiBcIiA9ICcwMDAwMDAwMDAwJ1wiO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgTFRDTG9va3VwID0gW1xyXG4gIHsgZGJuYW1lOiBcImNoZFwiLCBkaXNwbGF5TmFtZTogXCJDb3JvbmFyeSBBcnRlcnkgRGlzZWFzZVwiIH0sXHJcbiAgeyBkYm5hbWU6IFwiaGVhcnRfZmFpbHVyZVwiLCBkaXNwbGF5TmFtZTogXCJDb25nZXN0aXZlIEhlYXJ0IEZhaWx1cmVcIiB9LFxyXG4gIHsgZGJuYW1lOiBcImNrZFwiLCBkaXNwbGF5TmFtZTogXCJDaHJvbmljIEtpZG5leSBEaXNlYXNlXCIgfSxcclxuICB7IGRibmFtZTogXCJwYWRcIiwgZGlzcGxheU5hbWU6IFwiUGVyaXBoZXJhbCBBcnRlcnkgRGlzZWFzZVwiIH0sXHJcbl07XHJcblxyXG5jb25zdCBGbGFnTG9va3VwID0gW1xyXG4gIHsgZGJuYW1lOiBcIkQub3RoZXJfc2hpZWxkZWRfY2F0ZWdvcnlcIiwgZGlzcGxheU5hbWU6IFwiRGlzdHJpY3QgU2hpZWxkZWRcIiwgdHJ1dGg6IFwiID0gMVwiIH0sXHJcbiAgeyBkYm5hbWU6IFwiRC5hc3Npc3RlZF9jb2xsZWN0aW9uXCIsIGRpc3BsYXlOYW1lOiBcIkFzc2lzdGVkIEJpbiBDb2xsZWN0aW9uXCIsIHRydXRoOiBcIiA9ICdZJ1wiIH0sXHJcbiAgeyBkYm5hbWU6IFwiRC5ob21lX2NhcmVfbGlua1wiLCBkaXNwbGF5TmFtZTogXCJIb21lIENhcmUgTGlua1wiLCB0cnV0aDogXCIgSVMgVFJVRVwiIH0sXHJcbiAgeyBkYm5hbWU6IFwiRC5zaW5nbGVfb2NjdXBhbmN5XCIsIGRpc3BsYXlOYW1lOiBcIlNpbmdsZSBPY2N1cGFuY3lcIiwgdHJ1dGg6IFwiID0gJ1knXCIgfSxcclxuICB7IGRibmFtZTogXCJELmRpc2FibGVkX2ZhY2lsaXRpZXNfZ3JhbnRcIiwgZGlzcGxheU5hbWU6IFwiRGlzYWJsZWQgRmFjaWxpdGllcyBHcmFudFwiLCB0cnV0aDogXCIgSVMgVFJVRVwiIH0sXHJcbiAgeyBkYm5hbWU6IFwiRC5jb3VuY2lsX3RheFwiLCBkaXNwbGF5TmFtZTogXCJDb3VuY2lsIFRheFwiLCB0cnV0aDogXCIgPSAnWSdcIiB9LFxyXG4gIHsgZGJuYW1lOiAnRC5cIm5laWdoYm91cmhvb2RfbGlua2VkX3RvX1BDTlwiJywgZGlzcGxheU5hbWU6IFwiTmVpZ2hib3VyaG9vZCBMaW5rZWQgdG8gUENOXCIsIHRydXRoOiBcIiBJUyBUUlVFXCIgfSxcclxuICB7IGRibmFtZTogXCJELnVuaXZlcnNhbF9jcmVkaXRcIiwgZGlzcGxheU5hbWU6IFwiVW5pdmVyc2FsIENyZWRpdFwiLCB0cnV0aDogXCIgSVMgVFJVRVwiIH0sXHJcbiAgeyBkYm5hbWU6IFwiRC5ob3VzaW5nX2JlbmVmaXRcIiwgZGlzcGxheU5hbWU6IFwiSG91c2luZyBCZW5lZml0XCIsIHRydXRoOiBcIiBJUyBUUlVFXCIgfSxcclxuICB7IGRibmFtZTogXCJELmJ1c2luZXNzX2dyYW50XCIsIGRpc3BsYXlOYW1lOiBcIkJ1c2luZXNzIEdyYW50XCIsIHRydXRoOiBcIiBJUyBUUlVFXCIgfSxcclxuXTtcclxuXHJcbmV4cG9ydCBjb25zdCBfU1FMU2V0dGluZ3M6IExhbWJkYVBHSW5mb1tdID0gW1xyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1wb3N0Z3Jlc3FsLU91dGJyZWFrXCIsXHJcbiAgICBmaWxlbmFtZTogXCJwb3N0Z3Jlc3FsXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJtYXBpbmZvXCIsXHJcbiAgICAgICAgaGFuZGxlcm1ldGhvZDogXCJnZXRCeVF1ZXJ5U3RyaW5nXCIsXHJcbiAgICAgICAgbWV0aG9kVHlwZTogXCJHRVRcIixcclxuICAgICAgICBxdWVyeVN0cmluZzogYFNFTEVDVCAnRmVhdHVyZUNvbGxlY3Rpb24nIEFTIFRZUEUsIGFycmF5X3RvX2pzb24oYXJyYXlfYWdnKGYpKSBBUyBmZWF0dXJlcyBGUk9NICggU0VMRUNUICdGZWF0dXJlJyBBUyBUWVBFLCBTVF9Bc0dlb0pTT04gKGxnLmdlb20sIDQpOjpqc29uIEFTIGdlb21ldHJ5LCByb3dfdG9fanNvbihyb3coaWQsIFwidGltZVwiLCBsYXQsIGxuZywgdG1lLCBvcHRpbV92YXIpLCB0cnVlKSBBUyBwcm9wZXJ0aWVzIEZST00gcHVibGljLmlzb2Nocm9uZV9vdXRicmVhayBBUyBsZykgQVMgZmAsXHJcbiAgICAgICAgcGFyYW1zOiBbXSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwib3V0YnJlYWtcIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1wb3N0Z3Jlc3FsLUdQUHJhY3RpY2VzXCIsXHJcbiAgICBmaWxlbmFtZTogXCJncHByYWN0aWNlc1wiLFxyXG4gICAgZnVuY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiZ2V0QWxsXCIsXHJcbiAgICAgICAgbWV0aG9kVHlwZTogXCJHRVRcIixcclxuICAgICAgICBoYW5kbGVybWV0aG9kOiBcImdldEdlb0pzb25cIixcclxuICAgICAgICBxdWVyeVN0cmluZzogXCJcIixcclxuICAgICAgICBwYXJhbXM6IHtcclxuICAgICAgICAgIHRhYmxlbmFtZTogXCJwdWJsaWMuZ3BzXCIsXHJcbiAgICAgICAgICBzdF9hc2dlb2pzb246IFwiU1RfU2ltcGxpZnkgKGxnLmdlb20sIDAuMDAwMSwgVFJVRSlcIixcclxuICAgICAgICAgIGFzX3Byb3BlcnRpZXM6IGAoc2VsZWN0IHJvd190b19qc29uKF8pIEFTIHByb3BlcnRpZXMgZnJvbSAoc2VsZWN0IGxnLm9yZ2FuaXNhdGlvbl9jb2RlIEFTIFwiQ29kZVwiLFxyXG4gICAgICAgICAgbGcubmFtZSBBUyBcIk5hbWVcIixcclxuICAgICAgICAgIFNUX1gobGcuZ2VvbSkgQVMgXCJMb25nXCIsXHJcbiAgICAgICAgICBTVF9ZKGxnLmdlb20pIEFTIFwiTGF0XCIpIGFzIF8pXHJcbiAgICAgICAgICAtLXJvd190b19qc29uKChvcmdhbmlzYXRpb25fY29kZSwgbmFtZSksIHRydWUpIEFTIHByb3BlcnRpZXNgLFxyXG4gICAgICAgICAgd2hlcmVjbGF1c2U6IFwiV0hFUkUgbGcuY2NnIGluICgnMDBRJywgJzAwUicsICcwMFgnLCAnMDFBJywgJzAxRScsICcwMUsnLCAnMDJHJywgJzAyTScpIEFORCAoTEVGVChsZy5vcmdhbmlzYXRpb25fY29kZSwxKSAhPSAnWScpIE9SIGxnLm9yZ2FuaXNhdGlvbl9jb2RlPSdZMDEwMDgnXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwiZ3BwcmFjdGljZXNcIixcclxuICAgIGN1c3RvbUF1dGg6IFwicHVibGljXCIsXHJcbiAgfSxcclxuICAvLyB7XHJcbiAgLy8gICBuYW1lOiBcImNkay1hcGktcG9zdGdyZXNxbC1Ib3VzZWhvbGRJc29jaHJvbmVcIixcclxuICAvLyAgIGZpbGVuYW1lOiBcInBvc3RncmVzcWxcIixcclxuICAvLyAgIGZ1bmN0aW9uczogW1xyXG4gIC8vICAgICB7XHJcbiAgLy8gICAgICAgbWV0aG9kOiBcImdldEhvdXNlc1dpdGhpbklzb2Nocm9uZVwiLFxyXG4gIC8vICAgICAgIG1ldGhvZFR5cGU6IFwiUE9TVFwiLFxyXG4gIC8vICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0SXNvQ2hyb25lXCIsXHJcbiAgLy8gICAgICAgcXVlcnlTdHJpbmc6IFwiXCIsXHJcbiAgLy8gICAgICAgcGFyYW1zOiBbXSxcclxuICAvLyAgICAgfSxcclxuICAvLyAgIF0sXHJcbiAgLy8gICBiYXNlZW5kcG9pbnQ6IFwiaXNvY2hyb25lXCIsXHJcbiAgLy8gfSxcclxuICAvLyB7XHJcbiAgLy8gICBuYW1lOiBcImNkay1hcGktcG9zdGdyZXNxbC1Cb3VuZGFyaWVzXCIsXHJcbiAgLy8gICBmaWxlbmFtZTogXCJvcmdib3VuZGFyaWVzXCIsXHJcbiAgLy8gICBiYXNlZW5kcG9pbnQ6IFwib3JnYm91bmRhcmllc1wiLFxyXG4gIC8vICAgZnVuY3Rpb25zOiBbXHJcbiAgLy8gICAgIHtcclxuICAvLyAgICAgICBtZXRob2Q6IFwiZ2V0VG9wb0pTT05cIixcclxuICAvLyAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gIC8vICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0R2VvSnNvblwiLFxyXG4gIC8vICAgICAgIHF1ZXJ5U3RyaW5nOiBcIlwiLFxyXG4gIC8vICAgICAgIHBhcmFtczoge1xyXG4gIC8vICAgICAgICAgdGFibGVuYW1lOiBcInB1YmxpYy5pY3BzXCIsXHJcbiAgLy8gICAgICAgICBzdF9hc2dlb2pzb246IFwiU1RfU2ltcGxpZnkgKGxnLmdlb20sIDAuMDAwMSwgVFJVRSlcIixcclxuICAvLyAgICAgICAgIGFzX3Byb3BlcnRpZXM6IGAoc2VsZWN0IHJvd190b19qc29uKF8pIEFTIHByb3BlcnRpZXMgZnJvbSAoc2VsZWN0IGxnLmljcCBBUyBcIklDUFwiKSBhcyBfKVxyXG4gIC8vICAgICAgICAgLS1yb3dfdG9fanNvbigob3JnYW5pc2F0aW9uX2NvZGUsIG5hbWUpLCB0cnVlKSBBUyBwcm9wZXJ0aWVzYCxcclxuICAvLyAgICAgICB9LFxyXG4gIC8vICAgICB9LFxyXG4gIC8vICAgXSxcclxuICAvLyB9LFxyXG4gIC8vIHtcclxuICAvLyAgIG5hbWU6IFwiY2RrLWFwaS1wb3N0Z3Jlc3FsLVBDTkluZm9ybWF0aW9uXCIsXHJcbiAgLy8gICBmaWxlbmFtZTogXCJwb3N0Z3Jlc3FsXCIsXHJcbiAgLy8gICBiYXNlZW5kcG9pbnQ6IFwicGNuaW5mb3JtYXRpb25cIixcclxuICAvLyAgIGZ1bmN0aW9uczogW1xyXG4gIC8vICAgICB7XHJcbiAgLy8gICAgICAgbWV0aG9kOiBcImdldFRvcG9KU09OXCIsXHJcbiAgLy8gICAgICAgbWV0aG9kVHlwZTogXCJHRVRcIixcclxuICAvLyAgICAgICBoYW5kbGVybWV0aG9kOiBcImdldEdlb0pzb25cIixcclxuICAvLyAgICAgICBxdWVyeVN0cmluZzogXCJcIixcclxuICAvLyAgICAgICBwYXJhbXM6IHtcclxuICAvLyAgICAgICAgIHRhYmxlbmFtZTogXCJwdWJsaWMuaWNwc1wiLFxyXG4gIC8vICAgICAgICAgc3RfYXNnZW9qc29uOiBcIlNUX1NpbXBsaWZ5IChsZy5nZW9tLCAwLjAwMDEsIFRSVUUpXCIsXHJcbiAgLy8gICAgICAgICBhc19wcm9wZXJ0aWVzOiBgKHNlbGVjdCByb3dfdG9fanNvbihfKSBBUyBwcm9wZXJ0aWVzIGZyb20gKHNlbGVjdCBsZy5pY3AgQVMgXCJJQ1BcIikgYXMgXykgLS1yb3dfdG9fanNvbigob3JnYW5pc2F0aW9uX2NvZGUsIG5hbWUpLCB0cnVlKSBBUyBwcm9wZXJ0aWVzYCxcclxuICAvLyAgICAgICB9LFxyXG4gIC8vICAgICB9LFxyXG4gIC8vICAgICB7XHJcbiAgLy8gICAgICAgbWV0aG9kOiBcImdldEhleEdlb2pzb25cIixcclxuICAvLyAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gIC8vICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0R2VvSnNvblwiLFxyXG4gIC8vICAgICAgIHF1ZXJ5U3RyaW5nOiBcIlwiLFxyXG4gIC8vICAgICAgIHBhcmFtczoge1xyXG4gIC8vICAgICAgICAgdGFibGVuYW1lOiBcInB1YmxpYy5wY25faGV4X2dlb1wiLFxyXG4gIC8vICAgICAgICAgc3RfYXNnZW9qc29uOiBcImxnLmdlb21cIixcclxuICAvLyAgICAgICAgIGFzX3Byb3BlcnRpZXM6IGAoc2VsZWN0IHJvd190b19qc29uKF8pIEFTIHByb3BlcnRpZXMgZnJvbSAoc2VsZWN0IGlkLCBwY24pIGFzIF8pYCxcclxuICAvLyAgICAgICB9LFxyXG4gIC8vICAgICB9LFxyXG4gIC8vICAgICB7XHJcbiAgLy8gICAgICAgbWV0aG9kOiBcImdldERhdGFcIixcclxuICAvLyAgICAgICBoYW5kbGVybWV0aG9kOiBcImdldEFsbFwiLFxyXG4gIC8vICAgICAgIG1ldGhvZFR5cGU6IFwiR0VUXCIsXHJcbiAgLy8gICAgICAgcXVlcnlTdHJpbmc6IGBwdWJsaWMubW9zYWljcGNuYCxcclxuICAvLyAgICAgICBwYXJhbXM6IFtdLFxyXG4gIC8vICAgICB9LFxyXG4gIC8vICAgXSxcclxuICAvLyB9LFxyXG4gIC8vIHtcclxuICAvLyAgIG5hbWU6IFwiY2RrLWFwaS1wb3N0Z3Jlc3FsLVdhcmRzXCIsXHJcbiAgLy8gICBmaWxlbmFtZTogXCJ3YXJkc1wiLFxyXG4gIC8vICAgYmFzZWVuZHBvaW50OiBcIndhcmRzXCIsXHJcbiAgLy8gICBmdW5jdGlvbnM6IFtcclxuICAvLyAgICAge1xyXG4gIC8vICAgICAgIG1ldGhvZDogXCJnZXRBbGxcIixcclxuICAvLyAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gIC8vICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0R2VvSnNvblwiLFxyXG4gIC8vICAgICAgIHF1ZXJ5U3RyaW5nOiBcIlwiLFxyXG4gIC8vICAgICAgIHBhcmFtczoge1xyXG4gIC8vICAgICAgICAgdGFibGVuYW1lOiBcInB1YmxpYy53YXJkc1wiLFxyXG4gIC8vICAgICAgICAgc3RfYXNnZW9qc29uOiBcIlNUX1NpbXBsaWZ5IChsZy5nZW9tLCAwLjAwMDEsIFRSVUUpXCIsXHJcbiAgLy8gICAgICAgICBhc19wcm9wZXJ0aWVzOiBgKHNlbGVjdCByb3dfdG9fanNvbihfKSBBUyBwcm9wZXJ0aWVzIGZyb20gKHNlbGVjdCBzdF9hcmVhc2hhLCBzdF9sZW5ndGhzLCBvYmplY3RpZCwgbGFkMTVubSwgbGFkMTVjZCwgd2QxNW5tdywgd2QxNW5tLCB3ZDE1Y2QpIGFzIF8pIC0tcm93X3RvX2pzb24oKG9yZ2FuaXNhdGlvbl9jb2RlLCBuYW1lKSwgdHJ1ZSkgQVMgcHJvcGVydGllc2AsXHJcbiAgLy8gICAgICAgfSxcclxuICAvLyAgICAgfSxcclxuICAvLyAgIF0sXHJcbiAgLy8gfSxcclxuICAvLyB7XHJcbiAgLy8gICBuYW1lOiBcImNkay1hcGktcG9zdGdyZXNxbC1HcmFuZEluZGV4XCIsXHJcbiAgLy8gICBmaWxlbmFtZTogXCJwb3N0Z3Jlc3FsXCIsXHJcbiAgLy8gICBiYXNlZW5kcG9pbnQ6IFwiZ3JhbmRpbmRleFwiLFxyXG4gIC8vICAgZnVuY3Rpb25zOiBbXHJcbiAgLy8gICAgIHtcclxuICAvLyAgICAgICBtZXRob2Q6IFwiZ2V0QWxsXCIsXHJcbiAgLy8gICAgICAgbWV0aG9kVHlwZTogXCJHRVRcIixcclxuICAvLyAgICAgICBoYW5kbGVybWV0aG9kOiBcImdldEJ5UXVlcnlTdHJpbmdcIixcclxuICAvLyAgICAgICBxdWVyeVN0cmluZzogZ3JhbmRJbmRleFF1ZXJ5LFxyXG4gIC8vICAgICAgIHBhcmFtczogW10sXHJcbiAgLy8gICAgIH0sXHJcbiAgLy8gICBdLFxyXG4gIC8vIH0sXHJcbiAgLy8ge1xyXG4gIC8vICAgbmFtZTogXCJjZGstYXBpLXBvc3RncmVzcWwtUG9zdENvZGVzXCIsXHJcbiAgLy8gICBmaWxlbmFtZTogXCJwb3N0Z3Jlc3FsXCIsXHJcbiAgLy8gICBiYXNlZW5kcG9pbnQ6IFwicG9zdGNvZGVzXCIsXHJcbiAgLy8gICBmdW5jdGlvbnM6IFtcclxuICAvLyAgICAge1xyXG4gIC8vICAgICAgIG1ldGhvZDogXCJnZXRBbGxcIixcclxuICAvLyAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gIC8vICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0QnlRdWVyeVN0cmluZ1wiLFxyXG4gIC8vICAgICAgIHF1ZXJ5U3RyaW5nOiBgU0VMRUNUICdGZWF0dXJlQ29sbGVjdGlvbicgQVMgVFlQRSwgYXJyYXlfdG9fanNvbihhcnJheV9hZ2coZikpIEFTIGZlYXR1cmVzXHJcbiAgLy8gICAgICAgRlJPTSAoIFNFTEVDVCAnRmVhdHVyZScgQVMgVFlQRSwgU1RfQXNHZW9KU09OIChTVF9TaW1wbGlmeSAobGcuZ2VvbSwgMC4wMDAxLCBUUlVFKSwgNCk6Ompzb24gQVMgZ2VvbWV0cnksIHJvd190b19qc29uKHJvdyhtb3N0eXBlLCBwb3ApLCB0cnVlKSBBUyBwcm9wZXJ0aWVzXHJcbiAgLy8gICAgICAgRlJPTSBtb3NhaWNwb3N0Y29kZSBBUyBsZyApIEFTIGZgLFxyXG4gIC8vICAgICAgIHBhcmFtczogW10sXHJcbiAgLy8gICAgIH0sXHJcbiAgLy8gICBdLFxyXG4gIC8vIH0sXHJcbiAgLy8ge1xyXG4gIC8vICAgbmFtZTogXCJjZGstYXBpLXBvc3RncmVzcWwtUGF0aWVudERlbW9ncmFwaGljc1wiLFxyXG4gIC8vICAgZmlsZW5hbWU6IFwicG9zdGdyZXNxbFwiLFxyXG4gIC8vICAgYmFzZWVuZHBvaW50OiBcImRlbW9ncmFwaGljc1wiLFxyXG4gIC8vICAgZnVuY3Rpb25zOiBbXHJcbiAgLy8gICAgIHtcclxuICAvLyAgICAgICBtZXRob2Q6IFwiZGVtb2dyYXBoaWNzYnluaHNudW1iZXJcIixcclxuICAvLyAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gIC8vICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0QnlSb2xlUXVlcnlBbmRDb25kaXRpb25cIixcclxuICAvLyAgICAgICBxdWVyeVN0cmluZzogYFNFTEVDVCBzZXggQVMgR2VuZGVyLCBuaHNfbnVtYmVyIEFTIE5IU051bWJlciwgYWRkcmVzc19saW5lXzEgQVMgQWRkcmVzc0xpbmUxLCBhZGRyZXNzX2xpbmVfMiBBUyBBZGRyZXNzTGluZTIsIGFkZHJlc3NfbGluZV8zIEFTIEFkZHJlc3NMaW5lMywgYWRkcmVzc19saW5lXzQgQVMgQWRkcmVzc0xpbmU0LCBhZGRyZXNzX2xpbmVfNSBBUyBBZGRyZXNzTGluZTUsIHBvc3Rjb2RlIEFTIFBvc3RDb2RlLCB0aXRsZSBBUyBUaXRsZSwgZm9yZW5hbWUgQVMgRm9yZW5hbWUsIG90aGVyX2ZvcmVuYW1lcyBBUyBPdGhlckZvcmVuYW1lcywgc3VybmFtZSBBUyBTdXJuYW1lLCBkYXRlX29mX2JpcnRoIEFTIERPQiBGUk9NIHB1YmxpYy5wb3B1bGF0aW9uX21hc3RlcmAsXHJcbiAgLy8gICAgICAgcGFyYW1zOiBbXCJuaHNfbnVtYmVyXCJdLFxyXG4gIC8vICAgICAgIHJvbGU6IFwicG9wdWxhdGlvblwiLFxyXG4gIC8vICAgICB9LFxyXG4gIC8vICAgICB7XHJcbiAgLy8gICAgICAgbWV0aG9kOiBcInZhbGlkYXRlTkhTTnVtYmVyXCIsXHJcbiAgLy8gICAgICAgbWV0aG9kVHlwZTogXCJQT1NUXCIsXHJcbiAgLy8gICAgICAgaGFuZGxlcm1ldGhvZDogXCJ2YWxpZGF0ZUV4aXN0c1wiLFxyXG4gIC8vICAgICAgIHF1ZXJ5U3RyaW5nOiBgU0VMRUNUIG5oc19udW1iZXIsIGRhdGVfb2ZfYmlydGggRlJPTSBwdWJsaWMucG9wdWxhdGlvbl9tYXN0ZXJgLFxyXG4gIC8vICAgICAgIHBhcmFtczogW1wibmhzX251bWJlclwiLCBcImRhdGVfb2ZfYmlydGhcIl0sXHJcbiAgLy8gICAgICAgcm9sZTogXCJwb3B1bGF0aW9uXCIsXHJcbiAgLy8gICAgIH0sXHJcbiAgLy8gICAgIHtcclxuICAvLyAgICAgICBtZXRob2Q6IFwiZmluZE15TkhTTnVtYmVyXCIsXHJcbiAgLy8gICAgICAgbWV0aG9kVHlwZTogXCJQT1NUXCIsXHJcbiAgLy8gICAgICAgaGFuZGxlcm1ldGhvZDogXCJ2YWxpZGF0ZUV4aXN0c1wiLFxyXG4gIC8vICAgICAgIHF1ZXJ5U3RyaW5nOiBgU0VMRUNUIG5oc19udW1iZXIgRlJPTSBwdWJsaWMucG9wdWxhdGlvbl9tYXN0ZXJgLFxyXG4gIC8vICAgICAgIHBhcmFtczogW1wic2V4XCIsIFwiZGF0ZV9vZl9iaXJ0aFwiLCBcInBvc3Rjb2RlXCIsIFwiZm9yZW5hbWVcIl0sXHJcbiAgLy8gICAgIH0sXHJcbiAgLy8gICBdLFxyXG4gIC8vIH0sXHJcbl07XHJcbiJdfQ==
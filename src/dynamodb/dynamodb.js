"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._Settings = void 0;
const aws_sdk_1 = require("aws-sdk");
const docClient = new aws_sdk_1.DynamoDB.DocumentClient();
module.exports.decision = (event, context, callback) => {
    const path = event.path;
    const settings = exports._Settings || [];
    const apiSettings = settings.find((x) => x.baseendpoint === path.split("/")[1]);
    const func = apiSettings.functions.find((x) => x === path.split("/")[2].replace("getBy", "getBy-"));
    switch (selectFunction(func, apiSettings)) {
        case "update":
            update(event, context, callback);
            break;
        case "getByID":
            getByID(event, context, callback);
            break;
        case "getByIndex":
            getByIndex(event, context, callback);
            break;
        case "getAllByFilter":
            getAllByFilter(event, context, callback);
            break;
        case "getActive":
            getActive(event, context, callback);
            break;
        case "register":
            register(event, context, callback);
            break;
        case "delete":
            deleteItem(event, context, callback);
            break;
        case "getAll":
        default:
            getAll(event, context, callback);
            break;
    }
};
module.exports.getAll = getAll;
function getAll(event, context, callback) {
    const path = event.path;
    const settings = exports._Settings;
    const apiSettings = settings.find((x) => x.baseendpoint === path.split("/")[1]);
    if (!apiSettings) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    const func = apiSettings.functions.find((x) => x === path.split("/")[2].replace("getBy", "getBy-"));
    if (!func) {
        console.error("API--LAMBDA--DYNAMODB--ERROR: Bad setup, no function.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Query not found.",
        });
        return;
    }
    try {
        getAllFromDB(apiSettings.tablename, (error, result) => {
            if (error) {
                console.error("API--LAMBDA--DYNAMODB--FAILED: " + error);
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
                body: JSON.stringify(result.Items),
            };
            callback(null, response);
        });
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--DYNAMODB--FAILED: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
}
function getAllFromDB(tablename, callback) {
    var params = {
        TableName: tablename,
    };
    docClient.scan(params, callback);
}
module.exports.getByID = getByID;
function getByID(event, context, callback) {
    const path = event.path;
    const settings = exports._Settings;
    const apiSettings = settings.find((x) => x.baseendpoint === path.split("/")[1]);
    if (!apiSettings) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    const func = apiSettings.functions.find((x) => x === path.split("/")[2].replace("getBy", "getBy-"));
    if (!func) {
        console.error("API--LAMBDA--DYNAMODB--ERROR: Bad setup, no function.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Query not found.",
        });
        return;
    }
    try {
        const primarykey = apiSettings.primarykey.name || "id";
        if (!event.queryStringParameters[primarykey]) {
            console.error("API--LAMBDA--DYNAMODB--FAILED: primary key not provided in api call");
            callback(null, {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
                body: "Bad Request. Could not find " + primarykey + " in request.",
            });
            return;
        }
        const tablename = apiSettings.tablename || "undefined";
        getItemByKey(tablename, primarykey, event.queryStringParameters[primarykey], (error, result) => {
            if (error) {
                console.error("API--LAMBDA--DYNAMODB--FAILED: " + error);
                callback(null, {
                    statusCode: error.statusCode || 501,
                    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
                    body: "Could not fetch the item from the Database.",
                });
                return;
            }
            const response = {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify(result.Items),
            };
            callback(null, response);
        });
    }
    catch (tryerror) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: " + tryerror);
        callback(null, {
            statusCode: 501,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Problem with lambda. " + tryerror,
        });
    }
}
function getItemByKey(tablename, keyname, keyvalue, callback) {
    const KeyConditionExpression = "#" + keyname + " = :" + keyname;
    const ExpressionAttributeNames = updateexpressionnames([keyname]);
    const ExpressionAttributeValues = newexpression([keyname], keyvalue);
    var params = {
        TableName: tablename,
        KeyConditionExpression: KeyConditionExpression,
        ExpressionAttributeNames: ExpressionAttributeNames,
        ExpressionAttributeValues: ExpressionAttributeValues,
    };
    docClient.query(params, callback);
}
module.exports.getByIndex = getByIndex;
function getByIndex(event, context, callback) {
    const path = event.path;
    const settings = exports._Settings;
    const apiSettings = settings.find((x) => x.baseendpoint === path.split("/")[1]);
    if (!apiSettings) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    const func = apiSettings.functions.find((x) => x === path.split("/")[2].replace("getBy", "getBy-"));
    if (!func) {
        console.error("API--LAMBDA--DYNAMODB--ERROR: Bad setup, no function.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Query not found.",
        });
        return;
    }
    try {
        const primaryindex = func.split("-")[1] || "id";
        if (!event.queryStringParameters[primaryindex]) {
            console.error("API--LAMBDA--DYNAMODB--FAILED: index not provided in api call");
            callback(null, {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
                body: "Bad Request. Could not find " + primaryindex + " in request.",
            });
            return;
        }
        const tablename = apiSettings.tablename || "undefined";
        getItemByIndex(tablename, primaryindex, event.queryStringParameters[primaryindex], (error, result) => {
            if (error) {
                console.error("API--LAMBDA--DYNAMODB--FAILED: " + error);
                callback(null, {
                    statusCode: error.statusCode || 501,
                    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
                    body: "Could not fetch the item from the Database.",
                });
                return;
            }
            const response = {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify(result.Items),
            };
            callback(null, response);
        });
    }
    catch (tryerror) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: " + tryerror);
        callback(null, {
            statusCode: 501,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Problem with lambda. " + tryerror,
        });
    }
}
function getItemByIndex(tablename, keyname, keyvalue, callback) {
    const KeyConditionExpression = "#" + keyname + " = :" + keyname;
    const ExpressionAttributeNames = updateexpressionnames([keyname]);
    const ExpressionAttributeValues = newexpression([keyname], keyvalue);
    var params = {
        TableName: tablename,
        IndexName: keyname + "-index",
        KeyConditionExpression: KeyConditionExpression,
        ExpressionAttributeNames: ExpressionAttributeNames,
        ExpressionAttributeValues: ExpressionAttributeValues,
    };
    docClient.query(params, callback);
}
function getItemByDualIndex(tablename, keynames, keyvalues, callback) {
    const KeyConditionExpression = "#" + keynames[0] + " = :" + keynames[0] + " AND #" + keynames[1] + " = :" + keynames[1];
    const ExpressionAttributeNames = updateexpressionnames(keynames);
    const ExpressionAttributeValues = newexpressions(keynames, keyvalues);
    var params = {
        TableName: tablename,
        IndexName: keynames[0] + "-" + keynames[1] + "-index",
        KeyConditionExpression: KeyConditionExpression,
        ExpressionAttributeNames: ExpressionAttributeNames,
        ExpressionAttributeValues: ExpressionAttributeValues,
    };
    docClient.query(params, callback);
}
module.exports.getAllByFilter = (event, context, callback) => {
    const path = event.path;
    const settings = exports._Settings;
    const apiSettings = settings.find((x) => x.baseendpoint === path.split("/")[1]);
    if (!apiSettings) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    const func = apiSettings.functions.find((x) => x === path.split("/")[2].replace("getBy", "getBy-"));
    if (!func) {
        console.error("API--LAMBDA--DYNAMODB--ERROR: Bad setup, no function.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Query not found.",
        });
        return;
    }
    const indexinfo = findIndexInfo(func, apiSettings);
    if (!apiSettings.tablename || indexinfo) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename or filter.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    try {
        getAllByFilter(apiSettings.tablename, indexinfo, (error, result) => {
            if (error) {
                console.error("API--LAMBDA--DYNAMODB--FAILED: " + error);
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
                body: JSON.stringify(result.Items),
            };
            callback(null, response);
        });
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--DYNAMODB--FAILED: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
};
function getAllByFilter(tablename, filter, callback) {
    var params = {
        TableName: tablename,
        FilterExpression: filter,
    };
    docClient.scan(params, callback);
}
function getAllByFilterValue(tablename, filter, filtername, filtervalue, callback) {
    const ExpressionAttributeNames = updateexpressionnames(filtername);
    const ExpressionAttributeValues = newexpression([filtername], filtervalue);
    var params = {
        TableName: tablename,
        FilterExpression: filter,
        ExpressionAttributeValues: ExpressionAttributeValues,
        ExpressionAttributeNames: ExpressionAttributeNames,
    };
    docClient.scan(params, callback);
}
function getAllByFilterValues(tablename, filter, filternames, filtervalues, callback) {
    const ExpressionAttributeNames = updateexpressionnames(filternames);
    const ExpressionAttributeValues = newexpressions(filternames, filtervalues);
    var params = {
        TableName: tablename,
        FilterExpression: filter,
        ExpressionAttributeValues: ExpressionAttributeValues,
        ExpressionAttributeNames: ExpressionAttributeNames,
    };
    docClient.scan(params, callback);
}
module.exports.getActive = getActive;
function getActive(event, context, callback) {
    const path = event.path;
    const settings = exports._Settings;
    const apiSettings = settings.find((x) => x.baseendpoint === path.split("/")[1]);
    if (!apiSettings) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    const func = apiSettings.functions.find((x) => x === path.split("/")[2].replace("getBy", "getBy-"));
    if (!func) {
        console.error("API--LAMBDA--DYNAMODB--ERROR: Bad setup, no function.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Query not found.",
        });
        return;
    }
    const indexinfo = findIndexInfo(func, apiSettings);
    if (!apiSettings.tablename || !indexinfo) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename or filter.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    try {
        getActiveItems(apiSettings.tablename, indexinfo, (error, result) => {
            if (error) {
                console.error("API--LAMBDA--DYNAMODB--FAILED: " + error);
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
                body: JSON.stringify(result.Items),
            };
            callback(null, response);
        });
    }
    catch (error) {
        var body = JSON.stringify(error, null, 2);
        console.error("API--LAMBDA--DYNAMODB--FAILED: " + JSON.stringify(body));
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        });
    }
}
function getActiveItems(tablename, filter, callback) {
    var params = {
        TableName: tablename,
        FilterExpression: filter,
        ExpressionAttributeValues: {
            ":DateTime": new Date().toISOString(),
        },
    };
    docClient.scan(params, callback);
}
module.exports.register = register;
function register(event, context, callback) {
    var _a;
    const path = event.path;
    const settings = exports._Settings;
    const apiSettings = settings.find((x) => x.baseendpoint === path.split("/")[1]);
    if (!apiSettings) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    const func = apiSettings.functions.find((x) => x === path.split("/")[2].replace("getBy", "getBy-"));
    if (!func) {
        console.error("API--LAMBDA--DYNAMODB--ERROR: Bad setup, no function.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Query not found.",
        });
        return;
    }
    const tablename = apiSettings.tablename || "undefined";
    const primarykey = apiSettings.primarykey.name || "id";
    const secondarykey = ((_a = apiSettings.secondarykey) === null || _a === void 0 ? void 0 : _a.name) || "";
    if (!tablename || !apiSettings.fields) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    try {
        const payload = event.body;
        if (!event.body || !checkPayload(payload, primarykey, secondarykey, apiSettings.fields)) {
            console.error("API--LAMBDA--DYNAMODB--FAILED: Improper payload: " + event.body);
            callback(null, {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                body: JSON.stringify({ msg: "Bad Request. Could not find full payload of request.", params: event }),
            });
            return;
        }
        const newItem = convertToAWSItem(JSON.parse(payload), primarykey, secondarykey, apiSettings.fields);
        console.log(newItem);
        addItem(tablename, newItem, (error, result) => {
            if (error) {
                console.error("API--LAMBDA--DYNAMODB--FAILED: Unable to add item: " + error);
                callback(null, {
                    statusCode: error.statusCode || 501,
                    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                    body: JSON.stringify({ success: false, msg: "Failed to register: " + error, item: newItem }),
                });
                return;
            }
            const response = {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                body: JSON.stringify({ success: true, msg: "Registered" }),
            };
            callback(null, response);
        });
    }
    catch (tryerror) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Register function error: " + tryerror);
        callback(null, {
            statusCode: 501,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Problem with lambda. " + tryerror,
        });
    }
}
function convertToAWSItem(payload, primarykey, secondarykey, fields) {
    const fieldsobj = JSON.parse(fields);
    let Item = {};
    const primPropType = propType(primarykey, payload, fieldsobj);
    Item[primarykey] = primPropType;
    if (secondarykey !== "" && payload[secondarykey]) {
        const secPropType = propType(secondarykey, payload, fieldsobj);
        Item[secondarykey] = secPropType;
    }
    fieldsobj.forEach((field) => {
        if (payload[field.name]) {
            const selPropType = propType(field.name, payload, fieldsobj);
            Item[field.name] = selPropType;
        }
    });
    return Item;
}
function propType(field, value, fieldsobj) {
    const fieldFull = fieldsobj.filter((x) => x.name === field);
    if (!fieldFull || fieldFull.length === 0) {
        return { S: value[field] };
    }
    switch (fieldFull[0].type) {
        case "byte":
            return { B: value[fieldFull[0].name] };
        case "boolean":
            return { BOOL: value[fieldFull[0].name] };
        case "number":
            return { N: value[fieldFull[0].name].toString() };
        case "array_byte":
            return { BS: value[fieldFull[0].name] };
        case "array_number":
            return { NS: value[fieldFull[0].name] };
        case "array_string":
            return { SS: value[fieldFull[0].name] };
        default:
            return { S: value[fieldFull[0].name] };
    }
}
function checkPayload(newpayload, primarykey, secondarykey, fields) {
    const fieldsobj = JSON.parse(fields);
    const payload = JSON.parse(newpayload);
    const keys = Object.keys(payload);
    if (!payload[primarykey])
        return false;
    if (secondarykey !== "" && !payload[secondarykey])
        return false;
    let flag = true;
    fieldsobj.forEach((field) => {
        if (field.required && !keys.includes(field.name))
            flag = false;
    });
    return flag;
}
function addItem(tablename, newItem, callback) {
    var client = new aws_sdk_1.DynamoDB();
    var params = {
        TableName: tablename,
        Item: newItem,
    };
    client.putItem(params, callback);
}
module.exports.delete = deleteItem;
function deleteItem(event, context, callback) {
    var _a;
    const path = event.path;
    const settings = exports._Settings;
    const apiSettings = settings.find((x) => x.baseendpoint === path.split("/")[1]);
    if (!apiSettings) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    const func = apiSettings.functions.find((x) => x === path.split("/")[2].replace("getBy", "getBy-"));
    if (!func) {
        console.error("API--LAMBDA--DYNAMODB--ERROR: Bad setup, no function.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Query not found.",
        });
        return;
    }
    const tablename = apiSettings.tablename || "undefined";
    const primarykey = apiSettings.primarykey.name || "id";
    const secondarykey = ((_a = apiSettings.secondarykey) === null || _a === void 0 ? void 0 : _a.name) || "";
    if (!tablename || !apiSettings.fields) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    try {
        const payload = JSON.parse(event.body);
        if (!event.body || !payload || !payload[primarykey]) {
            console.error("API--LAMBDA--DYNAMODB--FAILED: Improper payload: " + event.body);
            callback(null, {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                body: JSON.stringify({ msg: "Bad Request. Could not find full key.", params: event }),
            });
            return;
        }
        let key = {};
        key[primarykey] = payload[primarykey];
        if (secondarykey !== "")
            key[secondarykey] = payload[secondarykey];
        removeItem(tablename, key, (error, result) => {
            if (error) {
                console.error("API--LAMBDA--DYNAMODB--FAILED: Unable to remove item: " + error);
                callback(null, {
                    statusCode: error.statusCode || 501,
                    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                    body: JSON.stringify({ success: false, msg: "Failed to remove item : " + error, key: key }),
                });
                return;
            }
            const response = {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                body: JSON.stringify({ success: true, msg: "Removed" }),
            };
            callback(null, response);
        });
    }
    catch (tryerror) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Delete function error: " + tryerror);
        callback(null, {
            statusCode: 501,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Problem with lambda. " + tryerror,
        });
    }
}
function removeItem(tablename, key, callback) {
    var getparams = {
        TableName: tablename,
        Key: key,
    };
    docClient.delete(getparams, (err, result) => {
        if (err)
            callback(err, { status: 400, msg: err });
        else
            callback(null, { status: 200, msg: result });
    });
}
module.exports.update = update;
function update(event, context, callback) {
    var _a;
    const path = event.path;
    const settings = exports._Settings;
    const apiSettings = settings.find((x) => x.baseendpoint === path.split("/")[1]);
    if (!apiSettings) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    const func = apiSettings.functions.find((x) => x === path.split("/")[2].replace("getBy", "getBy-"));
    if (!func) {
        console.error("API--LAMBDA--DYNAMODB--ERROR: Bad setup, no function.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Query not found.",
        });
        return;
    }
    const tablename = apiSettings.tablename || "undefined";
    const primarykey = apiSettings.primarykey.name || "id";
    const secondarykey = ((_a = apiSettings.secondarykey) === null || _a === void 0 ? void 0 : _a.name) || "";
    if (!tablename || !apiSettings.fields) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Bad setup, no tablename.");
        callback(null, {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Bad Request. Table not found.",
        });
        return;
    }
    try {
        const payload = JSON.parse(event.body);
        if (!event.body || !payload || !payload[primarykey]) {
            console.error("API--LAMBDA--DYNAMODB--FAILED: Improper payload: " + event.body);
            callback(null, {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                body: JSON.stringify({ msg: "Bad Request. Could not find full key.", params: event }),
            });
            return;
        }
        let key = [primarykey];
        if (secondarykey !== "")
            key.push(secondarykey);
        updateItem(tablename, key, payload, (error, result) => {
            if (error) {
                console.error("API--LAMBDA--DYNAMODB--FAILED: Unable to update item: " + error);
                callback(null, {
                    statusCode: error.statusCode || 501,
                    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                    body: JSON.stringify({ success: false, msg: "Failed to update item : " + error, key: key }),
                });
                return;
            }
            const response = {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                body: JSON.stringify({ success: true, msg: "Updated", response: result }),
            };
            callback(null, response);
        });
    }
    catch (tryerror) {
        console.error("API--LAMBDA--DYNAMODB--FAILED: Delete function error: " + tryerror);
        callback(null, {
            statusCode: 501,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
            body: "Problem with lambda. " + tryerror,
        });
    }
}
function updateItem(tablename, filters, updatedItem, callback) {
    let fields = Object.keys(updatedItem);
    fields = fields.filter((x) => !filters.includes(x));
    const update = "set " + updatefields(fields);
    const expressionvals = updateexpression(fields, updatedItem);
    const expressionnames = updateexpressionnames(fields);
    const keys = setkeys(filters, updatedItem);
    var params = {
        TableName: tablename,
        Key: keys,
        UpdateExpression: update,
        ExpressionAttributeValues: expressionvals,
        ExpressionAttributeNames: expressionnames,
        ReturnValues: "UPDATED_NEW",
    };
    docClient.update(params, callback);
}
function setkeys(fields, item) {
    let exp = {};
    fields.forEach((val) => {
        exp[val] = item[val];
    });
    return exp;
}
function updatefields(fields) {
    let output = "";
    fields.forEach((val) => {
        output += "#" + val + "=:" + val + ",";
    });
    return output.substring(0, output.length - 1);
}
function updateexpression(fields, updateItem) {
    let exp = {};
    fields.forEach((val) => {
        exp[":" + val] = updateItem[val];
    });
    return exp;
}
function newexpression(fields, updateItem) {
    let exp = {};
    fields.forEach((val) => {
        exp[":" + val] = updateItem;
    });
    return exp;
}
function newexpressions(fields, items) {
    let exp = {};
    for (let index = 0; index < fields.length; index++) {
        exp[":" + fields[index]] = items[index];
    }
    return exp;
}
function updateexpressionnames(fields) {
    let exp = {};
    fields.forEach((val) => {
        exp["#" + val] = val;
    });
    return exp;
}
function findIndexInfo(func, api) {
    if (func.includes("getBy-")) {
        const value = func.split("-")[1];
        if (value)
            return func.split("-")[1];
        return "";
    }
    if (func.includes("getAllByFilter-")) {
        const value = func.split("-")[1];
        if (value)
            return api.customfilters[value];
        return "";
    }
    if (func.includes("getActive"))
        return api.customfilters["getActive"];
    return "";
}
function selectFunction(func, api) {
    var _a;
    if (func.includes("getBy-")) {
        const value = func.split("-")[1];
        if (value === ((_a = api.primarykey) === null || _a === void 0 ? void 0 : _a.name))
            return "getByID";
        return "getByIndex";
    }
    if (func.includes("getAllByFilter-")) {
        const value = func.split("-")[1];
        return "getAllByFilter";
    }
    return func;
}
exports._Settings = [
    {
        name: "cdk-api-dynamodb-AccessLogs",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["getAll", "getBy-date", "register"],
        tablename: "nhsbi_access_logs",
        baseendpoint: "accesslogs",
        primarykey: { name: "date", type: "string" },
        secondarykey: { name: "time#org#username", type: "string" },
        fields: [
            { name: "data", type: "string" },
            { name: "time", type: "string", required: true },
            { name: "type", type: "string", required: true },
            { name: "username#org", type: "string", required: true },
        ],
    },
    {
        name: "cdk-api-dynamodb-Apps",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["getAll", "getBy-name", "getBy-environment", "getBy-status", "getBy-ownerName", "register", "delete", "update"],
        tablename: "nhsbi_apps",
        baseendpoint: "apps",
        primarykey: { name: "name", type: "string" },
        secondarykey: { name: "environment", type: "string" },
        fields: [
            { name: "description", type: "string", required: true },
            { name: "icon", type: "string", required: true },
            { name: "ownerEmail", type: "string", required: true },
            { name: "ownerName", type: "string", required: true },
            { name: "status", type: "string", required: true },
            { name: "url", type: "string", required: true },
            { name: "images", type: "array_string", required: false },
        ],
    },
    {
        name: "cdk-api-dynamodb-Apps-Public",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["getAll"],
        tablename: "nhsbi_apps",
        baseendpoint: "publicapps",
        primarykey: { name: "name", type: "string" },
        secondarykey: { name: "environment", type: "string" },
        fields: [
            { name: "description", type: "string", required: true },
            { name: "icon", type: "string", required: true },
            { name: "ownerEmail", type: "string", required: true },
            { name: "ownerName", type: "string", required: true },
            { name: "status", type: "string", required: true },
            { name: "url", type: "string", required: true },
            { name: "images", type: "array_string", required: false },
        ],
        customAuth: "public",
    },
    {
        name: "cdk-api-dynamodb-FormSubmissions",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["getAll", "getBy-id", "register", "delete", "update"],
        tablename: "nhsbi_form_submissions",
        baseendpoint: "formsubmissions",
        primarykey: { name: "id", type: "string" },
        fields: [
            { name: "created_at", type: "string", required: true },
            { name: "data", type: "string", required: true },
            { name: "parentid", type: "string" },
            { name: "type", type: "string", required: true },
        ],
    },
    {
        name: "cdk-api-dynamodb-Newsfeeds",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["getAll", "getBy-id", "getBy-destination", "register", "delete", "update"],
        tablename: "nhsbi_newsfeeds",
        baseendpoint: "newsfeeds",
        primarykey: { name: "destination", type: "string" },
        secondarykey: { name: "type", type: "string" },
        fields: [
            { name: "priority", type: "number", required: true },
            { name: "isArchived", type: "boolean", required: true },
        ],
    },
    {
        name: "cdk-api-dynamodb-Organisations",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["update", "register", "delete", "getBy-code"],
        tablename: "nhsbi_organisations",
        baseendpoint: "organisations",
        primarykey: { name: "name", type: "string" },
        secondarykey: { name: "code", type: "string" },
        fields: [
            { name: "authmethod", type: "string", required: true },
            { name: "contact", type: "string", required: true },
        ],
    },
    {
        name: "cdk-api-dynamodb-Organisations-Public",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["getAll", "getBy-name"],
        tablename: "nhsbi_organisations",
        baseendpoint: "organisation",
        primarykey: { name: "name", type: "string" },
        secondarykey: { name: "code", type: "string" },
        fields: [
            { name: "authmethod", type: "string", required: true },
            { name: "contact", type: "string", required: true },
        ],
        customAuth: "public",
    },
    {
        name: "cdk-api-dynamodb-SystemAlerts",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["update", "register", "delete", "getAll", "getBy-id", "getActive"],
        customfilters: {
            getActive: ":DateTime BETWEEN startdate AND enddate",
        },
        tablename: "nhsbi_systemalerts",
        baseendpoint: "systemalerts",
        primarykey: { name: "id", type: "string" },
        secondarykey: { name: "author", type: "string" },
        fields: [
            { name: "name", type: "string", required: true },
            { name: "message", type: "string", required: true },
            { name: "startdate", type: "string", required: true },
            { name: "enddate", type: "string", required: true },
            { name: "status", type: "string", required: true },
            { name: "icon", type: "string", required: true },
        ],
    },
    {
        name: "cdk-api-dynamodb-SystemAlerts-Public",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["getAll"],
        tablename: "nhsbi_systemalerts",
        baseendpoint: "systemalert",
        primarykey: { name: "id", type: "string" },
        fields: [
            { name: "name", type: "boolean", required: true },
            { name: "message", type: "string", required: true },
            { name: "startdate", type: "string", required: true },
            { name: "enddate", type: "string", required: true },
            { name: "status", type: "string", required: true },
            { name: "icon", type: "string", required: true },
            { name: "author", type: "string", required: true },
        ],
        customAuth: "public",
    },
    {
        name: "cdk-api-dynamodb-Teams",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["update", "register", "delete", "getAll", "getBy-id", "getBy-code", "getBy-organisationcode"],
        tablename: "nhsbi_teams",
        baseendpoint: "teams",
        primarykey: { name: "id", type: "string" },
        secondarykey: { name: "code", type: "string" },
        fields: [
            { name: "descrition", type: "string", required: true },
            { name: "name", type: "string", required: true },
            { name: "organisationcode", type: "string" },
            { name: "responsiblepeople", type: "string_array" },
        ],
    },
    {
        name: "cdk-api-dynamodb-TeamMembers",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["update", "register", "delete", "getAll", "getBy-id", "getBy-teamcode", "getBy-username"],
        tablename: "nhsbi_teammembers",
        baseendpoint: "teammembers",
        primarykey: { name: "id", type: "string" },
        secondarykey: { name: "teamcode", type: "string" },
        fields: [
            { name: "username", type: "string", required: true },
            { name: "joindate", type: "string", required: true },
            { name: "rolecode", type: "string" },
            { name: "enddate", type: "string" },
        ],
    },
    {
        name: "cdk-api-dynamodb-TeamRequests",
        type: "dynamodb",
        filename: "dynamodb",
        functions: ["update", "register", "delete", "getAll", "getBy-id", "getBy-teamcode", "getBy-username"],
        tablename: "nhsbi_teamrequests",
        baseendpoint: "teamrequests",
        primarykey: { name: "id", type: "string" },
        secondarykey: { name: "teamcode", type: "string" },
        fields: [
            { name: "username", type: "string", required: true },
            { name: "requestor", type: "string", required: true },
            { name: "requestdate", type: "string", required: true },
            { name: "approveddate", type: "string" },
            { name: "refuseddate", type: "string" },
            { name: "requestapprover", type: "string" },
        ],
    },
    {
        name: "cdk-api-dynamodb-Users",
        type: "dynamodb",
        filename: "dynamodb",
        functions: [],
        tablename: "nhsbi_users",
        baseendpoint: "users",
        primarykey: { name: "username", type: "string" },
        secondarykey: { name: "organisation", type: "string" },
        fields: [
            { name: "email", type: "string", required: true },
            { name: "linemanager", type: "string", required: true },
            { name: "name", type: "string", required: true },
            { name: "password", type: "string", required: true },
            { name: "password_expires", type: "string", required: true },
        ],
    },
    {
        name: "cdk-api-dynamodb-VerificationCodes",
        type: "dynamodb",
        filename: "dynamodb",
        functions: [],
        tablename: "nhsbi_verificationcodes",
        baseendpoint: "verificationcodes",
        primarykey: { name: "code", type: "string" },
        secondarykey: { name: "username", type: "string" },
        fields: [
            { name: "generated", type: "string", required: true },
            { name: "organisation", type: "string" },
        ],
    },
    {
        name: "cdk-api-dynamodb-MFA",
        type: "dynamodb",
        filename: "dynamodb",
        functions: [],
        tablename: "nhsbi_mfa",
        baseendpoint: "mfa",
        primarykey: { name: "username", type: "string" },
        secondarykey: { name: "verification", type: "string" },
        fields: [],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkeW5hbW9kYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBbUM7QUFDbkMsTUFBTSxTQUFTLEdBQUcsSUFBSSxrQkFBUSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBRWhELE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsS0FBVSxFQUFFLE9BQVksRUFBRSxRQUFhLEVBQUUsRUFBRTtJQUNwRSxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0lBQ3hCLE1BQU0sUUFBUSxHQUFHLGlCQUFTLElBQUksRUFBRSxDQUFDO0lBQ2pDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hGLE1BQU0sSUFBSSxHQUFHLFdBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDckcsUUFBUSxjQUFjLENBQUMsSUFBSyxFQUFFLFdBQVksQ0FBQyxFQUFFO1FBQzNDLEtBQUssUUFBUTtZQUNYLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLE1BQU07UUFDUixLQUFLLFNBQVM7WUFDWixPQUFPLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNsQyxNQUFNO1FBQ1IsS0FBSyxZQUFZO1lBQ2YsVUFBVSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFD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LEVBQUU7UUFDYixTQUFTLEVBQUUseUJBQXlCO1FBQ3BDLFlBQVksRUFBRSxtQkFBbUI7UUFDakMsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzVDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUNsRCxNQUFNLEVBQUU7WUFDTixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO1lBQ3JELEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQ3pDO0tBQ0Y7SUFDRDtRQUNFLElBQUksRUFBRSxzQkFBc0I7UUFDNUIsSUFBSSxFQUFFLFVBQVU7UUFDaEIsUUFBUSxFQUFFLFVBQVU7UUFDcEIsU0FBUyxFQUFFLEVBQUU7UUFDYixTQUFTLEVBQUUsV0FBVztRQUN0QixZQUFZLEVBQUUsS0FBSztRQUNuQixVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDaEQsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQ3RELE1BQU0sRUFBRSxFQUFFO0tBQ1g7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRHluYW1vREIgfSBmcm9tIFwiYXdzLXNka1wiO1xyXG5jb25zdCBkb2NDbGllbnQgPSBuZXcgRHluYW1vREIuRG9jdW1lbnRDbGllbnQoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzLmRlY2lzaW9uID0gKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkgPT4ge1xyXG4gIGNvbnN0IHBhdGggPSBldmVudC5wYXRoO1xyXG4gIGNvbnN0IHNldHRpbmdzID0gX1NldHRpbmdzIHx8IFtdO1xyXG4gIGNvbnN0IGFwaVNldHRpbmdzID0gc2V0dGluZ3MuZmluZCgoeCkgPT4geC5iYXNlZW5kcG9pbnQgPT09IHBhdGguc3BsaXQoXCIvXCIpWzFdKTtcclxuICBjb25zdCBmdW5jID0gYXBpU2V0dGluZ3MhLmZ1bmN0aW9ucy5maW5kKCh4KSA9PiB4ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsyXS5yZXBsYWNlKFwiZ2V0QnlcIiwgXCJnZXRCeS1cIikpO1xyXG4gIHN3aXRjaCAoc2VsZWN0RnVuY3Rpb24oZnVuYyEsIGFwaVNldHRpbmdzISkpIHtcclxuICAgIGNhc2UgXCJ1cGRhdGVcIjpcclxuICAgICAgdXBkYXRlKGV2ZW50LCBjb250ZXh0LCBjYWxsYmFjayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcImdldEJ5SURcIjpcclxuICAgICAgZ2V0QnlJRChldmVudCwgY29udGV4dCwgY2FsbGJhY2spO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJnZXRCeUluZGV4XCI6XHJcbiAgICAgIGdldEJ5SW5kZXgoZXZlbnQsIGNvbnRleHQsIGNhbGxiYWNrKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiZ2V0QWxsQnlGaWx0ZXJcIjpcclxuICAgICAgZ2V0QWxsQnlGaWx0ZXIoZXZlbnQsIGNvbnRleHQsIGNhbGxiYWNrKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiZ2V0QWN0aXZlXCI6XHJcbiAgICAgIGdldEFjdGl2ZShldmVudCwgY29udGV4dCwgY2FsbGJhY2spO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJyZWdpc3RlclwiOlxyXG4gICAgICByZWdpc3RlcihldmVudCwgY29udGV4dCwgY2FsbGJhY2spO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJkZWxldGVcIjpcclxuICAgICAgZGVsZXRlSXRlbShldmVudCwgY29udGV4dCwgY2FsbGJhY2spO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJnZXRBbGxcIjpcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIGdldEFsbChldmVudCwgY29udGV4dCwgY2FsbGJhY2spO1xyXG4gICAgICBicmVhaztcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5nZXRBbGwgPSBnZXRBbGw7XHJcbmZ1bmN0aW9uIGdldEFsbChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICBjb25zdCBwYXRoID0gZXZlbnQucGF0aDtcclxuICBjb25zdCBzZXR0aW5ncyA9IF9TZXR0aW5ncztcclxuICBjb25zdCBhcGlTZXR0aW5ncyA9IHNldHRpbmdzLmZpbmQoKHgpID0+IHguYmFzZWVuZHBvaW50ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsxXSk7XHJcbiAgaWYgKCFhcGlTZXR0aW5ncykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBCYWQgc2V0dXAsIG5vIHRhYmxlbmFtZS5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gVGFibGUgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGZ1bmMgPSBhcGlTZXR0aW5ncy5mdW5jdGlvbnMuZmluZCgoeCkgPT4geCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMl0ucmVwbGFjZShcImdldEJ5XCIsIFwiZ2V0QnktXCIpKTtcclxuICBpZiAoIWZ1bmMpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUVSUk9SOiBCYWQgc2V0dXAsIG5vIGZ1bmN0aW9uLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBRdWVyeSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGdldEFsbEZyb21EQihhcGlTZXR0aW5ncy50YWJsZW5hbWUsIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICAgIGJvZHk6IFwiQ291bGQgbm90IHJlYWNoIERhdGFiYXNlLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5JdGVtcyksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICB2YXIgYm9keSA9IEpTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogXCIgKyBKU09OLnN0cmluZ2lmeShib2R5KSk7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QWxsRnJvbURCKHRhYmxlbmFtZTogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgdmFyIHBhcmFtcyA9IHtcclxuICAgIFRhYmxlTmFtZTogdGFibGVuYW1lLFxyXG4gIH07XHJcbiAgZG9jQ2xpZW50LnNjYW4ocGFyYW1zLCBjYWxsYmFjayk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLmdldEJ5SUQgPSBnZXRCeUlEO1xyXG5mdW5jdGlvbiBnZXRCeUlEKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIGNvbnN0IHBhdGggPSBldmVudC5wYXRoO1xyXG4gIGNvbnN0IHNldHRpbmdzID0gX1NldHRpbmdzO1xyXG4gIGNvbnN0IGFwaVNldHRpbmdzID0gc2V0dGluZ3MuZmluZCgoeCkgPT4geC5iYXNlZW5kcG9pbnQgPT09IHBhdGguc3BsaXQoXCIvXCIpWzFdKTtcclxuICBpZiAoIWFwaVNldHRpbmdzKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEJhZCBzZXR1cCwgbm8gdGFibGVuYW1lLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBUYWJsZSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgZnVuYyA9IGFwaVNldHRpbmdzLmZ1bmN0aW9ucy5maW5kKCh4KSA9PiB4ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsyXS5yZXBsYWNlKFwiZ2V0QnlcIiwgXCJnZXRCeS1cIikpO1xyXG4gIGlmICghZnVuYykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRVJST1I6IEJhZCBzZXR1cCwgbm8gZnVuY3Rpb24uXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFF1ZXJ5IG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgcHJpbWFyeWtleSA9IGFwaVNldHRpbmdzLnByaW1hcnlrZXkubmFtZSB8fCBcImlkXCI7XHJcbiAgICBpZiAoIWV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVyc1twcmltYXJ5a2V5XSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IHByaW1hcnkga2V5IG5vdCBwcm92aWRlZCBpbiBhcGkgY2FsbFwiKTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIENvdWxkIG5vdCBmaW5kIFwiICsgcHJpbWFyeWtleSArIFwiIGluIHJlcXVlc3QuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCB0YWJsZW5hbWUgPSBhcGlTZXR0aW5ncy50YWJsZW5hbWUgfHwgXCJ1bmRlZmluZWRcIjtcclxuICAgIGdldEl0ZW1CeUtleSh0YWJsZW5hbWUsIHByaW1hcnlrZXksIGV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVyc1twcmltYXJ5a2V5XSwgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgICAgYm9keTogXCJDb3VsZCBub3QgZmV0Y2ggdGhlIGl0ZW0gZnJvbSB0aGUgRGF0YWJhc2UuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0Lkl0ZW1zKSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAodHJ5ZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogXCIgKyB0cnllcnJvcik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDUwMSxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJQcm9ibGVtIHdpdGggbGFtYmRhLiBcIiArIHRyeWVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRJdGVtQnlLZXkodGFibGVuYW1lOiBzdHJpbmcsIGtleW5hbWU6IGFueSwga2V5dmFsdWU6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIGNvbnN0IEtleUNvbmRpdGlvbkV4cHJlc3Npb24gPSBcIiNcIiArIGtleW5hbWUgKyBcIiA9IDpcIiArIGtleW5hbWU7XHJcbiAgY29uc3QgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0gdXBkYXRlZXhwcmVzc2lvbm5hbWVzKFtrZXluYW1lXSk7XHJcbiAgY29uc3QgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyA9IG5ld2V4cHJlc3Npb24oW2tleW5hbWVdLCBrZXl2YWx1ZSk7XHJcbiAgdmFyIHBhcmFtcyA9IHtcclxuICAgIFRhYmxlTmFtZTogdGFibGVuYW1lLFxyXG4gICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogS2V5Q29uZGl0aW9uRXhwcmVzc2lvbixcclxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzLFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczogRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyxcclxuICB9O1xyXG4gIGRvY0NsaWVudC5xdWVyeShwYXJhbXMsIGNhbGxiYWNrKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0QnlJbmRleCA9IGdldEJ5SW5kZXg7XHJcbmZ1bmN0aW9uIGdldEJ5SW5kZXgoZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgY29uc3QgcGF0aCA9IGV2ZW50LnBhdGg7XHJcbiAgY29uc3Qgc2V0dGluZ3MgPSBfU2V0dGluZ3M7XHJcbiAgY29uc3QgYXBpU2V0dGluZ3MgPSBzZXR0aW5ncy5maW5kKCh4KSA9PiB4LmJhc2VlbmRwb2ludCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMV0pO1xyXG4gIGlmICghYXBpU2V0dGluZ3MpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogQmFkIHNldHVwLCBubyB0YWJsZW5hbWUuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFRhYmxlIG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBmdW5jID0gYXBpU2V0dGluZ3MuZnVuY3Rpb25zLmZpbmQoKHgpID0+IHggPT09IHBhdGguc3BsaXQoXCIvXCIpWzJdLnJlcGxhY2UoXCJnZXRCeVwiLCBcImdldEJ5LVwiKSk7XHJcbiAgaWYgKCFmdW5jKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1FUlJPUjogQmFkIHNldHVwLCBubyBmdW5jdGlvbi5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gUXVlcnkgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwcmltYXJ5aW5kZXggPSBmdW5jLnNwbGl0KFwiLVwiKVsxXSB8fCBcImlkXCI7XHJcbiAgICBpZiAoIWV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVyc1twcmltYXJ5aW5kZXhdKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogaW5kZXggbm90IHByb3ZpZGVkIGluIGFwaSBjYWxsXCIpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gQ291bGQgbm90IGZpbmQgXCIgKyBwcmltYXJ5aW5kZXggKyBcIiBpbiByZXF1ZXN0LlwiLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdGFibGVuYW1lID0gYXBpU2V0dGluZ3MudGFibGVuYW1lIHx8IFwidW5kZWZpbmVkXCI7XHJcbiAgICBnZXRJdGVtQnlJbmRleCh0YWJsZW5hbWUsIHByaW1hcnlpbmRleCwgZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzW3ByaW1hcnlpbmRleF0sIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICAgIGJvZHk6IFwiQ291bGQgbm90IGZldGNoIHRoZSBpdGVtIGZyb20gdGhlIERhdGFiYXNlLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5JdGVtcyksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKHRyeWVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IFwiICsgdHJ5ZXJyb3IpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA1MDEsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiUHJvYmxlbSB3aXRoIGxhbWJkYS4gXCIgKyB0cnllcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0SXRlbUJ5SW5kZXgodGFibGVuYW1lOiBzdHJpbmcsIGtleW5hbWU6IGFueSwga2V5dmFsdWU6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIGNvbnN0IEtleUNvbmRpdGlvbkV4cHJlc3Npb24gPSBcIiNcIiArIGtleW5hbWUgKyBcIiA9IDpcIiArIGtleW5hbWU7XHJcbiAgY29uc3QgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0gdXBkYXRlZXhwcmVzc2lvbm5hbWVzKFtrZXluYW1lXSk7XHJcbiAgY29uc3QgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyA9IG5ld2V4cHJlc3Npb24oW2tleW5hbWVdLCBrZXl2YWx1ZSk7XHJcbiAgdmFyIHBhcmFtcyA9IHtcclxuICAgIFRhYmxlTmFtZTogdGFibGVuYW1lLFxyXG4gICAgSW5kZXhOYW1lOiBrZXluYW1lICsgXCItaW5kZXhcIixcclxuICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246IEtleUNvbmRpdGlvbkV4cHJlc3Npb24sXHJcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyxcclxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMsXHJcbiAgfTtcclxuICBkb2NDbGllbnQucXVlcnkocGFyYW1zLCBjYWxsYmFjayk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEl0ZW1CeUR1YWxJbmRleCh0YWJsZW5hbWU6IHN0cmluZywga2V5bmFtZXM6IGFueSwga2V5dmFsdWVzOiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICBjb25zdCBLZXlDb25kaXRpb25FeHByZXNzaW9uID0gXCIjXCIgKyBrZXluYW1lc1swXSArIFwiID0gOlwiICsga2V5bmFtZXNbMF0gKyBcIiBBTkQgI1wiICsga2V5bmFtZXNbMV0gKyBcIiA9IDpcIiArIGtleW5hbWVzWzFdO1xyXG4gIGNvbnN0IEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyA9IHVwZGF0ZWV4cHJlc3Npb25uYW1lcyhrZXluYW1lcyk7XHJcbiAgY29uc3QgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyA9IG5ld2V4cHJlc3Npb25zKGtleW5hbWVzLCBrZXl2YWx1ZXMpO1xyXG4gIHZhciBwYXJhbXMgPSB7XHJcbiAgICBUYWJsZU5hbWU6IHRhYmxlbmFtZSxcclxuICAgIEluZGV4TmFtZToga2V5bmFtZXNbMF0gKyBcIi1cIiArIGtleW5hbWVzWzFdICsgXCItaW5kZXhcIixcclxuICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246IEtleUNvbmRpdGlvbkV4cHJlc3Npb24sXHJcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyxcclxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMsXHJcbiAgfTtcclxuICBkb2NDbGllbnQucXVlcnkocGFyYW1zLCBjYWxsYmFjayk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLmdldEFsbEJ5RmlsdGVyID0gKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkgPT4ge1xyXG4gIGNvbnN0IHBhdGggPSBldmVudC5wYXRoO1xyXG4gIGNvbnN0IHNldHRpbmdzID0gX1NldHRpbmdzO1xyXG4gIGNvbnN0IGFwaVNldHRpbmdzID0gc2V0dGluZ3MuZmluZCgoeCkgPT4geC5iYXNlZW5kcG9pbnQgPT09IHBhdGguc3BsaXQoXCIvXCIpWzFdKTtcclxuICBpZiAoIWFwaVNldHRpbmdzKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEJhZCBzZXR1cCwgbm8gdGFibGVuYW1lLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBUYWJsZSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgZnVuYyA9IGFwaVNldHRpbmdzLmZ1bmN0aW9ucy5maW5kKCh4KSA9PiB4ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsyXS5yZXBsYWNlKFwiZ2V0QnlcIiwgXCJnZXRCeS1cIikpO1xyXG4gIGlmICghZnVuYykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRVJST1I6IEJhZCBzZXR1cCwgbm8gZnVuY3Rpb24uXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFF1ZXJ5IG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBpbmRleGluZm8gPSBmaW5kSW5kZXhJbmZvKGZ1bmMsIGFwaVNldHRpbmdzKTtcclxuICBpZiAoIWFwaVNldHRpbmdzLnRhYmxlbmFtZSB8fCBpbmRleGluZm8pIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogQmFkIHNldHVwLCBubyB0YWJsZW5hbWUgb3IgZmlsdGVyLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBUYWJsZSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGdldEFsbEJ5RmlsdGVyKGFwaVNldHRpbmdzLnRhYmxlbmFtZSwgaW5kZXhpbmZvLCAoZXJyb3I6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBcIkNvdWxkIG5vdCByZWFjaCBEYXRhYmFzZS5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQuSXRlbXMpLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgdmFyIGJvZHkgPSBKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMik7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IFwiICsgSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBnZXRBbGxCeUZpbHRlcih0YWJsZW5hbWU6IHN0cmluZywgZmlsdGVyOiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICB2YXIgcGFyYW1zID0ge1xyXG4gICAgVGFibGVOYW1lOiB0YWJsZW5hbWUsXHJcbiAgICBGaWx0ZXJFeHByZXNzaW9uOiBmaWx0ZXIsXHJcbiAgfTtcclxuICBkb2NDbGllbnQuc2NhbihwYXJhbXMsIGNhbGxiYWNrKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QWxsQnlGaWx0ZXJWYWx1ZSh0YWJsZW5hbWU6IHN0cmluZywgZmlsdGVyOiBhbnksIGZpbHRlcm5hbWU6IGFueSwgZmlsdGVydmFsdWU6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIGNvbnN0IEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyA9IHVwZGF0ZWV4cHJlc3Npb25uYW1lcyhmaWx0ZXJuYW1lKTtcclxuICBjb25zdCBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzID0gbmV3ZXhwcmVzc2lvbihbZmlsdGVybmFtZV0sIGZpbHRlcnZhbHVlKTtcclxuICB2YXIgcGFyYW1zID0ge1xyXG4gICAgVGFibGVOYW1lOiB0YWJsZW5hbWUsXHJcbiAgICBGaWx0ZXJFeHByZXNzaW9uOiBmaWx0ZXIsXHJcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzLFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXMsXHJcbiAgfTtcclxuICBkb2NDbGllbnQuc2NhbihwYXJhbXMsIGNhbGxiYWNrKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QWxsQnlGaWx0ZXJWYWx1ZXModGFibGVuYW1lOiBzdHJpbmcsIGZpbHRlcjogYW55LCBmaWx0ZXJuYW1lczogYW55LCBmaWx0ZXJ2YWx1ZXM6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIGNvbnN0IEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyA9IHVwZGF0ZWV4cHJlc3Npb25uYW1lcyhmaWx0ZXJuYW1lcyk7XHJcbiAgY29uc3QgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyA9IG5ld2V4cHJlc3Npb25zKGZpbHRlcm5hbWVzLCBmaWx0ZXJ2YWx1ZXMpO1xyXG4gIHZhciBwYXJhbXMgPSB7XHJcbiAgICBUYWJsZU5hbWU6IHRhYmxlbmFtZSxcclxuICAgIEZpbHRlckV4cHJlc3Npb246IGZpbHRlcixcclxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMsXHJcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyxcclxuICB9O1xyXG4gIGRvY0NsaWVudC5zY2FuKHBhcmFtcywgY2FsbGJhY2spO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5nZXRBY3RpdmUgPSBnZXRBY3RpdmU7XHJcbmZ1bmN0aW9uIGdldEFjdGl2ZShldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICBjb25zdCBwYXRoID0gZXZlbnQucGF0aDtcclxuICBjb25zdCBzZXR0aW5ncyA9IF9TZXR0aW5ncztcclxuICBjb25zdCBhcGlTZXR0aW5ncyA9IHNldHRpbmdzLmZpbmQoKHgpID0+IHguYmFzZWVuZHBvaW50ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsxXSk7XHJcbiAgaWYgKCFhcGlTZXR0aW5ncykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBCYWQgc2V0dXAsIG5vIHRhYmxlbmFtZS5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gVGFibGUgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGZ1bmMgPSBhcGlTZXR0aW5ncy5mdW5jdGlvbnMuZmluZCgoeCkgPT4geCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMl0ucmVwbGFjZShcImdldEJ5XCIsIFwiZ2V0QnktXCIpKTtcclxuICBpZiAoIWZ1bmMpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUVSUk9SOiBCYWQgc2V0dXAsIG5vIGZ1bmN0aW9uLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBRdWVyeSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgaW5kZXhpbmZvID0gZmluZEluZGV4SW5mbyhmdW5jLCBhcGlTZXR0aW5ncyk7XHJcbiAgaWYgKCFhcGlTZXR0aW5ncy50YWJsZW5hbWUgfHwgIWluZGV4aW5mbykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBCYWQgc2V0dXAsIG5vIHRhYmxlbmFtZSBvciBmaWx0ZXIuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFRhYmxlIG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgZ2V0QWN0aXZlSXRlbXMoYXBpU2V0dGluZ3MudGFibGVuYW1lLCBpbmRleGluZm8sIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICAgIGJvZHk6IFwiQ291bGQgbm90IHJlYWNoIERhdGFiYXNlLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5JdGVtcyksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICB2YXIgYm9keSA9IEpTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogXCIgKyBKU09OLnN0cmluZ2lmeShib2R5KSk7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QWN0aXZlSXRlbXModGFibGVuYW1lOiBzdHJpbmcsIGZpbHRlcjogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgdmFyIHBhcmFtcyA9IHtcclxuICAgIFRhYmxlTmFtZTogdGFibGVuYW1lLFxyXG4gICAgRmlsdGVyRXhwcmVzc2lvbjogZmlsdGVyLFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xyXG4gICAgICBcIjpEYXRlVGltZVwiOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICB9LFxyXG4gIH07XHJcbiAgZG9jQ2xpZW50LnNjYW4ocGFyYW1zLCBjYWxsYmFjayk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLnJlZ2lzdGVyID0gcmVnaXN0ZXI7XHJcbmZ1bmN0aW9uIHJlZ2lzdGVyKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIGNvbnN0IHBhdGggPSBldmVudC5wYXRoO1xyXG4gIGNvbnN0IHNldHRpbmdzID0gX1NldHRpbmdzO1xyXG4gIGNvbnN0IGFwaVNldHRpbmdzID0gc2V0dGluZ3MuZmluZCgoeCkgPT4geC5iYXNlZW5kcG9pbnQgPT09IHBhdGguc3BsaXQoXCIvXCIpWzFdKTtcclxuICBpZiAoIWFwaVNldHRpbmdzKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEJhZCBzZXR1cCwgbm8gdGFibGVuYW1lLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBUYWJsZSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgZnVuYyA9IGFwaVNldHRpbmdzLmZ1bmN0aW9ucy5maW5kKCh4KSA9PiB4ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsyXS5yZXBsYWNlKFwiZ2V0QnlcIiwgXCJnZXRCeS1cIikpO1xyXG4gIGlmICghZnVuYykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRVJST1I6IEJhZCBzZXR1cCwgbm8gZnVuY3Rpb24uXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFF1ZXJ5IG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCB0YWJsZW5hbWUgPSBhcGlTZXR0aW5ncy50YWJsZW5hbWUgfHwgXCJ1bmRlZmluZWRcIjtcclxuICBjb25zdCBwcmltYXJ5a2V5ID0gYXBpU2V0dGluZ3MucHJpbWFyeWtleS5uYW1lIHx8IFwiaWRcIjtcclxuICBjb25zdCBzZWNvbmRhcnlrZXkgPSBhcGlTZXR0aW5ncy5zZWNvbmRhcnlrZXk/Lm5hbWUgfHwgXCJcIjtcclxuICBpZiAoIXRhYmxlbmFtZSB8fCAhYXBpU2V0dGluZ3MuZmllbGRzKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEJhZCBzZXR1cCwgbm8gdGFibGVuYW1lLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBUYWJsZSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHBheWxvYWQgPSBldmVudC5ib2R5O1xyXG4gICAgaWYgKCFldmVudC5ib2R5IHx8ICFjaGVja1BheWxvYWQocGF5bG9hZCwgcHJpbWFyeWtleSwgc2Vjb25kYXJ5a2V5LCBhcGlTZXR0aW5ncy5maWVsZHMpKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogSW1wcm9wZXIgcGF5bG9hZDogXCIgKyBldmVudC5ib2R5KTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbXNnOiBcIkJhZCBSZXF1ZXN0LiBDb3VsZCBub3QgZmluZCBmdWxsIHBheWxvYWQgb2YgcmVxdWVzdC5cIiwgcGFyYW1zOiBldmVudCB9KSxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBuZXdJdGVtID0gY29udmVydFRvQVdTSXRlbShKU09OLnBhcnNlKHBheWxvYWQpLCBwcmltYXJ5a2V5LCBzZWNvbmRhcnlrZXksIGFwaVNldHRpbmdzLmZpZWxkcyk7XHJcbiAgICBjb25zb2xlLmxvZyhuZXdJdGVtKTtcclxuICAgIGFkZEl0ZW0odGFibGVuYW1lLCBuZXdJdGVtLCAoZXJyb3I6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBVbmFibGUgdG8gYWRkIGl0ZW06IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1zZzogXCJGYWlsZWQgdG8gcmVnaXN0ZXI6IFwiICsgZXJyb3IsIGl0ZW06IG5ld0l0ZW0gfSksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgbXNnOiBcIlJlZ2lzdGVyZWRcIiB9KSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAodHJ5ZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogUmVnaXN0ZXIgZnVuY3Rpb24gZXJyb3I6IFwiICsgdHJ5ZXJyb3IpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA1MDEsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiUHJvYmxlbSB3aXRoIGxhbWJkYS4gXCIgKyB0cnllcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY29udmVydFRvQVdTSXRlbShwYXlsb2FkOiBhbnksIHByaW1hcnlrZXk6IHN0cmluZywgc2Vjb25kYXJ5a2V5OiBzdHJpbmcsIGZpZWxkczogYW55KSB7XHJcbiAgY29uc3QgZmllbGRzb2JqID0gSlNPTi5wYXJzZShmaWVsZHMpO1xyXG4gIGxldCBJdGVtOiBhbnkgPSB7fTtcclxuICBjb25zdCBwcmltUHJvcFR5cGUgPSBwcm9wVHlwZShwcmltYXJ5a2V5LCBwYXlsb2FkLCBmaWVsZHNvYmopO1xyXG4gIEl0ZW1bcHJpbWFyeWtleV0gPSBwcmltUHJvcFR5cGU7XHJcbiAgaWYgKHNlY29uZGFyeWtleSAhPT0gXCJcIiAmJiBwYXlsb2FkW3NlY29uZGFyeWtleV0pIHtcclxuICAgIGNvbnN0IHNlY1Byb3BUeXBlID0gcHJvcFR5cGUoc2Vjb25kYXJ5a2V5LCBwYXlsb2FkLCBmaWVsZHNvYmopO1xyXG4gICAgSXRlbVtzZWNvbmRhcnlrZXldID0gc2VjUHJvcFR5cGU7XHJcbiAgfVxyXG4gIGZpZWxkc29iai5mb3JFYWNoKChmaWVsZDogYW55KSA9PiB7XHJcbiAgICBpZiAocGF5bG9hZFtmaWVsZC5uYW1lXSkge1xyXG4gICAgICBjb25zdCBzZWxQcm9wVHlwZSA9IHByb3BUeXBlKGZpZWxkLm5hbWUsIHBheWxvYWQsIGZpZWxkc29iaik7XHJcbiAgICAgIEl0ZW1bZmllbGQubmFtZV0gPSBzZWxQcm9wVHlwZTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gSXRlbTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJvcFR5cGUoZmllbGQ6IGFueSwgdmFsdWU6IGFueSwgZmllbGRzb2JqOiBhbnkpIHtcclxuICBjb25zdCBmaWVsZEZ1bGwgPSBmaWVsZHNvYmouZmlsdGVyKCh4OiBhbnkpID0+IHgubmFtZSA9PT0gZmllbGQpO1xyXG4gIGlmICghZmllbGRGdWxsIHx8IGZpZWxkRnVsbC5sZW5ndGggPT09IDApIHtcclxuICAgIHJldHVybiB7IFM6IHZhbHVlW2ZpZWxkXSB9O1xyXG4gIH1cclxuICBzd2l0Y2ggKGZpZWxkRnVsbFswXS50eXBlKSB7XHJcbiAgICBjYXNlIFwiYnl0ZVwiOlxyXG4gICAgICByZXR1cm4geyBCOiB2YWx1ZVtmaWVsZEZ1bGxbMF0ubmFtZV0gfTtcclxuICAgIGNhc2UgXCJib29sZWFuXCI6XHJcbiAgICAgIHJldHVybiB7IEJPT0w6IHZhbHVlW2ZpZWxkRnVsbFswXS5uYW1lXSB9O1xyXG4gICAgY2FzZSBcIm51bWJlclwiOlxyXG4gICAgICByZXR1cm4geyBOOiB2YWx1ZVtmaWVsZEZ1bGxbMF0ubmFtZV0udG9TdHJpbmcoKSB9O1xyXG4gICAgY2FzZSBcImFycmF5X2J5dGVcIjpcclxuICAgICAgcmV0dXJuIHsgQlM6IHZhbHVlW2ZpZWxkRnVsbFswXS5uYW1lXSB9O1xyXG4gICAgY2FzZSBcImFycmF5X251bWJlclwiOlxyXG4gICAgICByZXR1cm4geyBOUzogdmFsdWVbZmllbGRGdWxsWzBdLm5hbWVdIH07XHJcbiAgICBjYXNlIFwiYXJyYXlfc3RyaW5nXCI6XHJcbiAgICAgIHJldHVybiB7IFNTOiB2YWx1ZVtmaWVsZEZ1bGxbMF0ubmFtZV0gfTtcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHJldHVybiB7IFM6IHZhbHVlW2ZpZWxkRnVsbFswXS5uYW1lXSB9O1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tQYXlsb2FkKG5ld3BheWxvYWQ6IGFueSwgcHJpbWFyeWtleTogc3RyaW5nLCBzZWNvbmRhcnlrZXk6IHN0cmluZywgZmllbGRzOiBhbnkpIHtcclxuICBjb25zdCBmaWVsZHNvYmogPSBKU09OLnBhcnNlKGZpZWxkcyk7XHJcbiAgY29uc3QgcGF5bG9hZCA9IEpTT04ucGFyc2UobmV3cGF5bG9hZCk7XHJcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHBheWxvYWQpO1xyXG4gIGlmICghcGF5bG9hZFtwcmltYXJ5a2V5XSkgcmV0dXJuIGZhbHNlO1xyXG4gIGlmIChzZWNvbmRhcnlrZXkgIT09IFwiXCIgJiYgIXBheWxvYWRbc2Vjb25kYXJ5a2V5XSkgcmV0dXJuIGZhbHNlO1xyXG4gIGxldCBmbGFnID0gdHJ1ZTtcclxuICBmaWVsZHNvYmouZm9yRWFjaCgoZmllbGQ6IGFueSkgPT4ge1xyXG4gICAgaWYgKGZpZWxkLnJlcXVpcmVkICYmICFrZXlzLmluY2x1ZGVzKGZpZWxkLm5hbWUpKSBmbGFnID0gZmFsc2U7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGZsYWc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZEl0ZW0odGFibGVuYW1lOiBzdHJpbmcsIG5ld0l0ZW06IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIHZhciBjbGllbnQgPSBuZXcgRHluYW1vREIoKTtcclxuICB2YXIgcGFyYW1zID0ge1xyXG4gICAgVGFibGVOYW1lOiB0YWJsZW5hbWUsXHJcbiAgICBJdGVtOiBuZXdJdGVtLFxyXG4gIH07XHJcbiAgY2xpZW50LnB1dEl0ZW0ocGFyYW1zLCBjYWxsYmFjayk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLmRlbGV0ZSA9IGRlbGV0ZUl0ZW07XHJcbmZ1bmN0aW9uIGRlbGV0ZUl0ZW0oZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgY29uc3QgcGF0aCA9IGV2ZW50LnBhdGg7XHJcbiAgY29uc3Qgc2V0dGluZ3MgPSBfU2V0dGluZ3M7XHJcbiAgY29uc3QgYXBpU2V0dGluZ3MgPSBzZXR0aW5ncy5maW5kKCh4KSA9PiB4LmJhc2VlbmRwb2ludCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMV0pO1xyXG4gIGlmICghYXBpU2V0dGluZ3MpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogQmFkIHNldHVwLCBubyB0YWJsZW5hbWUuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFRhYmxlIG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBmdW5jID0gYXBpU2V0dGluZ3MuZnVuY3Rpb25zLmZpbmQoKHgpID0+IHggPT09IHBhdGguc3BsaXQoXCIvXCIpWzJdLnJlcGxhY2UoXCJnZXRCeVwiLCBcImdldEJ5LVwiKSk7XHJcbiAgaWYgKCFmdW5jKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1FUlJPUjogQmFkIHNldHVwLCBubyBmdW5jdGlvbi5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gUXVlcnkgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IHRhYmxlbmFtZSA9IGFwaVNldHRpbmdzLnRhYmxlbmFtZSB8fCBcInVuZGVmaW5lZFwiO1xyXG4gIGNvbnN0IHByaW1hcnlrZXkgPSBhcGlTZXR0aW5ncy5wcmltYXJ5a2V5Lm5hbWUgfHwgXCJpZFwiO1xyXG4gIGNvbnN0IHNlY29uZGFyeWtleSA9IGFwaVNldHRpbmdzLnNlY29uZGFyeWtleT8ubmFtZSB8fCBcIlwiO1xyXG4gIGlmICghdGFibGVuYW1lIHx8ICFhcGlTZXR0aW5ncy5maWVsZHMpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogQmFkIHNldHVwLCBubyB0YWJsZW5hbWUuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFRhYmxlIG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgcGF5bG9hZCA9IEpTT04ucGFyc2UoZXZlbnQuYm9keSk7XHJcbiAgICBpZiAoIWV2ZW50LmJvZHkgfHwgIXBheWxvYWQgfHwgIXBheWxvYWRbcHJpbWFyeWtleV0pIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBJbXByb3BlciBwYXlsb2FkOiBcIiArIGV2ZW50LmJvZHkpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtc2c6IFwiQmFkIFJlcXVlc3QuIENvdWxkIG5vdCBmaW5kIGZ1bGwga2V5LlwiLCBwYXJhbXM6IGV2ZW50IH0pLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBrZXk6IGFueSA9IHt9O1xyXG4gICAga2V5W3ByaW1hcnlrZXldID0gcGF5bG9hZFtwcmltYXJ5a2V5XTtcclxuICAgIGlmIChzZWNvbmRhcnlrZXkgIT09IFwiXCIpIGtleVtzZWNvbmRhcnlrZXldID0gcGF5bG9hZFtzZWNvbmRhcnlrZXldO1xyXG5cclxuICAgIHJlbW92ZUl0ZW0odGFibGVuYW1lLCBrZXksIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IFVuYWJsZSB0byByZW1vdmUgaXRlbTogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgbXNnOiBcIkZhaWxlZCB0byByZW1vdmUgaXRlbSA6IFwiICsgZXJyb3IsIGtleToga2V5IH0pLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIG1zZzogXCJSZW1vdmVkXCIgfSksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKHRyeWVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IERlbGV0ZSBmdW5jdGlvbiBlcnJvcjogXCIgKyB0cnllcnJvcik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDUwMSxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJQcm9ibGVtIHdpdGggbGFtYmRhLiBcIiArIHRyeWVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZW1vdmVJdGVtKHRhYmxlbmFtZTogc3RyaW5nLCBrZXk6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIHZhciBnZXRwYXJhbXMgPSB7XHJcbiAgICBUYWJsZU5hbWU6IHRhYmxlbmFtZSxcclxuICAgIEtleToga2V5LFxyXG4gIH07XHJcbiAgZG9jQ2xpZW50LmRlbGV0ZShnZXRwYXJhbXMsIChlcnI6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgIGlmIChlcnIpIGNhbGxiYWNrKGVyciwgeyBzdGF0dXM6IDQwMCwgbXNnOiBlcnIgfSk7XHJcbiAgICBlbHNlIGNhbGxiYWNrKG51bGwsIHsgc3RhdHVzOiAyMDAsIG1zZzogcmVzdWx0IH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy51cGRhdGUgPSB1cGRhdGU7XHJcbmZ1bmN0aW9uIHVwZGF0ZShldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICBjb25zdCBwYXRoID0gZXZlbnQucGF0aDtcclxuICBjb25zdCBzZXR0aW5ncyA9IF9TZXR0aW5ncztcclxuICBjb25zdCBhcGlTZXR0aW5ncyA9IHNldHRpbmdzLmZpbmQoKHgpID0+IHguYmFzZWVuZHBvaW50ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsxXSk7XHJcbiAgaWYgKCFhcGlTZXR0aW5ncykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBCYWQgc2V0dXAsIG5vIHRhYmxlbmFtZS5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gVGFibGUgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGZ1bmMgPSBhcGlTZXR0aW5ncy5mdW5jdGlvbnMuZmluZCgoeCkgPT4geCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMl0ucmVwbGFjZShcImdldEJ5XCIsIFwiZ2V0QnktXCIpKTtcclxuICBpZiAoIWZ1bmMpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUVSUk9SOiBCYWQgc2V0dXAsIG5vIGZ1bmN0aW9uLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBRdWVyeSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgdGFibGVuYW1lID0gYXBpU2V0dGluZ3MudGFibGVuYW1lIHx8IFwidW5kZWZpbmVkXCI7XHJcbiAgY29uc3QgcHJpbWFyeWtleSA9IGFwaVNldHRpbmdzLnByaW1hcnlrZXkubmFtZSB8fCBcImlkXCI7XHJcbiAgY29uc3Qgc2Vjb25kYXJ5a2V5ID0gYXBpU2V0dGluZ3Muc2Vjb25kYXJ5a2V5Py5uYW1lIHx8IFwiXCI7XHJcbiAgaWYgKCF0YWJsZW5hbWUgfHwgIWFwaVNldHRpbmdzLmZpZWxkcykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBCYWQgc2V0dXAsIG5vIHRhYmxlbmFtZS5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gVGFibGUgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5wYXJzZShldmVudC5ib2R5KTtcclxuICAgIGlmICghZXZlbnQuYm9keSB8fCAhcGF5bG9hZCB8fCAhcGF5bG9hZFtwcmltYXJ5a2V5XSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEltcHJvcGVyIHBheWxvYWQ6IFwiICsgZXZlbnQuYm9keSk7XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1zZzogXCJCYWQgUmVxdWVzdC4gQ291bGQgbm90IGZpbmQgZnVsbCBrZXkuXCIsIHBhcmFtczogZXZlbnQgfSksXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGtleSA9IFtwcmltYXJ5a2V5XTtcclxuICAgIGlmIChzZWNvbmRhcnlrZXkgIT09IFwiXCIpIGtleS5wdXNoKHNlY29uZGFyeWtleSk7XHJcblxyXG4gICAgdXBkYXRlSXRlbSh0YWJsZW5hbWUsIGtleSwgcGF5bG9hZCwgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogVW5hYmxlIHRvIHVwZGF0ZSBpdGVtOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBtc2c6IFwiRmFpbGVkIHRvIHVwZGF0ZSBpdGVtIDogXCIgKyBlcnJvciwga2V5OiBrZXkgfSksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgbXNnOiBcIlVwZGF0ZWRcIiwgcmVzcG9uc2U6IHJlc3VsdCB9KSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAodHJ5ZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogRGVsZXRlIGZ1bmN0aW9uIGVycm9yOiBcIiArIHRyeWVycm9yKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNTAxLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIlByb2JsZW0gd2l0aCBsYW1iZGEuIFwiICsgdHJ5ZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZUl0ZW0odGFibGVuYW1lOiBzdHJpbmcsIGZpbHRlcnM6IHN0cmluZ1tdLCB1cGRhdGVkSXRlbTogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgbGV0IGZpZWxkcyA9IE9iamVjdC5rZXlzKHVwZGF0ZWRJdGVtKTtcclxuICBmaWVsZHMgPSBmaWVsZHMuZmlsdGVyKCh4KSA9PiAhZmlsdGVycy5pbmNsdWRlcyh4KSk7XHJcbiAgY29uc3QgdXBkYXRlID0gXCJzZXQgXCIgKyB1cGRhdGVmaWVsZHMoZmllbGRzKTtcclxuICBjb25zdCBleHByZXNzaW9udmFscyA9IHVwZGF0ZWV4cHJlc3Npb24oZmllbGRzLCB1cGRhdGVkSXRlbSk7XHJcbiAgY29uc3QgZXhwcmVzc2lvbm5hbWVzID0gdXBkYXRlZXhwcmVzc2lvbm5hbWVzKGZpZWxkcyk7XHJcbiAgY29uc3Qga2V5cyA9IHNldGtleXMoZmlsdGVycywgdXBkYXRlZEl0ZW0pO1xyXG4gIHZhciBwYXJhbXMgPSB7XHJcbiAgICBUYWJsZU5hbWU6IHRhYmxlbmFtZSxcclxuICAgIEtleToga2V5cyxcclxuICAgIFVwZGF0ZUV4cHJlc3Npb246IHVwZGF0ZSxcclxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IGV4cHJlc3Npb252YWxzLFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiBleHByZXNzaW9ubmFtZXMsXHJcbiAgICBSZXR1cm5WYWx1ZXM6IFwiVVBEQVRFRF9ORVdcIixcclxuICB9O1xyXG4gIGRvY0NsaWVudC51cGRhdGUocGFyYW1zLCBjYWxsYmFjayk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldGtleXMoZmllbGRzOiBhbnksIGl0ZW06IGFueSkge1xyXG4gIGxldCBleHA6IGFueSA9IHt9O1xyXG4gIGZpZWxkcy5mb3JFYWNoKCh2YWw6IGFueSkgPT4ge1xyXG4gICAgZXhwW3ZhbF0gPSBpdGVtW3ZhbF07XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGV4cDtcclxufVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlZmllbGRzKGZpZWxkczogYW55KSB7XHJcbiAgbGV0IG91dHB1dCA9IFwiXCI7XHJcbiAgZmllbGRzLmZvckVhY2goKHZhbDogYW55KSA9PiB7XHJcbiAgICBvdXRwdXQgKz0gXCIjXCIgKyB2YWwgKyBcIj06XCIgKyB2YWwgKyBcIixcIjtcclxuICB9KTtcclxuICByZXR1cm4gb3V0cHV0LnN1YnN0cmluZygwLCBvdXRwdXQubGVuZ3RoIC0gMSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZWV4cHJlc3Npb24oZmllbGRzOiBhbnksIHVwZGF0ZUl0ZW06IGFueSkge1xyXG4gIGxldCBleHA6IGFueSA9IHt9O1xyXG4gIGZpZWxkcy5mb3JFYWNoKCh2YWw6IGFueSkgPT4ge1xyXG4gICAgZXhwW1wiOlwiICsgdmFsXSA9IHVwZGF0ZUl0ZW1bdmFsXTtcclxuICB9KTtcclxuICByZXR1cm4gZXhwO1xyXG59XHJcblxyXG5mdW5jdGlvbiBuZXdleHByZXNzaW9uKGZpZWxkczogYW55LCB1cGRhdGVJdGVtOiBhbnkpIHtcclxuICBsZXQgZXhwOiBhbnkgPSB7fTtcclxuICBmaWVsZHMuZm9yRWFjaCgodmFsOiBhbnkpID0+IHtcclxuICAgIGV4cFtcIjpcIiArIHZhbF0gPSB1cGRhdGVJdGVtO1xyXG4gIH0pO1xyXG4gIHJldHVybiBleHA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5ld2V4cHJlc3Npb25zKGZpZWxkczogYW55LCBpdGVtczogYW55KSB7XHJcbiAgbGV0IGV4cDogYW55ID0ge307XHJcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGZpZWxkcy5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgIGV4cFtcIjpcIiArIGZpZWxkc1tpbmRleF1dID0gaXRlbXNbaW5kZXhdO1xyXG4gIH1cclxuICByZXR1cm4gZXhwO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVleHByZXNzaW9ubmFtZXMoZmllbGRzOiBhbnkpIHtcclxuICBsZXQgZXhwOiBhbnkgPSB7fTtcclxuICBmaWVsZHMuZm9yRWFjaCgodmFsOiBhbnkpID0+IHtcclxuICAgIGV4cFtcIiNcIiArIHZhbF0gPSB2YWw7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGV4cDtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZEluZGV4SW5mbyhmdW5jOiBzdHJpbmcsIGFwaTogTGFtYmRhSW5mbykge1xyXG4gIGlmIChmdW5jLmluY2x1ZGVzKFwiZ2V0QnktXCIpKSB7XHJcbiAgICBjb25zdCB2YWx1ZSA9IGZ1bmMuc3BsaXQoXCItXCIpWzFdO1xyXG4gICAgaWYgKHZhbHVlKSByZXR1cm4gZnVuYy5zcGxpdChcIi1cIilbMV07XHJcbiAgICByZXR1cm4gXCJcIjtcclxuICB9XHJcbiAgaWYgKGZ1bmMuaW5jbHVkZXMoXCJnZXRBbGxCeUZpbHRlci1cIikpIHtcclxuICAgIGNvbnN0IHZhbHVlID0gZnVuYy5zcGxpdChcIi1cIilbMV07XHJcbiAgICBpZiAodmFsdWUpIHJldHVybiBhcGkuY3VzdG9tZmlsdGVyc1t2YWx1ZV07XHJcbiAgICByZXR1cm4gXCJcIjtcclxuICB9XHJcbiAgaWYgKGZ1bmMuaW5jbHVkZXMoXCJnZXRBY3RpdmVcIikpIHJldHVybiBhcGkuY3VzdG9tZmlsdGVyc1tcImdldEFjdGl2ZVwiXTtcclxuICByZXR1cm4gXCJcIjtcclxufVxyXG5cclxuZnVuY3Rpb24gc2VsZWN0RnVuY3Rpb24oZnVuYzogc3RyaW5nLCBhcGk6IExhbWJkYUluZm8pIHtcclxuICBpZiAoZnVuYy5pbmNsdWRlcyhcImdldEJ5LVwiKSkge1xyXG4gICAgY29uc3QgdmFsdWUgPSBmdW5jLnNwbGl0KFwiLVwiKVsxXTtcclxuICAgIGlmICh2YWx1ZSA9PT0gYXBpLnByaW1hcnlrZXk/Lm5hbWUpIHJldHVybiBcImdldEJ5SURcIjtcclxuICAgIHJldHVybiBcImdldEJ5SW5kZXhcIjtcclxuICB9XHJcbiAgaWYgKGZ1bmMuaW5jbHVkZXMoXCJnZXRBbGxCeUZpbHRlci1cIikpIHtcclxuICAgIGNvbnN0IHZhbHVlID0gZnVuYy5zcGxpdChcIi1cIilbMV07XHJcbiAgICByZXR1cm4gXCJnZXRBbGxCeUZpbHRlclwiO1xyXG4gIH1cclxuICByZXR1cm4gZnVuYztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBMYW1iZGFJbmZvIHtcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgdHlwZTogc3RyaW5nO1xyXG4gIGZpbGVuYW1lOiBzdHJpbmc7XHJcbiAgZnVuY3Rpb25zOiBzdHJpbmdbXTtcclxuICBwcmltYXJ5a2V5OiBmaWVsZHM7XHJcbiAgc2Vjb25kYXJ5a2V5PzogZmllbGRzO1xyXG4gIGN1c3RvbWZpbHRlcnM/OiBhbnk7XHJcbiAgZmllbGRzOiBmaWVsZHNbXTtcclxuICB0YWJsZW5hbWU6IHN0cmluZztcclxuICBiYXNlZW5kcG9pbnQ6IHN0cmluZztcclxuICBjdXN0b21BdXRoPzogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgZmllbGRzIHtcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgdHlwZTogc3RyaW5nO1xyXG4gIHJlcXVpcmVkPzogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IF9TZXR0aW5nczogTGFtYmRhSW5mb1tdID0gW1xyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1keW5hbW9kYi1BY2Nlc3NMb2dzXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXCJnZXRBbGxcIiwgXCJnZXRCeS1kYXRlXCIsIFwicmVnaXN0ZXJcIl0sXHJcbiAgICB0YWJsZW5hbWU6IFwibmhzYmlfYWNjZXNzX2xvZ3NcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJhY2Nlc3Nsb2dzXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwiZGF0ZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBzZWNvbmRhcnlrZXk6IHsgbmFtZTogXCJ0aW1lI29yZyN1c2VybmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBmaWVsZHM6IFtcclxuICAgICAgeyBuYW1lOiBcImRhdGFcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICB7IG5hbWU6IFwidGltZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwidHlwZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwidXNlcm5hbWUjb3JnXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLUFwcHNcIixcclxuICAgIHR5cGU6IFwiZHluYW1vZGJcIixcclxuICAgIGZpbGVuYW1lOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcImdldEFsbFwiLCBcImdldEJ5LW5hbWVcIiwgXCJnZXRCeS1lbnZpcm9ubWVudFwiLCBcImdldEJ5LXN0YXR1c1wiLCBcImdldEJ5LW93bmVyTmFtZVwiLCBcInJlZ2lzdGVyXCIsIFwiZGVsZXRlXCIsIFwidXBkYXRlXCJdLFxyXG4gICAgdGFibGVuYW1lOiBcIm5oc2JpX2FwcHNcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJhcHBzXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwibmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBzZWNvbmRhcnlrZXk6IHsgbmFtZTogXCJlbnZpcm9ubWVudFwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBmaWVsZHM6IFtcclxuICAgICAgeyBuYW1lOiBcImRlc2NyaXB0aW9uXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJpY29uXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJvd25lckVtYWlsXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJvd25lck5hbWVcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcInN0YXR1c1wiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwidXJsXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJpbWFnZXNcIiwgdHlwZTogXCJhcnJheV9zdHJpbmdcIiwgcmVxdWlyZWQ6IGZhbHNlIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLUFwcHMtUHVibGljXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXCJnZXRBbGxcIl0sXHJcbiAgICB0YWJsZW5hbWU6IFwibmhzYmlfYXBwc1wiLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcInB1YmxpY2FwcHNcIixcclxuICAgIHByaW1hcnlrZXk6IHsgbmFtZTogXCJuYW1lXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIHNlY29uZGFyeWtleTogeyBuYW1lOiBcImVudmlyb25tZW50XCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIGZpZWxkczogW1xyXG4gICAgICB7IG5hbWU6IFwiZGVzY3JpcHRpb25cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcImljb25cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcIm93bmVyRW1haWxcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcIm93bmVyTmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwic3RhdHVzXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJ1cmxcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcImltYWdlc1wiLCB0eXBlOiBcImFycmF5X3N0cmluZ1wiLCByZXF1aXJlZDogZmFsc2UgfSxcclxuICAgIF0sXHJcbiAgICBjdXN0b21BdXRoOiBcInB1YmxpY1wiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLUZvcm1TdWJtaXNzaW9uc1wiLFxyXG4gICAgdHlwZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZmlsZW5hbWU6IFwiZHluYW1vZGJcIixcclxuICAgIGZ1bmN0aW9uczogW1wiZ2V0QWxsXCIsIFwiZ2V0QnktaWRcIiwgXCJyZWdpc3RlclwiLCBcImRlbGV0ZVwiLCBcInVwZGF0ZVwiXSxcclxuICAgIHRhYmxlbmFtZTogXCJuaHNiaV9mb3JtX3N1Ym1pc3Npb25zXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwiZm9ybXN1Ym1pc3Npb25zXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwiaWRcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJjcmVhdGVkX2F0XCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJkYXRhXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJwYXJlbnRpZFwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgIHsgbmFtZTogXCJ0eXBlXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLU5ld3NmZWVkc1wiLFxyXG4gICAgdHlwZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZmlsZW5hbWU6IFwiZHluYW1vZGJcIixcclxuICAgIGZ1bmN0aW9uczogW1wiZ2V0QWxsXCIsIFwiZ2V0QnktaWRcIiwgXCJnZXRCeS1kZXN0aW5hdGlvblwiLCBcInJlZ2lzdGVyXCIsIFwiZGVsZXRlXCIsIFwidXBkYXRlXCJdLFxyXG4gICAgdGFibGVuYW1lOiBcIm5oc2JpX25ld3NmZWVkc1wiLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcIm5ld3NmZWVkc1wiLFxyXG4gICAgcHJpbWFyeWtleTogeyBuYW1lOiBcImRlc3RpbmF0aW9uXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIHNlY29uZGFyeWtleTogeyBuYW1lOiBcInR5cGVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJwcmlvcml0eVwiLCB0eXBlOiBcIm51bWJlclwiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwiaXNBcmNoaXZlZFwiLCB0eXBlOiBcImJvb2xlYW5cIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItT3JnYW5pc2F0aW9uc1wiLFxyXG4gICAgdHlwZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZmlsZW5hbWU6IFwiZHluYW1vZGJcIixcclxuICAgIGZ1bmN0aW9uczogW1widXBkYXRlXCIsIFwicmVnaXN0ZXJcIiwgXCJkZWxldGVcIiwgXCJnZXRCeS1jb2RlXCJdLFxyXG4gICAgdGFibGVuYW1lOiBcIm5oc2JpX29yZ2FuaXNhdGlvbnNcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJvcmdhbmlzYXRpb25zXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwibmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBzZWNvbmRhcnlrZXk6IHsgbmFtZTogXCJjb2RlXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIGZpZWxkczogW1xyXG4gICAgICB7IG5hbWU6IFwiYXV0aG1ldGhvZFwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwiY29udGFjdFwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1keW5hbW9kYi1PcmdhbmlzYXRpb25zLVB1YmxpY1wiLFxyXG4gICAgdHlwZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZmlsZW5hbWU6IFwiZHluYW1vZGJcIixcclxuICAgIGZ1bmN0aW9uczogW1wiZ2V0QWxsXCIsIFwiZ2V0QnktbmFtZVwiXSxcclxuICAgIHRhYmxlbmFtZTogXCJuaHNiaV9vcmdhbmlzYXRpb25zXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwib3JnYW5pc2F0aW9uXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwibmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBzZWNvbmRhcnlrZXk6IHsgbmFtZTogXCJjb2RlXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIGZpZWxkczogW1xyXG4gICAgICB7IG5hbWU6IFwiYXV0aG1ldGhvZFwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwiY29udGFjdFwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgXSxcclxuICAgIGN1c3RvbUF1dGg6IFwicHVibGljXCIsXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItU3lzdGVtQWxlcnRzXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXCJ1cGRhdGVcIiwgXCJyZWdpc3RlclwiLCBcImRlbGV0ZVwiLCBcImdldEFsbFwiLCBcImdldEJ5LWlkXCIsIFwiZ2V0QWN0aXZlXCJdLFxyXG4gICAgY3VzdG9tZmlsdGVyczoge1xyXG4gICAgICBnZXRBY3RpdmU6IFwiOkRhdGVUaW1lIEJFVFdFRU4gc3RhcnRkYXRlIEFORCBlbmRkYXRlXCIsXHJcbiAgICB9LFxyXG4gICAgdGFibGVuYW1lOiBcIm5oc2JpX3N5c3RlbWFsZXJ0c1wiLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcInN5c3RlbWFsZXJ0c1wiLFxyXG4gICAgcHJpbWFyeWtleTogeyBuYW1lOiBcImlkXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIHNlY29uZGFyeWtleTogeyBuYW1lOiBcImF1dGhvclwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBmaWVsZHM6IFtcclxuICAgICAgeyBuYW1lOiBcIm5hbWVcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcIm1lc3NhZ2VcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcInN0YXJ0ZGF0ZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwiZW5kZGF0ZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwic3RhdHVzXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJpY29uXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLVN5c3RlbUFsZXJ0cy1QdWJsaWNcIixcclxuICAgIHR5cGU6IFwiZHluYW1vZGJcIixcclxuICAgIGZpbGVuYW1lOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcImdldEFsbFwiXSxcclxuICAgIHRhYmxlbmFtZTogXCJuaHNiaV9zeXN0ZW1hbGVydHNcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJzeXN0ZW1hbGVydFwiLFxyXG4gICAgcHJpbWFyeWtleTogeyBuYW1lOiBcImlkXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIGZpZWxkczogW1xyXG4gICAgICB7IG5hbWU6IFwibmFtZVwiLCB0eXBlOiBcImJvb2xlYW5cIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcIm1lc3NhZ2VcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcInN0YXJ0ZGF0ZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwiZW5kZGF0ZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwic3RhdHVzXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJpY29uXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJhdXRob3JcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgIF0sXHJcbiAgICBjdXN0b21BdXRoOiBcInB1YmxpY1wiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLVRlYW1zXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXCJ1cGRhdGVcIiwgXCJyZWdpc3RlclwiLCBcImRlbGV0ZVwiLCBcImdldEFsbFwiLCBcImdldEJ5LWlkXCIsIFwiZ2V0QnktY29kZVwiLCBcImdldEJ5LW9yZ2FuaXNhdGlvbmNvZGVcIl0sXHJcbiAgICB0YWJsZW5hbWU6IFwibmhzYmlfdGVhbXNcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJ0ZWFtc1wiLFxyXG4gICAgcHJpbWFyeWtleTogeyBuYW1lOiBcImlkXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIHNlY29uZGFyeWtleTogeyBuYW1lOiBcImNvZGVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJkZXNjcml0aW9uXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJuYW1lXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJvcmdhbmlzYXRpb25jb2RlXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgeyBuYW1lOiBcInJlc3BvbnNpYmxlcGVvcGxlXCIsIHR5cGU6IFwic3RyaW5nX2FycmF5XCIgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItVGVhbU1lbWJlcnNcIixcclxuICAgIHR5cGU6IFwiZHluYW1vZGJcIixcclxuICAgIGZpbGVuYW1lOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcInVwZGF0ZVwiLCBcInJlZ2lzdGVyXCIsIFwiZGVsZXRlXCIsIFwiZ2V0QWxsXCIsIFwiZ2V0QnktaWRcIiwgXCJnZXRCeS10ZWFtY29kZVwiLCBcImdldEJ5LXVzZXJuYW1lXCJdLFxyXG4gICAgdGFibGVuYW1lOiBcIm5oc2JpX3RlYW1tZW1iZXJzXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwidGVhbW1lbWJlcnNcIixcclxuICAgIHByaW1hcnlrZXk6IHsgbmFtZTogXCJpZFwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBzZWNvbmRhcnlrZXk6IHsgbmFtZTogXCJ0ZWFtY29kZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBmaWVsZHM6IFtcclxuICAgICAgeyBuYW1lOiBcInVzZXJuYW1lXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJqb2luZGF0ZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwicm9sZWNvZGVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICB7IG5hbWU6IFwiZW5kZGF0ZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLVRlYW1SZXF1ZXN0c1wiLFxyXG4gICAgdHlwZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZmlsZW5hbWU6IFwiZHluYW1vZGJcIixcclxuICAgIGZ1bmN0aW9uczogW1widXBkYXRlXCIsIFwicmVnaXN0ZXJcIiwgXCJkZWxldGVcIiwgXCJnZXRBbGxcIiwgXCJnZXRCeS1pZFwiLCBcImdldEJ5LXRlYW1jb2RlXCIsIFwiZ2V0QnktdXNlcm5hbWVcIl0sXHJcbiAgICB0YWJsZW5hbWU6IFwibmhzYmlfdGVhbXJlcXVlc3RzXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwidGVhbXJlcXVlc3RzXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwiaWRcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgc2Vjb25kYXJ5a2V5OiB7IG5hbWU6IFwidGVhbWNvZGVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJ1c2VybmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwicmVxdWVzdG9yXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJyZXF1ZXN0ZGF0ZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwiYXBwcm92ZWRkYXRlXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgeyBuYW1lOiBcInJlZnVzZWRkYXRlXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgeyBuYW1lOiBcInJlcXVlc3RhcHByb3ZlclwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLVVzZXJzXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXSxcclxuICAgIHRhYmxlbmFtZTogXCJuaHNiaV91c2Vyc1wiLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcInVzZXJzXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwidXNlcm5hbWVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgc2Vjb25kYXJ5a2V5OiB7IG5hbWU6IFwib3JnYW5pc2F0aW9uXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIGZpZWxkczogW1xyXG4gICAgICB7IG5hbWU6IFwiZW1haWxcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcImxpbmVtYW5hZ2VyXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJuYW1lXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJwYXNzd29yZFwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwicGFzc3dvcmRfZXhwaXJlc1wiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1keW5hbW9kYi1WZXJpZmljYXRpb25Db2Rlc1wiLFxyXG4gICAgdHlwZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZmlsZW5hbWU6IFwiZHluYW1vZGJcIixcclxuICAgIGZ1bmN0aW9uczogW10sXHJcbiAgICB0YWJsZW5hbWU6IFwibmhzYmlfdmVyaWZpY2F0aW9uY29kZXNcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJ2ZXJpZmljYXRpb25jb2Rlc1wiLFxyXG4gICAgcHJpbWFyeWtleTogeyBuYW1lOiBcImNvZGVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgc2Vjb25kYXJ5a2V5OiB7IG5hbWU6IFwidXNlcm5hbWVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJnZW5lcmF0ZWRcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcIm9yZ2FuaXNhdGlvblwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLU1GQVwiLFxyXG4gICAgdHlwZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZmlsZW5hbWU6IFwiZHluYW1vZGJcIixcclxuICAgIGZ1bmN0aW9uczogW10sXHJcbiAgICB0YWJsZW5hbWU6IFwibmhzYmlfbWZhXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwibWZhXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwidXNlcm5hbWVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgc2Vjb25kYXJ5a2V5OiB7IG5hbWU6IFwidmVyaWZpY2F0aW9uXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIGZpZWxkczogW10sXHJcbiAgfSxcclxuXTtcclxuIl19
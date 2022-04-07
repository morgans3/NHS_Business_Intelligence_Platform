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
        tablename: "access_logs",
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
        tablename: "apps",
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
        tablename: "apps",
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
        tablename: "form_submissions",
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
        tablename: "newsfeeds",
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
        tablename: "organisations",
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
        tablename: "organisations",
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
        tablename: "systemalerts",
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
        tablename: "systemalerts",
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
        tablename: "teams",
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
        tablename: "teammembers",
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
        tablename: "teamrequests",
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
        tablename: "users",
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
        tablename: "verificationcodes",
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
        tablename: "mfa",
        baseendpoint: "mfa",
        primarykey: { name: "username", type: "string" },
        secondarykey: { name: "verification", type: "string" },
        fields: [],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkeW5hbW9kYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBbUM7QUFDbkMsTUFBTSxTQUFTLEdBQUcsSUFBSSxrQkFBUSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBRWhELE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsS0FBVSxFQUFFLE9BQVksRUFBRSxRQUFhLEVBQUUsRUFBRTtJQUNwRSxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0lBQ3hCLE1BQU0sUUFBUSxHQUFHLGlCQUFTLElBQUksRUFBRSxDQUFDO0lBQ2pDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hGLE1BQU0sSUFBSSxHQUFHLFdBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDckcsUUFBUSxjQUFjLENBQUMsSUFBSyxFQUFFLFdBQVksQ0FBQyxFQUFFO1FBQzNDLEtBQUssUUFBUTtZQUNYLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLE1BQU07UUFDUixLQUFLLFNBQVM7WUFDWixPQUFPLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNsQyxNQUFNO1FBQ1IsS0FBSyxZQUFZO1lBQ2YsVUFBVSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFD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RUFBRSxtQkFBbUI7UUFDOUIsWUFBWSxFQUFFLG1CQUFtQjtRQUNqQyxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDNUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQ2xELE1BQU0sRUFBRTtZQUNOLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7WUFDckQsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7U0FDekM7S0FDRjtJQUNEO1FBQ0UsSUFBSSxFQUFFLHNCQUFzQjtRQUM1QixJQUFJLEVBQUUsVUFBVTtRQUNoQixRQUFRLEVBQUUsVUFBVTtRQUNwQixTQUFTLEVBQUUsRUFBRTtRQUNiLFNBQVMsRUFBRSxLQUFLO1FBQ2hCLFlBQVksRUFBRSxLQUFLO1FBQ25CLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUNoRCxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDdEQsTUFBTSxFQUFFLEVBQUU7S0FDWDtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEeW5hbW9EQiB9IGZyb20gXCJhd3Mtc2RrXCI7XHJcbmNvbnN0IGRvY0NsaWVudCA9IG5ldyBEeW5hbW9EQi5Eb2N1bWVudENsaWVudCgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMuZGVjaXNpb24gPSAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSA9PiB7XHJcbiAgY29uc3QgcGF0aCA9IGV2ZW50LnBhdGg7XHJcbiAgY29uc3Qgc2V0dGluZ3MgPSBfU2V0dGluZ3MgfHwgW107XHJcbiAgY29uc3QgYXBpU2V0dGluZ3MgPSBzZXR0aW5ncy5maW5kKCh4KSA9PiB4LmJhc2VlbmRwb2ludCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMV0pO1xyXG4gIGNvbnN0IGZ1bmMgPSBhcGlTZXR0aW5ncyEuZnVuY3Rpb25zLmZpbmQoKHgpID0+IHggPT09IHBhdGguc3BsaXQoXCIvXCIpWzJdLnJlcGxhY2UoXCJnZXRCeVwiLCBcImdldEJ5LVwiKSk7XHJcbiAgc3dpdGNoIChzZWxlY3RGdW5jdGlvbihmdW5jISwgYXBpU2V0dGluZ3MhKSkge1xyXG4gICAgY2FzZSBcInVwZGF0ZVwiOlxyXG4gICAgICB1cGRhdGUoZXZlbnQsIGNvbnRleHQsIGNhbGxiYWNrKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiZ2V0QnlJRFwiOlxyXG4gICAgICBnZXRCeUlEKGV2ZW50LCBjb250ZXh0LCBjYWxsYmFjayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcImdldEJ5SW5kZXhcIjpcclxuICAgICAgZ2V0QnlJbmRleChldmVudCwgY29udGV4dCwgY2FsbGJhY2spO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJnZXRBbGxCeUZpbHRlclwiOlxyXG4gICAgICBnZXRBbGxCeUZpbHRlcihldmVudCwgY29udGV4dCwgY2FsbGJhY2spO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJnZXRBY3RpdmVcIjpcclxuICAgICAgZ2V0QWN0aXZlKGV2ZW50LCBjb250ZXh0LCBjYWxsYmFjayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcInJlZ2lzdGVyXCI6XHJcbiAgICAgIHJlZ2lzdGVyKGV2ZW50LCBjb250ZXh0LCBjYWxsYmFjayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcImRlbGV0ZVwiOlxyXG4gICAgICBkZWxldGVJdGVtKGV2ZW50LCBjb250ZXh0LCBjYWxsYmFjayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcImdldEFsbFwiOlxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgZ2V0QWxsKGV2ZW50LCBjb250ZXh0LCBjYWxsYmFjayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzLmdldEFsbCA9IGdldEFsbDtcclxuZnVuY3Rpb24gZ2V0QWxsKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIGNvbnN0IHBhdGggPSBldmVudC5wYXRoO1xyXG4gIGNvbnN0IHNldHRpbmdzID0gX1NldHRpbmdzO1xyXG4gIGNvbnN0IGFwaVNldHRpbmdzID0gc2V0dGluZ3MuZmluZCgoeCkgPT4geC5iYXNlZW5kcG9pbnQgPT09IHBhdGguc3BsaXQoXCIvXCIpWzFdKTtcclxuICBpZiAoIWFwaVNldHRpbmdzKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEJhZCBzZXR1cCwgbm8gdGFibGVuYW1lLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBUYWJsZSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgZnVuYyA9IGFwaVNldHRpbmdzLmZ1bmN0aW9ucy5maW5kKCh4KSA9PiB4ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsyXS5yZXBsYWNlKFwiZ2V0QnlcIiwgXCJnZXRCeS1cIikpO1xyXG4gIGlmICghZnVuYykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRVJST1I6IEJhZCBzZXR1cCwgbm8gZnVuY3Rpb24uXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFF1ZXJ5IG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgZ2V0QWxsRnJvbURCKGFwaVNldHRpbmdzLnRhYmxlbmFtZSwgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgICAgYm9keTogXCJDb3VsZCBub3QgcmVhY2ggRGF0YWJhc2UuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0Lkl0ZW1zKSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHZhciBib2R5ID0gSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpO1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBcIiArIEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBbGxGcm9tREIodGFibGVuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICB2YXIgcGFyYW1zID0ge1xyXG4gICAgVGFibGVOYW1lOiB0YWJsZW5hbWUsXHJcbiAgfTtcclxuICBkb2NDbGllbnQuc2NhbihwYXJhbXMsIGNhbGxiYWNrKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0QnlJRCA9IGdldEJ5SUQ7XHJcbmZ1bmN0aW9uIGdldEJ5SUQoZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgY29uc3QgcGF0aCA9IGV2ZW50LnBhdGg7XHJcbiAgY29uc3Qgc2V0dGluZ3MgPSBfU2V0dGluZ3M7XHJcbiAgY29uc3QgYXBpU2V0dGluZ3MgPSBzZXR0aW5ncy5maW5kKCh4KSA9PiB4LmJhc2VlbmRwb2ludCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMV0pO1xyXG4gIGlmICghYXBpU2V0dGluZ3MpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogQmFkIHNldHVwLCBubyB0YWJsZW5hbWUuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFRhYmxlIG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBmdW5jID0gYXBpU2V0dGluZ3MuZnVuY3Rpb25zLmZpbmQoKHgpID0+IHggPT09IHBhdGguc3BsaXQoXCIvXCIpWzJdLnJlcGxhY2UoXCJnZXRCeVwiLCBcImdldEJ5LVwiKSk7XHJcbiAgaWYgKCFmdW5jKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1FUlJPUjogQmFkIHNldHVwLCBubyBmdW5jdGlvbi5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gUXVlcnkgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwcmltYXJ5a2V5ID0gYXBpU2V0dGluZ3MucHJpbWFyeWtleS5uYW1lIHx8IFwiaWRcIjtcclxuICAgIGlmICghZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzW3ByaW1hcnlrZXldKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogcHJpbWFyeSBrZXkgbm90IHByb3ZpZGVkIGluIGFwaSBjYWxsXCIpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gQ291bGQgbm90IGZpbmQgXCIgKyBwcmltYXJ5a2V5ICsgXCIgaW4gcmVxdWVzdC5cIixcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHRhYmxlbmFtZSA9IGFwaVNldHRpbmdzLnRhYmxlbmFtZSB8fCBcInVuZGVmaW5lZFwiO1xyXG4gICAgZ2V0SXRlbUJ5S2V5KHRhYmxlbmFtZSwgcHJpbWFyeWtleSwgZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzW3ByaW1hcnlrZXldLCAoZXJyb3I6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBcIkNvdWxkIG5vdCBmZXRjaCB0aGUgaXRlbSBmcm9tIHRoZSBEYXRhYmFzZS5cIixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQuSXRlbXMpLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoICh0cnllcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBcIiArIHRyeWVycm9yKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNTAxLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIlByb2JsZW0gd2l0aCBsYW1iZGEuIFwiICsgdHJ5ZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEl0ZW1CeUtleSh0YWJsZW5hbWU6IHN0cmluZywga2V5bmFtZTogYW55LCBrZXl2YWx1ZTogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgY29uc3QgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbiA9IFwiI1wiICsga2V5bmFtZSArIFwiID0gOlwiICsga2V5bmFtZTtcclxuICBjb25zdCBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXMgPSB1cGRhdGVleHByZXNzaW9ubmFtZXMoW2tleW5hbWVdKTtcclxuICBjb25zdCBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzID0gbmV3ZXhwcmVzc2lvbihba2V5bmFtZV0sIGtleXZhbHVlKTtcclxuICB2YXIgcGFyYW1zID0ge1xyXG4gICAgVGFibGVOYW1lOiB0YWJsZW5hbWUsXHJcbiAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiBLZXlDb25kaXRpb25FeHByZXNzaW9uLFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXMsXHJcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzLFxyXG4gIH07XHJcbiAgZG9jQ2xpZW50LnF1ZXJ5KHBhcmFtcywgY2FsbGJhY2spO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5nZXRCeUluZGV4ID0gZ2V0QnlJbmRleDtcclxuZnVuY3Rpb24gZ2V0QnlJbmRleChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICBjb25zdCBwYXRoID0gZXZlbnQucGF0aDtcclxuICBjb25zdCBzZXR0aW5ncyA9IF9TZXR0aW5ncztcclxuICBjb25zdCBhcGlTZXR0aW5ncyA9IHNldHRpbmdzLmZpbmQoKHgpID0+IHguYmFzZWVuZHBvaW50ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsxXSk7XHJcbiAgaWYgKCFhcGlTZXR0aW5ncykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBCYWQgc2V0dXAsIG5vIHRhYmxlbmFtZS5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gVGFibGUgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGZ1bmMgPSBhcGlTZXR0aW5ncy5mdW5jdGlvbnMuZmluZCgoeCkgPT4geCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMl0ucmVwbGFjZShcImdldEJ5XCIsIFwiZ2V0QnktXCIpKTtcclxuICBpZiAoIWZ1bmMpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUVSUk9SOiBCYWQgc2V0dXAsIG5vIGZ1bmN0aW9uLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBRdWVyeSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHByaW1hcnlpbmRleCA9IGZ1bmMuc3BsaXQoXCItXCIpWzFdIHx8IFwiaWRcIjtcclxuICAgIGlmICghZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzW3ByaW1hcnlpbmRleF0pIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBpbmRleCBub3QgcHJvdmlkZWQgaW4gYXBpIGNhbGxcIik7XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBDb3VsZCBub3QgZmluZCBcIiArIHByaW1hcnlpbmRleCArIFwiIGluIHJlcXVlc3QuXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCB0YWJsZW5hbWUgPSBhcGlTZXR0aW5ncy50YWJsZW5hbWUgfHwgXCJ1bmRlZmluZWRcIjtcclxuICAgIGdldEl0ZW1CeUluZGV4KHRhYmxlbmFtZSwgcHJpbWFyeWluZGV4LCBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnNbcHJpbWFyeWluZGV4XSwgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgICAgYm9keTogXCJDb3VsZCBub3QgZmV0Y2ggdGhlIGl0ZW0gZnJvbSB0aGUgRGF0YWJhc2UuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0Lkl0ZW1zKSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAodHJ5ZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogXCIgKyB0cnllcnJvcik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDUwMSxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJQcm9ibGVtIHdpdGggbGFtYmRhLiBcIiArIHRyeWVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRJdGVtQnlJbmRleCh0YWJsZW5hbWU6IHN0cmluZywga2V5bmFtZTogYW55LCBrZXl2YWx1ZTogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgY29uc3QgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbiA9IFwiI1wiICsga2V5bmFtZSArIFwiID0gOlwiICsga2V5bmFtZTtcclxuICBjb25zdCBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXMgPSB1cGRhdGVleHByZXNzaW9ubmFtZXMoW2tleW5hbWVdKTtcclxuICBjb25zdCBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzID0gbmV3ZXhwcmVzc2lvbihba2V5bmFtZV0sIGtleXZhbHVlKTtcclxuICB2YXIgcGFyYW1zID0ge1xyXG4gICAgVGFibGVOYW1lOiB0YWJsZW5hbWUsXHJcbiAgICBJbmRleE5hbWU6IGtleW5hbWUgKyBcIi1pbmRleFwiLFxyXG4gICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogS2V5Q29uZGl0aW9uRXhwcmVzc2lvbixcclxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzLFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczogRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyxcclxuICB9O1xyXG4gIGRvY0NsaWVudC5xdWVyeShwYXJhbXMsIGNhbGxiYWNrKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0SXRlbUJ5RHVhbEluZGV4KHRhYmxlbmFtZTogc3RyaW5nLCBrZXluYW1lczogYW55LCBrZXl2YWx1ZXM6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIGNvbnN0IEtleUNvbmRpdGlvbkV4cHJlc3Npb24gPSBcIiNcIiArIGtleW5hbWVzWzBdICsgXCIgPSA6XCIgKyBrZXluYW1lc1swXSArIFwiIEFORCAjXCIgKyBrZXluYW1lc1sxXSArIFwiID0gOlwiICsga2V5bmFtZXNbMV07XHJcbiAgY29uc3QgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0gdXBkYXRlZXhwcmVzc2lvbm5hbWVzKGtleW5hbWVzKTtcclxuICBjb25zdCBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzID0gbmV3ZXhwcmVzc2lvbnMoa2V5bmFtZXMsIGtleXZhbHVlcyk7XHJcbiAgdmFyIHBhcmFtcyA9IHtcclxuICAgIFRhYmxlTmFtZTogdGFibGVuYW1lLFxyXG4gICAgSW5kZXhOYW1lOiBrZXluYW1lc1swXSArIFwiLVwiICsga2V5bmFtZXNbMV0gKyBcIi1pbmRleFwiLFxyXG4gICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogS2V5Q29uZGl0aW9uRXhwcmVzc2lvbixcclxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzLFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczogRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyxcclxuICB9O1xyXG4gIGRvY0NsaWVudC5xdWVyeShwYXJhbXMsIGNhbGxiYWNrKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuZ2V0QWxsQnlGaWx0ZXIgPSAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSA9PiB7XHJcbiAgY29uc3QgcGF0aCA9IGV2ZW50LnBhdGg7XHJcbiAgY29uc3Qgc2V0dGluZ3MgPSBfU2V0dGluZ3M7XHJcbiAgY29uc3QgYXBpU2V0dGluZ3MgPSBzZXR0aW5ncy5maW5kKCh4KSA9PiB4LmJhc2VlbmRwb2ludCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMV0pO1xyXG4gIGlmICghYXBpU2V0dGluZ3MpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogQmFkIHNldHVwLCBubyB0YWJsZW5hbWUuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFRhYmxlIG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBmdW5jID0gYXBpU2V0dGluZ3MuZnVuY3Rpb25zLmZpbmQoKHgpID0+IHggPT09IHBhdGguc3BsaXQoXCIvXCIpWzJdLnJlcGxhY2UoXCJnZXRCeVwiLCBcImdldEJ5LVwiKSk7XHJcbiAgaWYgKCFmdW5jKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1FUlJPUjogQmFkIHNldHVwLCBubyBmdW5jdGlvbi5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gUXVlcnkgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGluZGV4aW5mbyA9IGZpbmRJbmRleEluZm8oZnVuYywgYXBpU2V0dGluZ3MpO1xyXG4gIGlmICghYXBpU2V0dGluZ3MudGFibGVuYW1lIHx8IGluZGV4aW5mbykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBCYWQgc2V0dXAsIG5vIHRhYmxlbmFtZSBvciBmaWx0ZXIuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFRhYmxlIG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgZ2V0QWxsQnlGaWx0ZXIoYXBpU2V0dGluZ3MudGFibGVuYW1lLCBpbmRleGluZm8sIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgICAgIGJvZHk6IFwiQ291bGQgbm90IHJlYWNoIERhdGFiYXNlLlwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcclxuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5JdGVtcyksXHJcbiAgICAgIH07XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICB2YXIgYm9keSA9IEpTT04uc3RyaW5naWZ5KGVycm9yLCBudWxsLCAyKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogXCIgKyBKU09OLnN0cmluZ2lmeShib2R5KSk7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGdldEFsbEJ5RmlsdGVyKHRhYmxlbmFtZTogc3RyaW5nLCBmaWx0ZXI6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIHZhciBwYXJhbXMgPSB7XHJcbiAgICBUYWJsZU5hbWU6IHRhYmxlbmFtZSxcclxuICAgIEZpbHRlckV4cHJlc3Npb246IGZpbHRlcixcclxuICB9O1xyXG4gIGRvY0NsaWVudC5zY2FuKHBhcmFtcywgY2FsbGJhY2spO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBbGxCeUZpbHRlclZhbHVlKHRhYmxlbmFtZTogc3RyaW5nLCBmaWx0ZXI6IGFueSwgZmlsdGVybmFtZTogYW55LCBmaWx0ZXJ2YWx1ZTogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgY29uc3QgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0gdXBkYXRlZXhwcmVzc2lvbm5hbWVzKGZpbHRlcm5hbWUpO1xyXG4gIGNvbnN0IEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMgPSBuZXdleHByZXNzaW9uKFtmaWx0ZXJuYW1lXSwgZmlsdGVydmFsdWUpO1xyXG4gIHZhciBwYXJhbXMgPSB7XHJcbiAgICBUYWJsZU5hbWU6IHRhYmxlbmFtZSxcclxuICAgIEZpbHRlckV4cHJlc3Npb246IGZpbHRlcixcclxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMsXHJcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyxcclxuICB9O1xyXG4gIGRvY0NsaWVudC5zY2FuKHBhcmFtcywgY2FsbGJhY2spO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBbGxCeUZpbHRlclZhbHVlcyh0YWJsZW5hbWU6IHN0cmluZywgZmlsdGVyOiBhbnksIGZpbHRlcm5hbWVzOiBhbnksIGZpbHRlcnZhbHVlczogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgY29uc3QgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0gdXBkYXRlZXhwcmVzc2lvbm5hbWVzKGZpbHRlcm5hbWVzKTtcclxuICBjb25zdCBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzID0gbmV3ZXhwcmVzc2lvbnMoZmlsdGVybmFtZXMsIGZpbHRlcnZhbHVlcyk7XHJcbiAgdmFyIHBhcmFtcyA9IHtcclxuICAgIFRhYmxlTmFtZTogdGFibGVuYW1lLFxyXG4gICAgRmlsdGVyRXhwcmVzc2lvbjogZmlsdGVyLFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczogRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyxcclxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzLFxyXG4gIH07XHJcbiAgZG9jQ2xpZW50LnNjYW4ocGFyYW1zLCBjYWxsYmFjayk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLmdldEFjdGl2ZSA9IGdldEFjdGl2ZTtcclxuZnVuY3Rpb24gZ2V0QWN0aXZlKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIGNvbnN0IHBhdGggPSBldmVudC5wYXRoO1xyXG4gIGNvbnN0IHNldHRpbmdzID0gX1NldHRpbmdzO1xyXG4gIGNvbnN0IGFwaVNldHRpbmdzID0gc2V0dGluZ3MuZmluZCgoeCkgPT4geC5iYXNlZW5kcG9pbnQgPT09IHBhdGguc3BsaXQoXCIvXCIpWzFdKTtcclxuICBpZiAoIWFwaVNldHRpbmdzKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEJhZCBzZXR1cCwgbm8gdGFibGVuYW1lLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBUYWJsZSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgZnVuYyA9IGFwaVNldHRpbmdzLmZ1bmN0aW9ucy5maW5kKCh4KSA9PiB4ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsyXS5yZXBsYWNlKFwiZ2V0QnlcIiwgXCJnZXRCeS1cIikpO1xyXG4gIGlmICghZnVuYykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRVJST1I6IEJhZCBzZXR1cCwgbm8gZnVuY3Rpb24uXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFF1ZXJ5IG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBpbmRleGluZm8gPSBmaW5kSW5kZXhJbmZvKGZ1bmMsIGFwaVNldHRpbmdzKTtcclxuICBpZiAoIWFwaVNldHRpbmdzLnRhYmxlbmFtZSB8fCAhaW5kZXhpbmZvKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEJhZCBzZXR1cCwgbm8gdGFibGVuYW1lIG9yIGZpbHRlci5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gVGFibGUgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBnZXRBY3RpdmVJdGVtcyhhcGlTZXR0aW5ncy50YWJsZW5hbWUsIGluZGV4aW5mbywgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICAgICAgYm9keTogXCJDb3VsZCBub3QgcmVhY2ggRGF0YWJhc2UuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0Lkl0ZW1zKSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHZhciBib2R5ID0gSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpO1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBcIiArIEpTT04uc3RyaW5naWZ5KGJvZHkpKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBY3RpdmVJdGVtcyh0YWJsZW5hbWU6IHN0cmluZywgZmlsdGVyOiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICB2YXIgcGFyYW1zID0ge1xyXG4gICAgVGFibGVOYW1lOiB0YWJsZW5hbWUsXHJcbiAgICBGaWx0ZXJFeHByZXNzaW9uOiBmaWx0ZXIsXHJcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XHJcbiAgICAgIFwiOkRhdGVUaW1lXCI6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgIH0sXHJcbiAgfTtcclxuICBkb2NDbGllbnQuc2NhbihwYXJhbXMsIGNhbGxiYWNrKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMucmVnaXN0ZXIgPSByZWdpc3RlcjtcclxuZnVuY3Rpb24gcmVnaXN0ZXIoZXZlbnQ6IGFueSwgY29udGV4dDogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgY29uc3QgcGF0aCA9IGV2ZW50LnBhdGg7XHJcbiAgY29uc3Qgc2V0dGluZ3MgPSBfU2V0dGluZ3M7XHJcbiAgY29uc3QgYXBpU2V0dGluZ3MgPSBzZXR0aW5ncy5maW5kKCh4KSA9PiB4LmJhc2VlbmRwb2ludCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMV0pO1xyXG4gIGlmICghYXBpU2V0dGluZ3MpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogQmFkIHNldHVwLCBubyB0YWJsZW5hbWUuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFRhYmxlIG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBmdW5jID0gYXBpU2V0dGluZ3MuZnVuY3Rpb25zLmZpbmQoKHgpID0+IHggPT09IHBhdGguc3BsaXQoXCIvXCIpWzJdLnJlcGxhY2UoXCJnZXRCeVwiLCBcImdldEJ5LVwiKSk7XHJcbiAgaWYgKCFmdW5jKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1FUlJPUjogQmFkIHNldHVwLCBubyBmdW5jdGlvbi5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gUXVlcnkgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IHRhYmxlbmFtZSA9IGFwaVNldHRpbmdzLnRhYmxlbmFtZSB8fCBcInVuZGVmaW5lZFwiO1xyXG4gIGNvbnN0IHByaW1hcnlrZXkgPSBhcGlTZXR0aW5ncy5wcmltYXJ5a2V5Lm5hbWUgfHwgXCJpZFwiO1xyXG4gIGNvbnN0IHNlY29uZGFyeWtleSA9IGFwaVNldHRpbmdzLnNlY29uZGFyeWtleT8ubmFtZSB8fCBcIlwiO1xyXG4gIGlmICghdGFibGVuYW1lIHx8ICFhcGlTZXR0aW5ncy5maWVsZHMpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogQmFkIHNldHVwLCBubyB0YWJsZW5hbWUuXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFRhYmxlIG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgcGF5bG9hZCA9IGV2ZW50LmJvZHk7XHJcbiAgICBpZiAoIWV2ZW50LmJvZHkgfHwgIWNoZWNrUGF5bG9hZChwYXlsb2FkLCBwcmltYXJ5a2V5LCBzZWNvbmRhcnlrZXksIGFwaVNldHRpbmdzLmZpZWxkcykpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBJbXByb3BlciBwYXlsb2FkOiBcIiArIGV2ZW50LmJvZHkpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtc2c6IFwiQmFkIFJlcXVlc3QuIENvdWxkIG5vdCBmaW5kIGZ1bGwgcGF5bG9hZCBvZiByZXF1ZXN0LlwiLCBwYXJhbXM6IGV2ZW50IH0pLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG5ld0l0ZW0gPSBjb252ZXJ0VG9BV1NJdGVtKEpTT04ucGFyc2UocGF5bG9hZCksIHByaW1hcnlrZXksIHNlY29uZGFyeWtleSwgYXBpU2V0dGluZ3MuZmllbGRzKTtcclxuICAgIGNvbnNvbGUubG9nKG5ld0l0ZW0pO1xyXG4gICAgYWRkSXRlbSh0YWJsZW5hbWUsIG5ld0l0ZW0sIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IFVuYWJsZSB0byBhZGQgaXRlbTogXCIgKyBlcnJvcik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgICAgc3RhdHVzQ29kZTogZXJyb3Iuc3RhdHVzQ29kZSB8fCA1MDEsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgbXNnOiBcIkZhaWxlZCB0byByZWdpc3RlcjogXCIgKyBlcnJvciwgaXRlbTogbmV3SXRlbSB9KSxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBtc2c6IFwiUmVnaXN0ZXJlZFwiIH0pLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoICh0cnllcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBSZWdpc3RlciBmdW5jdGlvbiBlcnJvcjogXCIgKyB0cnllcnJvcik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDUwMSxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJQcm9ibGVtIHdpdGggbGFtYmRhLiBcIiArIHRyeWVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjb252ZXJ0VG9BV1NJdGVtKHBheWxvYWQ6IGFueSwgcHJpbWFyeWtleTogc3RyaW5nLCBzZWNvbmRhcnlrZXk6IHN0cmluZywgZmllbGRzOiBhbnkpIHtcclxuICBjb25zdCBmaWVsZHNvYmogPSBKU09OLnBhcnNlKGZpZWxkcyk7XHJcbiAgbGV0IEl0ZW06IGFueSA9IHt9O1xyXG4gIGNvbnN0IHByaW1Qcm9wVHlwZSA9IHByb3BUeXBlKHByaW1hcnlrZXksIHBheWxvYWQsIGZpZWxkc29iaik7XHJcbiAgSXRlbVtwcmltYXJ5a2V5XSA9IHByaW1Qcm9wVHlwZTtcclxuICBpZiAoc2Vjb25kYXJ5a2V5ICE9PSBcIlwiICYmIHBheWxvYWRbc2Vjb25kYXJ5a2V5XSkge1xyXG4gICAgY29uc3Qgc2VjUHJvcFR5cGUgPSBwcm9wVHlwZShzZWNvbmRhcnlrZXksIHBheWxvYWQsIGZpZWxkc29iaik7XHJcbiAgICBJdGVtW3NlY29uZGFyeWtleV0gPSBzZWNQcm9wVHlwZTtcclxuICB9XHJcbiAgZmllbGRzb2JqLmZvckVhY2goKGZpZWxkOiBhbnkpID0+IHtcclxuICAgIGlmIChwYXlsb2FkW2ZpZWxkLm5hbWVdKSB7XHJcbiAgICAgIGNvbnN0IHNlbFByb3BUeXBlID0gcHJvcFR5cGUoZmllbGQubmFtZSwgcGF5bG9hZCwgZmllbGRzb2JqKTtcclxuICAgICAgSXRlbVtmaWVsZC5uYW1lXSA9IHNlbFByb3BUeXBlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiBJdGVtO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcm9wVHlwZShmaWVsZDogYW55LCB2YWx1ZTogYW55LCBmaWVsZHNvYmo6IGFueSkge1xyXG4gIGNvbnN0IGZpZWxkRnVsbCA9IGZpZWxkc29iai5maWx0ZXIoKHg6IGFueSkgPT4geC5uYW1lID09PSBmaWVsZCk7XHJcbiAgaWYgKCFmaWVsZEZ1bGwgfHwgZmllbGRGdWxsLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIHsgUzogdmFsdWVbZmllbGRdIH07XHJcbiAgfVxyXG4gIHN3aXRjaCAoZmllbGRGdWxsWzBdLnR5cGUpIHtcclxuICAgIGNhc2UgXCJieXRlXCI6XHJcbiAgICAgIHJldHVybiB7IEI6IHZhbHVlW2ZpZWxkRnVsbFswXS5uYW1lXSB9O1xyXG4gICAgY2FzZSBcImJvb2xlYW5cIjpcclxuICAgICAgcmV0dXJuIHsgQk9PTDogdmFsdWVbZmllbGRGdWxsWzBdLm5hbWVdIH07XHJcbiAgICBjYXNlIFwibnVtYmVyXCI6XHJcbiAgICAgIHJldHVybiB7IE46IHZhbHVlW2ZpZWxkRnVsbFswXS5uYW1lXS50b1N0cmluZygpIH07XHJcbiAgICBjYXNlIFwiYXJyYXlfYnl0ZVwiOlxyXG4gICAgICByZXR1cm4geyBCUzogdmFsdWVbZmllbGRGdWxsWzBdLm5hbWVdIH07XHJcbiAgICBjYXNlIFwiYXJyYXlfbnVtYmVyXCI6XHJcbiAgICAgIHJldHVybiB7IE5TOiB2YWx1ZVtmaWVsZEZ1bGxbMF0ubmFtZV0gfTtcclxuICAgIGNhc2UgXCJhcnJheV9zdHJpbmdcIjpcclxuICAgICAgcmV0dXJuIHsgU1M6IHZhbHVlW2ZpZWxkRnVsbFswXS5uYW1lXSB9O1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuIHsgUzogdmFsdWVbZmllbGRGdWxsWzBdLm5hbWVdIH07XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja1BheWxvYWQobmV3cGF5bG9hZDogYW55LCBwcmltYXJ5a2V5OiBzdHJpbmcsIHNlY29uZGFyeWtleTogc3RyaW5nLCBmaWVsZHM6IGFueSkge1xyXG4gIGNvbnN0IGZpZWxkc29iaiA9IEpTT04ucGFyc2UoZmllbGRzKTtcclxuICBjb25zdCBwYXlsb2FkID0gSlNPTi5wYXJzZShuZXdwYXlsb2FkKTtcclxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocGF5bG9hZCk7XHJcbiAgaWYgKCFwYXlsb2FkW3ByaW1hcnlrZXldKSByZXR1cm4gZmFsc2U7XHJcbiAgaWYgKHNlY29uZGFyeWtleSAhPT0gXCJcIiAmJiAhcGF5bG9hZFtzZWNvbmRhcnlrZXldKSByZXR1cm4gZmFsc2U7XHJcbiAgbGV0IGZsYWcgPSB0cnVlO1xyXG4gIGZpZWxkc29iai5mb3JFYWNoKChmaWVsZDogYW55KSA9PiB7XHJcbiAgICBpZiAoZmllbGQucmVxdWlyZWQgJiYgIWtleXMuaW5jbHVkZXMoZmllbGQubmFtZSkpIGZsYWcgPSBmYWxzZTtcclxuICB9KTtcclxuICByZXR1cm4gZmxhZztcclxufVxyXG5cclxuZnVuY3Rpb24gYWRkSXRlbSh0YWJsZW5hbWU6IHN0cmluZywgbmV3SXRlbTogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgdmFyIGNsaWVudCA9IG5ldyBEeW5hbW9EQigpO1xyXG4gIHZhciBwYXJhbXMgPSB7XHJcbiAgICBUYWJsZU5hbWU6IHRhYmxlbmFtZSxcclxuICAgIEl0ZW06IG5ld0l0ZW0sXHJcbiAgfTtcclxuICBjbGllbnQucHV0SXRlbShwYXJhbXMsIGNhbGxiYWNrKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuZGVsZXRlID0gZGVsZXRlSXRlbTtcclxuZnVuY3Rpb24gZGVsZXRlSXRlbShldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICBjb25zdCBwYXRoID0gZXZlbnQucGF0aDtcclxuICBjb25zdCBzZXR0aW5ncyA9IF9TZXR0aW5ncztcclxuICBjb25zdCBhcGlTZXR0aW5ncyA9IHNldHRpbmdzLmZpbmQoKHgpID0+IHguYmFzZWVuZHBvaW50ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsxXSk7XHJcbiAgaWYgKCFhcGlTZXR0aW5ncykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBCYWQgc2V0dXAsIG5vIHRhYmxlbmFtZS5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gVGFibGUgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGZ1bmMgPSBhcGlTZXR0aW5ncy5mdW5jdGlvbnMuZmluZCgoeCkgPT4geCA9PT0gcGF0aC5zcGxpdChcIi9cIilbMl0ucmVwbGFjZShcImdldEJ5XCIsIFwiZ2V0QnktXCIpKTtcclxuICBpZiAoIWZ1bmMpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUVSUk9SOiBCYWQgc2V0dXAsIG5vIGZ1bmN0aW9uLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBRdWVyeSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgdGFibGVuYW1lID0gYXBpU2V0dGluZ3MudGFibGVuYW1lIHx8IFwidW5kZWZpbmVkXCI7XHJcbiAgY29uc3QgcHJpbWFyeWtleSA9IGFwaVNldHRpbmdzLnByaW1hcnlrZXkubmFtZSB8fCBcImlkXCI7XHJcbiAgY29uc3Qgc2Vjb25kYXJ5a2V5ID0gYXBpU2V0dGluZ3Muc2Vjb25kYXJ5a2V5Py5uYW1lIHx8IFwiXCI7XHJcbiAgaWYgKCF0YWJsZW5hbWUgfHwgIWFwaVNldHRpbmdzLmZpZWxkcykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBCYWQgc2V0dXAsIG5vIHRhYmxlbmFtZS5cIik7XHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSxcclxuICAgICAgYm9keTogXCJCYWQgUmVxdWVzdC4gVGFibGUgbm90IGZvdW5kLlwiLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5wYXJzZShldmVudC5ib2R5KTtcclxuICAgIGlmICghZXZlbnQuYm9keSB8fCAhcGF5bG9hZCB8fCAhcGF5bG9hZFtwcmltYXJ5a2V5XSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEltcHJvcGVyIHBheWxvYWQ6IFwiICsgZXZlbnQuYm9keSk7XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1zZzogXCJCYWQgUmVxdWVzdC4gQ291bGQgbm90IGZpbmQgZnVsbCBrZXkuXCIsIHBhcmFtczogZXZlbnQgfSksXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGtleTogYW55ID0ge307XHJcbiAgICBrZXlbcHJpbWFyeWtleV0gPSBwYXlsb2FkW3ByaW1hcnlrZXldO1xyXG4gICAgaWYgKHNlY29uZGFyeWtleSAhPT0gXCJcIikga2V5W3NlY29uZGFyeWtleV0gPSBwYXlsb2FkW3NlY29uZGFyeWtleV07XHJcblxyXG4gICAgcmVtb3ZlSXRlbSh0YWJsZW5hbWUsIGtleSwgKGVycm9yOiBhbnksIHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogVW5hYmxlIHRvIHJlbW92ZSBpdGVtOiBcIiArIGVycm9yKTtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlIHx8IDUwMSxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBtc2c6IFwiRmFpbGVkIHRvIHJlbW92ZSBpdGVtIDogXCIgKyBlcnJvciwga2V5OiBrZXkgfSksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgbXNnOiBcIlJlbW92ZWRcIiB9KSxcclxuICAgICAgfTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAodHJ5ZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogRGVsZXRlIGZ1bmN0aW9uIGVycm9yOiBcIiArIHRyeWVycm9yKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNTAxLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIlByb2JsZW0gd2l0aCBsYW1iZGEuIFwiICsgdHJ5ZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZUl0ZW0odGFibGVuYW1lOiBzdHJpbmcsIGtleTogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgdmFyIGdldHBhcmFtcyA9IHtcclxuICAgIFRhYmxlTmFtZTogdGFibGVuYW1lLFxyXG4gICAgS2V5OiBrZXksXHJcbiAgfTtcclxuICBkb2NDbGllbnQuZGVsZXRlKGdldHBhcmFtcywgKGVycjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgaWYgKGVycikgY2FsbGJhY2soZXJyLCB7IHN0YXR1czogNDAwLCBtc2c6IGVyciB9KTtcclxuICAgIGVsc2UgY2FsbGJhY2sobnVsbCwgeyBzdGF0dXM6IDIwMCwgbXNnOiByZXN1bHQgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLnVwZGF0ZSA9IHVwZGF0ZTtcclxuZnVuY3Rpb24gdXBkYXRlKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gIGNvbnN0IHBhdGggPSBldmVudC5wYXRoO1xyXG4gIGNvbnN0IHNldHRpbmdzID0gX1NldHRpbmdzO1xyXG4gIGNvbnN0IGFwaVNldHRpbmdzID0gc2V0dGluZ3MuZmluZCgoeCkgPT4geC5iYXNlZW5kcG9pbnQgPT09IHBhdGguc3BsaXQoXCIvXCIpWzFdKTtcclxuICBpZiAoIWFwaVNldHRpbmdzKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEJhZCBzZXR1cCwgbm8gdGFibGVuYW1lLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBUYWJsZSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgZnVuYyA9IGFwaVNldHRpbmdzLmZ1bmN0aW9ucy5maW5kKCh4KSA9PiB4ID09PSBwYXRoLnNwbGl0KFwiL1wiKVsyXS5yZXBsYWNlKFwiZ2V0QnlcIiwgXCJnZXRCeS1cIikpO1xyXG4gIGlmICghZnVuYykge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRVJST1I6IEJhZCBzZXR1cCwgbm8gZnVuY3Rpb24uXCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiQmFkIFJlcXVlc3QuIFF1ZXJ5IG5vdCBmb3VuZC5cIixcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCB0YWJsZW5hbWUgPSBhcGlTZXR0aW5ncy50YWJsZW5hbWUgfHwgXCJ1bmRlZmluZWRcIjtcclxuICBjb25zdCBwcmltYXJ5a2V5ID0gYXBpU2V0dGluZ3MucHJpbWFyeWtleS5uYW1lIHx8IFwiaWRcIjtcclxuICBjb25zdCBzZWNvbmRhcnlrZXkgPSBhcGlTZXR0aW5ncy5zZWNvbmRhcnlrZXk/Lm5hbWUgfHwgXCJcIjtcclxuICBpZiAoIXRhYmxlbmFtZSB8fCAhYXBpU2V0dGluZ3MuZmllbGRzKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJLS1MQU1CREEtLURZTkFNT0RCLS1GQUlMRUQ6IEJhZCBzZXR1cCwgbm8gdGFibGVuYW1lLlwiKTtcclxuICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxyXG4gICAgICBib2R5OiBcIkJhZCBSZXF1ZXN0LiBUYWJsZSBub3QgZm91bmQuXCIsXHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHBheWxvYWQgPSBKU09OLnBhcnNlKGV2ZW50LmJvZHkpO1xyXG4gICAgaWYgKCFldmVudC5ib2R5IHx8ICFwYXlsb2FkIHx8ICFwYXlsb2FkW3ByaW1hcnlrZXldKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJBUEktLUxBTUJEQS0tRFlOQU1PREItLUZBSUxFRDogSW1wcm9wZXIgcGF5bG9hZDogXCIgKyBldmVudC5ib2R5KTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbXNnOiBcIkJhZCBSZXF1ZXN0LiBDb3VsZCBub3QgZmluZCBmdWxsIGtleS5cIiwgcGFyYW1zOiBldmVudCB9KSxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQga2V5ID0gW3ByaW1hcnlrZXldO1xyXG4gICAgaWYgKHNlY29uZGFyeWtleSAhPT0gXCJcIikga2V5LnB1c2goc2Vjb25kYXJ5a2V5KTtcclxuXHJcbiAgICB1cGRhdGVJdGVtKHRhYmxlbmFtZSwga2V5LCBwYXlsb2FkLCAoZXJyb3I6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBVbmFibGUgdG8gdXBkYXRlIGl0ZW06IFwiICsgZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHtcclxuICAgICAgICAgIHN0YXR1c0NvZGU6IGVycm9yLnN0YXR1c0NvZGUgfHwgNTAxLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiwgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIG1zZzogXCJGYWlsZWQgdG8gdXBkYXRlIGl0ZW0gOiBcIiArIGVycm9yLCBrZXk6IGtleSB9KSxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBtc2c6IFwiVXBkYXRlZFwiLCByZXNwb25zZTogcmVzdWx0IH0pLFxyXG4gICAgICB9O1xyXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICB9KTtcclxuICB9IGNhdGNoICh0cnllcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFQSS0tTEFNQkRBLS1EWU5BTU9EQi0tRkFJTEVEOiBEZWxldGUgZnVuY3Rpb24gZXJyb3I6IFwiICsgdHJ5ZXJyb3IpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwge1xyXG4gICAgICBzdGF0dXNDb2RlOiA1MDEsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0sXHJcbiAgICAgIGJvZHk6IFwiUHJvYmxlbSB3aXRoIGxhbWJkYS4gXCIgKyB0cnllcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlSXRlbSh0YWJsZW5hbWU6IHN0cmluZywgZmlsdGVyczogc3RyaW5nW10sIHVwZGF0ZWRJdGVtOiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICBsZXQgZmllbGRzID0gT2JqZWN0LmtleXModXBkYXRlZEl0ZW0pO1xyXG4gIGZpZWxkcyA9IGZpZWxkcy5maWx0ZXIoKHgpID0+ICFmaWx0ZXJzLmluY2x1ZGVzKHgpKTtcclxuICBjb25zdCB1cGRhdGUgPSBcInNldCBcIiArIHVwZGF0ZWZpZWxkcyhmaWVsZHMpO1xyXG4gIGNvbnN0IGV4cHJlc3Npb252YWxzID0gdXBkYXRlZXhwcmVzc2lvbihmaWVsZHMsIHVwZGF0ZWRJdGVtKTtcclxuICBjb25zdCBleHByZXNzaW9ubmFtZXMgPSB1cGRhdGVleHByZXNzaW9ubmFtZXMoZmllbGRzKTtcclxuICBjb25zdCBrZXlzID0gc2V0a2V5cyhmaWx0ZXJzLCB1cGRhdGVkSXRlbSk7XHJcbiAgdmFyIHBhcmFtcyA9IHtcclxuICAgIFRhYmxlTmFtZTogdGFibGVuYW1lLFxyXG4gICAgS2V5OiBrZXlzLFxyXG4gICAgVXBkYXRlRXhwcmVzc2lvbjogdXBkYXRlLFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczogZXhwcmVzc2lvbnZhbHMsXHJcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IGV4cHJlc3Npb25uYW1lcyxcclxuICAgIFJldHVyblZhbHVlczogXCJVUERBVEVEX05FV1wiLFxyXG4gIH07XHJcbiAgZG9jQ2xpZW50LnVwZGF0ZShwYXJhbXMsIGNhbGxiYWNrKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0a2V5cyhmaWVsZHM6IGFueSwgaXRlbTogYW55KSB7XHJcbiAgbGV0IGV4cDogYW55ID0ge307XHJcbiAgZmllbGRzLmZvckVhY2goKHZhbDogYW55KSA9PiB7XHJcbiAgICBleHBbdmFsXSA9IGl0ZW1bdmFsXTtcclxuICB9KTtcclxuICByZXR1cm4gZXhwO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVmaWVsZHMoZmllbGRzOiBhbnkpIHtcclxuICBsZXQgb3V0cHV0ID0gXCJcIjtcclxuICBmaWVsZHMuZm9yRWFjaCgodmFsOiBhbnkpID0+IHtcclxuICAgIG91dHB1dCArPSBcIiNcIiArIHZhbCArIFwiPTpcIiArIHZhbCArIFwiLFwiO1xyXG4gIH0pO1xyXG4gIHJldHVybiBvdXRwdXQuc3Vic3RyaW5nKDAsIG91dHB1dC5sZW5ndGggLSAxKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlZXhwcmVzc2lvbihmaWVsZHM6IGFueSwgdXBkYXRlSXRlbTogYW55KSB7XHJcbiAgbGV0IGV4cDogYW55ID0ge307XHJcbiAgZmllbGRzLmZvckVhY2goKHZhbDogYW55KSA9PiB7XHJcbiAgICBleHBbXCI6XCIgKyB2YWxdID0gdXBkYXRlSXRlbVt2YWxdO1xyXG4gIH0pO1xyXG4gIHJldHVybiBleHA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5ld2V4cHJlc3Npb24oZmllbGRzOiBhbnksIHVwZGF0ZUl0ZW06IGFueSkge1xyXG4gIGxldCBleHA6IGFueSA9IHt9O1xyXG4gIGZpZWxkcy5mb3JFYWNoKCh2YWw6IGFueSkgPT4ge1xyXG4gICAgZXhwW1wiOlwiICsgdmFsXSA9IHVwZGF0ZUl0ZW07XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGV4cDtcclxufVxyXG5cclxuZnVuY3Rpb24gbmV3ZXhwcmVzc2lvbnMoZmllbGRzOiBhbnksIGl0ZW1zOiBhbnkpIHtcclxuICBsZXQgZXhwOiBhbnkgPSB7fTtcclxuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgZmllbGRzLmxlbmd0aDsgaW5kZXgrKykge1xyXG4gICAgZXhwW1wiOlwiICsgZmllbGRzW2luZGV4XV0gPSBpdGVtc1tpbmRleF07XHJcbiAgfVxyXG4gIHJldHVybiBleHA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZWV4cHJlc3Npb25uYW1lcyhmaWVsZHM6IGFueSkge1xyXG4gIGxldCBleHA6IGFueSA9IHt9O1xyXG4gIGZpZWxkcy5mb3JFYWNoKCh2YWw6IGFueSkgPT4ge1xyXG4gICAgZXhwW1wiI1wiICsgdmFsXSA9IHZhbDtcclxuICB9KTtcclxuICByZXR1cm4gZXhwO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kSW5kZXhJbmZvKGZ1bmM6IHN0cmluZywgYXBpOiBMYW1iZGFJbmZvKSB7XHJcbiAgaWYgKGZ1bmMuaW5jbHVkZXMoXCJnZXRCeS1cIikpIHtcclxuICAgIGNvbnN0IHZhbHVlID0gZnVuYy5zcGxpdChcIi1cIilbMV07XHJcbiAgICBpZiAodmFsdWUpIHJldHVybiBmdW5jLnNwbGl0KFwiLVwiKVsxXTtcclxuICAgIHJldHVybiBcIlwiO1xyXG4gIH1cclxuICBpZiAoZnVuYy5pbmNsdWRlcyhcImdldEFsbEJ5RmlsdGVyLVwiKSkge1xyXG4gICAgY29uc3QgdmFsdWUgPSBmdW5jLnNwbGl0KFwiLVwiKVsxXTtcclxuICAgIGlmICh2YWx1ZSkgcmV0dXJuIGFwaS5jdXN0b21maWx0ZXJzW3ZhbHVlXTtcclxuICAgIHJldHVybiBcIlwiO1xyXG4gIH1cclxuICBpZiAoZnVuYy5pbmNsdWRlcyhcImdldEFjdGl2ZVwiKSkgcmV0dXJuIGFwaS5jdXN0b21maWx0ZXJzW1wiZ2V0QWN0aXZlXCJdO1xyXG4gIHJldHVybiBcIlwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZWxlY3RGdW5jdGlvbihmdW5jOiBzdHJpbmcsIGFwaTogTGFtYmRhSW5mbykge1xyXG4gIGlmIChmdW5jLmluY2x1ZGVzKFwiZ2V0QnktXCIpKSB7XHJcbiAgICBjb25zdCB2YWx1ZSA9IGZ1bmMuc3BsaXQoXCItXCIpWzFdO1xyXG4gICAgaWYgKHZhbHVlID09PSBhcGkucHJpbWFyeWtleT8ubmFtZSkgcmV0dXJuIFwiZ2V0QnlJRFwiO1xyXG4gICAgcmV0dXJuIFwiZ2V0QnlJbmRleFwiO1xyXG4gIH1cclxuICBpZiAoZnVuYy5pbmNsdWRlcyhcImdldEFsbEJ5RmlsdGVyLVwiKSkge1xyXG4gICAgY29uc3QgdmFsdWUgPSBmdW5jLnNwbGl0KFwiLVwiKVsxXTtcclxuICAgIHJldHVybiBcImdldEFsbEJ5RmlsdGVyXCI7XHJcbiAgfVxyXG4gIHJldHVybiBmdW5jO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIExhbWJkYUluZm8ge1xyXG4gIG5hbWU6IHN0cmluZztcclxuICB0eXBlOiBzdHJpbmc7XHJcbiAgZmlsZW5hbWU6IHN0cmluZztcclxuICBmdW5jdGlvbnM6IHN0cmluZ1tdO1xyXG4gIHByaW1hcnlrZXk6IGZpZWxkcztcclxuICBzZWNvbmRhcnlrZXk/OiBmaWVsZHM7XHJcbiAgY3VzdG9tZmlsdGVycz86IGFueTtcclxuICBmaWVsZHM6IGZpZWxkc1tdO1xyXG4gIHRhYmxlbmFtZTogc3RyaW5nO1xyXG4gIGJhc2VlbmRwb2ludDogc3RyaW5nO1xyXG4gIGN1c3RvbUF1dGg/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBmaWVsZHMge1xyXG4gIG5hbWU6IHN0cmluZztcclxuICB0eXBlOiBzdHJpbmc7XHJcbiAgcmVxdWlyZWQ/OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgX1NldHRpbmdzOiBMYW1iZGFJbmZvW10gPSBbXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLUFjY2Vzc0xvZ3NcIixcclxuICAgIHR5cGU6IFwiZHluYW1vZGJcIixcclxuICAgIGZpbGVuYW1lOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcImdldEFsbFwiLCBcImdldEJ5LWRhdGVcIiwgXCJyZWdpc3RlclwiXSxcclxuICAgIHRhYmxlbmFtZTogXCJhY2Nlc3NfbG9nc1wiLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcImFjY2Vzc2xvZ3NcIixcclxuICAgIHByaW1hcnlrZXk6IHsgbmFtZTogXCJkYXRlXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIHNlY29uZGFyeWtleTogeyBuYW1lOiBcInRpbWUjb3JnI3VzZXJuYW1lXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIGZpZWxkczogW1xyXG4gICAgICB7IG5hbWU6IFwiZGF0YVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgIHsgbmFtZTogXCJ0aW1lXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJ0eXBlXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJ1c2VybmFtZSNvcmdcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItQXBwc1wiLFxyXG4gICAgdHlwZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZmlsZW5hbWU6IFwiZHluYW1vZGJcIixcclxuICAgIGZ1bmN0aW9uczogW1wiZ2V0QWxsXCIsIFwiZ2V0QnktbmFtZVwiLCBcImdldEJ5LWVudmlyb25tZW50XCIsIFwiZ2V0Qnktc3RhdHVzXCIsIFwiZ2V0Qnktb3duZXJOYW1lXCIsIFwicmVnaXN0ZXJcIiwgXCJkZWxldGVcIiwgXCJ1cGRhdGVcIl0sXHJcbiAgICB0YWJsZW5hbWU6IFwiYXBwc1wiLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcImFwcHNcIixcclxuICAgIHByaW1hcnlrZXk6IHsgbmFtZTogXCJuYW1lXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIHNlY29uZGFyeWtleTogeyBuYW1lOiBcImVudmlyb25tZW50XCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIGZpZWxkczogW1xyXG4gICAgICB7IG5hbWU6IFwiZGVzY3JpcHRpb25cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcImljb25cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcIm93bmVyRW1haWxcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcIm93bmVyTmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwic3RhdHVzXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJ1cmxcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcImltYWdlc1wiLCB0eXBlOiBcImFycmF5X3N0cmluZ1wiLCByZXF1aXJlZDogZmFsc2UgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItQXBwcy1QdWJsaWNcIixcclxuICAgIHR5cGU6IFwiZHluYW1vZGJcIixcclxuICAgIGZpbGVuYW1lOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcImdldEFsbFwiXSxcclxuICAgIHRhYmxlbmFtZTogXCJhcHBzXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwicHVibGljYXBwc1wiLFxyXG4gICAgcHJpbWFyeWtleTogeyBuYW1lOiBcIm5hbWVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgc2Vjb25kYXJ5a2V5OiB7IG5hbWU6IFwiZW52aXJvbm1lbnRcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJkZXNjcmlwdGlvblwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwiaWNvblwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwib3duZXJFbWFpbFwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwib3duZXJOYW1lXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJzdGF0dXNcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcInVybFwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwiaW1hZ2VzXCIsIHR5cGU6IFwiYXJyYXlfc3RyaW5nXCIsIHJlcXVpcmVkOiBmYWxzZSB9LFxyXG4gICAgXSxcclxuICAgIGN1c3RvbUF1dGg6IFwicHVibGljXCIsXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItRm9ybVN1Ym1pc3Npb25zXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXCJnZXRBbGxcIiwgXCJnZXRCeS1pZFwiLCBcInJlZ2lzdGVyXCIsIFwiZGVsZXRlXCIsIFwidXBkYXRlXCJdLFxyXG4gICAgdGFibGVuYW1lOiBcImZvcm1fc3VibWlzc2lvbnNcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJmb3Jtc3VibWlzc2lvbnNcIixcclxuICAgIHByaW1hcnlrZXk6IHsgbmFtZTogXCJpZFwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBmaWVsZHM6IFtcclxuICAgICAgeyBuYW1lOiBcImNyZWF0ZWRfYXRcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcImRhdGFcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcInBhcmVudGlkXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgeyBuYW1lOiBcInR5cGVcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItTmV3c2ZlZWRzXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXCJnZXRBbGxcIiwgXCJnZXRCeS1pZFwiLCBcImdldEJ5LWRlc3RpbmF0aW9uXCIsIFwicmVnaXN0ZXJcIiwgXCJkZWxldGVcIiwgXCJ1cGRhdGVcIl0sXHJcbiAgICB0YWJsZW5hbWU6IFwibmV3c2ZlZWRzXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwibmV3c2ZlZWRzXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwiZGVzdGluYXRpb25cIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgc2Vjb25kYXJ5a2V5OiB7IG5hbWU6IFwidHlwZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBmaWVsZHM6IFtcclxuICAgICAgeyBuYW1lOiBcInByaW9yaXR5XCIsIHR5cGU6IFwibnVtYmVyXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJpc0FyY2hpdmVkXCIsIHR5cGU6IFwiYm9vbGVhblwiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1keW5hbW9kYi1PcmdhbmlzYXRpb25zXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXCJ1cGRhdGVcIiwgXCJyZWdpc3RlclwiLCBcImRlbGV0ZVwiLCBcImdldEJ5LWNvZGVcIl0sXHJcbiAgICB0YWJsZW5hbWU6IFwib3JnYW5pc2F0aW9uc1wiLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcIm9yZ2FuaXNhdGlvbnNcIixcclxuICAgIHByaW1hcnlrZXk6IHsgbmFtZTogXCJuYW1lXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIHNlY29uZGFyeWtleTogeyBuYW1lOiBcImNvZGVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJhdXRobWV0aG9kXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJjb250YWN0XCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLU9yZ2FuaXNhdGlvbnMtUHVibGljXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXCJnZXRBbGxcIiwgXCJnZXRCeS1uYW1lXCJdLFxyXG4gICAgdGFibGVuYW1lOiBcIm9yZ2FuaXNhdGlvbnNcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJvcmdhbmlzYXRpb25cIixcclxuICAgIHByaW1hcnlrZXk6IHsgbmFtZTogXCJuYW1lXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIHNlY29uZGFyeWtleTogeyBuYW1lOiBcImNvZGVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJhdXRobWV0aG9kXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJjb250YWN0XCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICBdLFxyXG4gICAgY3VzdG9tQXV0aDogXCJwdWJsaWNcIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1keW5hbW9kYi1TeXN0ZW1BbGVydHNcIixcclxuICAgIHR5cGU6IFwiZHluYW1vZGJcIixcclxuICAgIGZpbGVuYW1lOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcInVwZGF0ZVwiLCBcInJlZ2lzdGVyXCIsIFwiZGVsZXRlXCIsIFwiZ2V0QWxsXCIsIFwiZ2V0QnktaWRcIiwgXCJnZXRBY3RpdmVcIl0sXHJcbiAgICBjdXN0b21maWx0ZXJzOiB7XHJcbiAgICAgIGdldEFjdGl2ZTogXCI6RGF0ZVRpbWUgQkVUV0VFTiBzdGFydGRhdGUgQU5EIGVuZGRhdGVcIixcclxuICAgIH0sXHJcbiAgICB0YWJsZW5hbWU6IFwic3lzdGVtYWxlcnRzXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwic3lzdGVtYWxlcnRzXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwiaWRcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgc2Vjb25kYXJ5a2V5OiB7IG5hbWU6IFwiYXV0aG9yXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIGZpZWxkczogW1xyXG4gICAgICB7IG5hbWU6IFwibmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwibWVzc2FnZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwic3RhcnRkYXRlXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJlbmRkYXRlXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJzdGF0dXNcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcImljb25cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItU3lzdGVtQWxlcnRzLVB1YmxpY1wiLFxyXG4gICAgdHlwZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZmlsZW5hbWU6IFwiZHluYW1vZGJcIixcclxuICAgIGZ1bmN0aW9uczogW1wiZ2V0QWxsXCJdLFxyXG4gICAgdGFibGVuYW1lOiBcInN5c3RlbWFsZXJ0c1wiLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcInN5c3RlbWFsZXJ0XCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwiaWRcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJuYW1lXCIsIHR5cGU6IFwiYm9vbGVhblwiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwibWVzc2FnZVwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwic3RhcnRkYXRlXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJlbmRkYXRlXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJzdGF0dXNcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcImljb25cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcImF1dGhvclwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgXSxcclxuICAgIGN1c3RvbUF1dGg6IFwicHVibGljXCIsXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItVGVhbXNcIixcclxuICAgIHR5cGU6IFwiZHluYW1vZGJcIixcclxuICAgIGZpbGVuYW1lOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcInVwZGF0ZVwiLCBcInJlZ2lzdGVyXCIsIFwiZGVsZXRlXCIsIFwiZ2V0QWxsXCIsIFwiZ2V0QnktaWRcIiwgXCJnZXRCeS1jb2RlXCIsIFwiZ2V0Qnktb3JnYW5pc2F0aW9uY29kZVwiXSxcclxuICAgIHRhYmxlbmFtZTogXCJ0ZWFtc1wiLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcInRlYW1zXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwiaWRcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgc2Vjb25kYXJ5a2V5OiB7IG5hbWU6IFwiY29kZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBmaWVsZHM6IFtcclxuICAgICAgeyBuYW1lOiBcImRlc2NyaXRpb25cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcIm5hbWVcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcIm9yZ2FuaXNhdGlvbmNvZGVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICB7IG5hbWU6IFwicmVzcG9uc2libGVwZW9wbGVcIiwgdHlwZTogXCJzdHJpbmdfYXJyYXlcIiB9LFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1keW5hbW9kYi1UZWFtTWVtYmVyc1wiLFxyXG4gICAgdHlwZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZmlsZW5hbWU6IFwiZHluYW1vZGJcIixcclxuICAgIGZ1bmN0aW9uczogW1widXBkYXRlXCIsIFwicmVnaXN0ZXJcIiwgXCJkZWxldGVcIiwgXCJnZXRBbGxcIiwgXCJnZXRCeS1pZFwiLCBcImdldEJ5LXRlYW1jb2RlXCIsIFwiZ2V0QnktdXNlcm5hbWVcIl0sXHJcbiAgICB0YWJsZW5hbWU6IFwidGVhbW1lbWJlcnNcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJ0ZWFtbWVtYmVyc1wiLFxyXG4gICAgcHJpbWFyeWtleTogeyBuYW1lOiBcImlkXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIHNlY29uZGFyeWtleTogeyBuYW1lOiBcInRlYW1jb2RlXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIGZpZWxkczogW1xyXG4gICAgICB7IG5hbWU6IFwidXNlcm5hbWVcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcImpvaW5kYXRlXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJyb2xlY29kZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgIHsgbmFtZTogXCJlbmRkYXRlXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItVGVhbVJlcXVlc3RzXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXCJ1cGRhdGVcIiwgXCJyZWdpc3RlclwiLCBcImRlbGV0ZVwiLCBcImdldEFsbFwiLCBcImdldEJ5LWlkXCIsIFwiZ2V0QnktdGVhbWNvZGVcIiwgXCJnZXRCeS11c2VybmFtZVwiXSxcclxuICAgIHRhYmxlbmFtZTogXCJ0ZWFtcmVxdWVzdHNcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJ0ZWFtcmVxdWVzdHNcIixcclxuICAgIHByaW1hcnlrZXk6IHsgbmFtZTogXCJpZFwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBzZWNvbmRhcnlrZXk6IHsgbmFtZTogXCJ0ZWFtY29kZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBmaWVsZHM6IFtcclxuICAgICAgeyBuYW1lOiBcInVzZXJuYW1lXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJyZXF1ZXN0b3JcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcInJlcXVlc3RkYXRlXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJhcHByb3ZlZGRhdGVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICB7IG5hbWU6IFwicmVmdXNlZGRhdGVcIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICB7IG5hbWU6IFwicmVxdWVzdGFwcHJvdmVyXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItVXNlcnNcIixcclxuICAgIHR5cGU6IFwiZHluYW1vZGJcIixcclxuICAgIGZpbGVuYW1lOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtdLFxyXG4gICAgdGFibGVuYW1lOiBcInVzZXJzXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwidXNlcnNcIixcclxuICAgIHByaW1hcnlrZXk6IHsgbmFtZTogXCJ1c2VybmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBzZWNvbmRhcnlrZXk6IHsgbmFtZTogXCJvcmdhbmlzYXRpb25cIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJlbWFpbFwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwibGluZW1hbmFnZXJcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcIm5hbWVcIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcclxuICAgICAgeyBuYW1lOiBcInBhc3N3b3JkXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICAgIHsgbmFtZTogXCJwYXNzd29yZF9leHBpcmVzXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLWR5bmFtb2RiLVZlcmlmaWNhdGlvbkNvZGVzXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXSxcclxuICAgIHRhYmxlbmFtZTogXCJ2ZXJpZmljYXRpb25jb2Rlc1wiLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcInZlcmlmaWNhdGlvbmNvZGVzXCIsXHJcbiAgICBwcmltYXJ5a2V5OiB7IG5hbWU6IFwiY29kZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBzZWNvbmRhcnlrZXk6IHsgbmFtZTogXCJ1c2VybmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBmaWVsZHM6IFtcclxuICAgICAgeyBuYW1lOiBcImdlbmVyYXRlZFwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxyXG4gICAgICB7IG5hbWU6IFwib3JnYW5pc2F0aW9uXCIsIHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktZHluYW1vZGItTUZBXCIsXHJcbiAgICB0eXBlOiBcImR5bmFtb2RiXCIsXHJcbiAgICBmaWxlbmFtZTogXCJkeW5hbW9kYlwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXSxcclxuICAgIHRhYmxlbmFtZTogXCJtZmFcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJtZmFcIixcclxuICAgIHByaW1hcnlrZXk6IHsgbmFtZTogXCJ1c2VybmFtZVwiLCB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICBzZWNvbmRhcnlrZXk6IHsgbmFtZTogXCJ2ZXJpZmljYXRpb25cIiwgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgZmllbGRzOiBbXSxcclxuICB9LFxyXG5dO1xyXG4iXX0=
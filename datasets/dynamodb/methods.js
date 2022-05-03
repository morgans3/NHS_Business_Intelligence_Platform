// @ts-check
const fs = require("fs");
const async = require("async");

module.exports.getAllDynamoDBTables = function (AWS, callback) {
    const dynamodb = new AWS.DynamoDB();
    dynamodb.listTables({}, callback);
};

module.exports.deleteDynamoDBTable = function (AWS, TableName, callback) {
    const dynamodb = new AWS.DynamoDB();
    dynamodb.deleteTable({ TableName }, callback);
};

module.exports.saveDynamoDBTableDescription = function (AWS, tablename, callback) {
    const dynamodb = new AWS.DynamoDB();
    dynamodb.describeTable({ TableName: tablename }, (err, result) => {
        if (err) {
            callback(err, null);
        } else if (result && result.Table) {
            const strObj = JSON.stringify(result.Table);
            const filePath = `./dynamodb/backup_schemas/${tablename}.json`;
            fs.writeFile(filePath, strObj, "utf8", callback);
        } else {
            callback(null, null);
        }
    });
};

const readFiles = (dirname, callback) => {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, filenames);
        }
    });
};

const readFile = (filePath, callback) => {
    fs.readFile(filePath, "utf-8", (errFiles, content) => {
        if (errFiles) {
            callback(errFiles, null);
        }
        callback(null, content);
    });
};

module.exports.getAllDynamoDBTableDescriptionsAndCreateTables = (AWS, callback) => {
    const dynamodb = new AWS.DynamoDB();
    const schemaArr = [];
    readFiles("./dynamodb/backup_schemas", (err, filenames) => {
        if (err) {
            callback(err, null);
        } else {
            async.mapSeries(
                filenames,
                (filename, innerCallback) => {
                    readFile(`./dynamodb/backup_schemas/${filename}`, (errFiles, content) => {
                        if (errFiles) {
                            innerCallback(errFiles, null);
                        } else {
                            schemaArr.push(JSON.parse(content));
                            dynamodb.createTable(JSON.parse(content), (innerErr, innerRes) => {
                                if (innerErr) {
                                    innerCallback(innerErr, null);
                                } else {
                                    innerCallback(null, innerRes);
                                }
                            });
                        }
                    });
                },
                (outerErr, outerResults) => {
                    callback(outerErr, schemaArr);
                }
            );
        }
    });
};

module.exports.restoreDataInDatabaseForTableFromSchema = (AWS, schema, callback) => {
    const dynamodb = new AWS.DynamoDB().DocumentClient();
    updateDynamoDBRecords(schema, dynamodb, callback);
};

module.exports.selectAllFromDynamoDBTable = function (AWS, tableName, callback) {
    getAll(AWS, tableName, callback, null, null);
};

function getAll(AWS, tablename, callback, nextMarker, previousResult) {
    const dynamodb = new AWS.DynamoDB();
    const params = {
        TableName: tablename,
    };
    if (nextMarker) {
        params.ExclusiveStartKey = nextMarker;
    }
    dynamodb.scan(params, (err, result) => {
        if (err) {
            callback(err, null);
        } else if (result && result.Items && result.Items.length) {
            if (result.LastEvaluatedKey) {
                if (!previousResult) previousResult = [];
                previousResult.push(...result.Items);
                getAll(AWS, tablename, callback, result.LastEvaluatedKey, previousResult);
            } else {
                if (previousResult) {
                    previousResult.push(...result.Items);
                    callback(null, previousResult);
                } else {
                    callback(null, result.Items);
                }
            }
        } else {
            callback(null, null);
        }
    });
}

module.exports.writeDynamoDBTableDataToFile = (tableName, selectResult, callback) => {
    const strObj = JSON.stringify(selectResult);
    const filePath = `./dynamodb/backup_data/${tableName}.json`;
    fs.writeFile(filePath, strObj, "utf8", callback);
};

function updateDynamoDBRecords(schema, dynamodb, callback) {
    const filePath = `./dynamodb/backup_data/${schema.TableName}.json`;
    const keySchema = getKeySchema(schema);
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            callback(err, null);
        } else {
            const jsonArray = JSON.parse(data);
            async.mapSeries(
                jsonArray,
                (row, innerCallback) => {
                    const params = prepareParams(row, keySchema, schema.TableName);
                    updateRecord(params, dynamodb, innerCallback);
                },
                (errOuter, results) => {
                    if (errOuter) {
                        callback(errOuter, null);
                    } else callback(null, results);
                }
            );
        }
    });
}

function prepareParams(row, keySchema, tableName) {
    Object.keys(keySchema).forEach((key) => {
        keySchema[key] = row[key];
    });
    const params = {
        TableName: tableName,
        Key: keySchema,
        UpdateExpression: updateExpression(row, keySchema),
        ExpressionAttributeValues: expressionAttributeValues(row, keySchema),
        ExpressionAttributeNames: expressionAttributeNames(row, keySchema),
        ReturnValues: "UPDATED_NEW",
    };
    return params;
}

function updateExpression(row, keySchema) {
    let query = "SET";
    const data = Object.keys(row);
    data.forEach((val) => {
        if (keySchema[val] === undefined) {
            query += " #" + val + " = :" + val + ",";
        }
    });
    query = query.slice(0, -1);
    return query;
}

function expressionAttributeValues(row, keySchema) {
    const exp = {};
    const data = Object.keys(row);
    data.forEach((val) => {
        if (keySchema[val] === undefined) {
            exp[":" + val] = getValueFromObject(row[val]);
        }
    });
    return exp;
}

function expressionAttributeNames(row, keySchema) {
    const exp = {};
    const data = Object.keys(row);
    data.forEach((val) => {
        if (keySchema[val] === undefined) {
            exp["#" + val] = val;
        }
    });
    return exp;
}

function getValueFromObject(data) {
    if (data === undefined) {
        data = null;
    }
    return data;
}

function updateRecord(params, docClient, callback) {
    docClient.update(params, callback);
}

function getKeySchema(schema) {
    const keySchema = {};
    if (schema.KeySchema && schema.KeySchema.length) {
        schema.KeySchema.forEach((key) => {
            keySchema[key.AttributeName] = "";
        });
    }
    return keySchema;
}

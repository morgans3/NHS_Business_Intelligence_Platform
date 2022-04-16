import { DynamoDB } from "aws-sdk";
const docClient = new DynamoDB.DocumentClient();

module.exports.decision = (event: any, context: any, callback: any) => {
  const path = event.path;
  const settings = _Settings || [];
  const apiSettings = settings.find((x) => x.baseendpoint === path.split("/")[1]);
  const func = apiSettings!.functions.find((x) => x === path.split("/")[2].replace("getBy", "getBy-"));
  switch (selectFunction(func!, apiSettings!)) {
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
function getAll(event: any, context: any, callback: any) {
  const path = event.path;
  const settings = _Settings;
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
    getAllFromDB(apiSettings.tablename, (error: any, result: any) => {
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
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--DYNAMODB--FAILED: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
}

function getAllFromDB(tablename: string, callback: any) {
  var params = {
    TableName: tablename,
  };
  docClient.scan(params, callback);
}

module.exports.getByID = getByID;
function getByID(event: any, context: any, callback: any) {
  const path = event.path;
  const settings = _Settings;
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
    getItemByKey(tablename, primarykey, event.queryStringParameters[primarykey], (error: any, result: any) => {
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
  } catch (tryerror) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: " + tryerror);
    callback(null, {
      statusCode: 501,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Problem with lambda. " + tryerror,
    });
  }
}

function getItemByKey(tablename: string, keyname: any, keyvalue: any, callback: any) {
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
function getByIndex(event: any, context: any, callback: any) {
  const path = event.path;
  const settings = _Settings;
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
    getItemByIndex(tablename, primaryindex, event.queryStringParameters[primaryindex], (error: any, result: any) => {
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
  } catch (tryerror) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: " + tryerror);
    callback(null, {
      statusCode: 501,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Problem with lambda. " + tryerror,
    });
  }
}

function getItemByIndex(tablename: string, keyname: any, keyvalue: any, callback: any) {
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

function getItemByDualIndex(tablename: string, keynames: any, keyvalues: any, callback: any) {
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

module.exports.getAllByFilter = (event: any, context: any, callback: any) => {
  const path = event.path;
  const settings = _Settings;
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
    getAllByFilter(apiSettings.tablename, indexinfo, (error: any, result: any) => {
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
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--DYNAMODB--FAILED: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
};

function getAllByFilter(tablename: string, filter: any, callback: any) {
  var params = {
    TableName: tablename,
    FilterExpression: filter,
  };
  docClient.scan(params, callback);
}

function getAllByFilterValue(tablename: string, filter: any, filtername: any, filtervalue: any, callback: any) {
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

function getAllByFilterValues(tablename: string, filter: any, filternames: any, filtervalues: any, callback: any) {
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
function getActive(event: any, context: any, callback: any) {
  const path = event.path;
  const settings = _Settings;
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
    getActiveItems(apiSettings.tablename, indexinfo, (error: any, result: any) => {
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
  } catch (error) {
    var body = JSON.stringify(error, null, 2);
    console.error("API--LAMBDA--DYNAMODB--FAILED: " + JSON.stringify(body));
    callback(null, {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    });
  }
}

function getActiveItems(tablename: string, filter: any, callback: any) {
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
function register(event: any, context: any, callback: any) {
  const path = event.path;
  const settings = _Settings;
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
  const secondarykey = apiSettings.secondarykey?.name || "";
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
    addItem(tablename, newItem, (error: any, result: any) => {
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
  } catch (tryerror) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Register function error: " + tryerror);
    callback(null, {
      statusCode: 501,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Problem with lambda. " + tryerror,
    });
  }
}

function convertToAWSItem(payload: any, primarykey: string, secondarykey: string, fields: any) {
  const fieldsobj = JSON.parse(fields);
  let Item: any = {};
  const primPropType = propType(primarykey, payload, fieldsobj);
  Item[primarykey] = primPropType;
  if (secondarykey !== "" && payload[secondarykey]) {
    const secPropType = propType(secondarykey, payload, fieldsobj);
    Item[secondarykey] = secPropType;
  }
  fieldsobj.forEach((field: any) => {
    if (payload[field.name]) {
      const selPropType = propType(field.name, payload, fieldsobj);
      Item[field.name] = selPropType;
    }
  });
  return Item;
}

function propType(field: any, value: any, fieldsobj: any) {
  const fieldFull = fieldsobj.filter((x: any) => x.name === field);
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

function checkPayload(newpayload: any, primarykey: string, secondarykey: string, fields: any) {
  const fieldsobj = JSON.parse(fields);
  const payload = JSON.parse(newpayload);
  const keys = Object.keys(payload);
  if (!payload[primarykey]) return false;
  if (secondarykey !== "" && !payload[secondarykey]) return false;
  let flag = true;
  fieldsobj.forEach((field: any) => {
    if (field.required && !keys.includes(field.name)) flag = false;
  });
  return flag;
}

function addItem(tablename: string, newItem: any, callback: any) {
  var client = new DynamoDB();
  var params = {
    TableName: tablename,
    Item: newItem,
  };
  client.putItem(params, callback);
}

module.exports.delete = deleteItem;
function deleteItem(event: any, context: any, callback: any) {
  const path = event.path;
  const settings = _Settings;
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
  const secondarykey = apiSettings.secondarykey?.name || "";
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

    let key: any = {};
    key[primarykey] = payload[primarykey];
    if (secondarykey !== "") key[secondarykey] = payload[secondarykey];

    removeItem(tablename, key, (error: any, result: any) => {
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
  } catch (tryerror) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Delete function error: " + tryerror);
    callback(null, {
      statusCode: 501,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Problem with lambda. " + tryerror,
    });
  }
}

function removeItem(tablename: string, key: any, callback: any) {
  var getparams = {
    TableName: tablename,
    Key: key,
  };
  docClient.delete(getparams, (err: any, result: any) => {
    if (err) callback(err, { status: 400, msg: err });
    else callback(null, { status: 200, msg: result });
  });
}

module.exports.update = update;
function update(event: any, context: any, callback: any) {
  const path = event.path;
  const settings = _Settings;
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
  const secondarykey = apiSettings.secondarykey?.name || "";
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
    if (secondarykey !== "") key.push(secondarykey);

    updateItem(tablename, key, payload, (error: any, result: any) => {
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
  } catch (tryerror) {
    console.error("API--LAMBDA--DYNAMODB--FAILED: Delete function error: " + tryerror);
    callback(null, {
      statusCode: 501,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      body: "Problem with lambda. " + tryerror,
    });
  }
}

function updateItem(tablename: string, filters: string[], updatedItem: any, callback: any) {
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

function setkeys(fields: any, item: any) {
  let exp: any = {};
  fields.forEach((val: any) => {
    exp[val] = item[val];
  });
  return exp;
}

function updatefields(fields: any) {
  let output = "";
  fields.forEach((val: any) => {
    output += "#" + val + "=:" + val + ",";
  });
  return output.substring(0, output.length - 1);
}

function updateexpression(fields: any, updateItem: any) {
  let exp: any = {};
  fields.forEach((val: any) => {
    exp[":" + val] = updateItem[val];
  });
  return exp;
}

function newexpression(fields: any, updateItem: any) {
  let exp: any = {};
  fields.forEach((val: any) => {
    exp[":" + val] = updateItem;
  });
  return exp;
}

function newexpressions(fields: any, items: any) {
  let exp: any = {};
  for (let index = 0; index < fields.length; index++) {
    exp[":" + fields[index]] = items[index];
  }
  return exp;
}

function updateexpressionnames(fields: any) {
  let exp: any = {};
  fields.forEach((val: any) => {
    exp["#" + val] = val;
  });
  return exp;
}

function findIndexInfo(func: string, api: LambdaInfo) {
  if (func.includes("getBy-")) {
    const value = func.split("-")[1];
    if (value) return func.split("-")[1];
    return "";
  }
  if (func.includes("getAllByFilter-")) {
    const value = func.split("-")[1];
    if (value) return api.customfilters[value];
    return "";
  }
  if (func.includes("getActive")) return api.customfilters["getActive"];
  return "";
}

function selectFunction(func: string, api: LambdaInfo) {
  if (func.includes("getBy-")) {
    const value = func.split("-")[1];
    if (value === api.primarykey?.name) return "getByID";
    return "getByIndex";
  }
  if (func.includes("getAllByFilter-")) {
    const value = func.split("-")[1];
    return "getAllByFilter";
  }
  return func;
}

export interface LambdaInfo {
  name: string;
  type: string;
  filename: string;
  functions: string[];
  primarykey: fields;
  secondarykey?: fields;
  customfilters?: any;
  fields: fields[];
  tablename: string;
  baseendpoint: string;
  customAuth?: string;
}

interface fields {
  name: string;
  type: string;
  required?: boolean;
}

export const _Settings: LambdaInfo[] = [
  // {
  //   name: "cdk-api-dynamodb-AccessLogs",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: ["getAll", "getBy-date", "register"],
  //   tablename: "nhsbi_access_logs",
  //   baseendpoint: "accesslogs",
  //   primarykey: { name: "date", type: "string" },
  //   secondarykey: { name: "time#org#username", type: "string" },
  //   fields: [
  //     { name: "data", type: "string" },
  //     { name: "time", type: "string", required: true },
  //     { name: "type", type: "string", required: true },
  //     { name: "username#org", type: "string", required: true },
  //   ],
  // },
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
  // {
  //   name: "cdk-api-dynamodb-FormSubmissions",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: ["getAll", "getBy-id", "register", "delete", "update"],
  //   tablename: "nhsbi_form_submissions",
  //   baseendpoint: "formsubmissions",
  //   primarykey: { name: "id", type: "string" },
  //   fields: [
  //     { name: "created_at", type: "string", required: true },
  //     { name: "data", type: "string", required: true },
  //     { name: "parentid", type: "string" },
  //     { name: "type", type: "string", required: true },
  //   ],
  // },
  // {
  //   name: "cdk-api-dynamodb-Newsfeeds",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: ["getAll", "getBy-id", "getBy-destination", "register", "delete", "update"],
  //   tablename: "nhsbi_newsfeeds",
  //   baseendpoint: "newsfeeds",
  //   primarykey: { name: "destination", type: "string" },
  //   secondarykey: { name: "type", type: "string" },
  //   fields: [
  //     { name: "priority", type: "number", required: true },
  //     { name: "isArchived", type: "boolean", required: true },
  //   ],
  // },
  // {
  //   name: "cdk-api-dynamodb-Organisations",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: ["update", "register", "delete", "getBy-code"],
  //   tablename: "nhsbi_organisations",
  //   baseendpoint: "organisations",
  //   primarykey: { name: "name", type: "string" },
  //   secondarykey: { name: "code", type: "string" },
  //   fields: [
  //     { name: "authmethod", type: "string", required: true },
  //     { name: "contact", type: "string", required: true },
  //   ],
  // },
  // {
  //   name: "cdk-api-dynamodb-Organisations-Public",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: ["getAll", "getBy-name"],
  //   tablename: "nhsbi_organisations",
  //   baseendpoint: "organisation",
  //   primarykey: { name: "name", type: "string" },
  //   secondarykey: { name: "code", type: "string" },
  //   fields: [
  //     { name: "authmethod", type: "string", required: true },
  //     { name: "contact", type: "string", required: true },
  //   ],
  //   customAuth: "public",
  // },
  // {
  //   name: "cdk-api-dynamodb-SystemAlerts",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: ["update", "register", "delete", "getAll", "getBy-id", "getActive"],
  //   customfilters: {
  //     getActive: ":DateTime BETWEEN startdate AND enddate",
  //   },
  //   tablename: "nhsbi_systemalerts",
  //   baseendpoint: "systemalerts",
  //   primarykey: { name: "id", type: "string" },
  //   secondarykey: { name: "author", type: "string" },
  //   fields: [
  //     { name: "name", type: "string", required: true },
  //     { name: "message", type: "string", required: true },
  //     { name: "startdate", type: "string", required: true },
  //     { name: "enddate", type: "string", required: true },
  //     { name: "status", type: "string", required: true },
  //     { name: "icon", type: "string", required: true },
  //   ],
  // },
  // {
  //   name: "cdk-api-dynamodb-SystemAlerts-Public",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: ["getAll"],
  //   tablename: "nhsbi_systemalerts",
  //   baseendpoint: "systemalert",
  //   primarykey: { name: "id", type: "string" },
  //   fields: [
  //     { name: "name", type: "boolean", required: true },
  //     { name: "message", type: "string", required: true },
  //     { name: "startdate", type: "string", required: true },
  //     { name: "enddate", type: "string", required: true },
  //     { name: "status", type: "string", required: true },
  //     { name: "icon", type: "string", required: true },
  //     { name: "author", type: "string", required: true },
  //   ],
  //   customAuth: "public",
  // },
  // {
  //   name: "cdk-api-dynamodb-Teams",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: ["update", "register", "delete", "getAll", "getBy-id", "getBy-code", "getBy-organisationcode"],
  //   tablename: "nhsbi_teams",
  //   baseendpoint: "teams",
  //   primarykey: { name: "id", type: "string" },
  //   secondarykey: { name: "code", type: "string" },
  //   fields: [
  //     { name: "descrition", type: "string", required: true },
  //     { name: "name", type: "string", required: true },
  //     { name: "organisationcode", type: "string" },
  //     { name: "responsiblepeople", type: "string_array" },
  //   ],
  // },
  // {
  //   name: "cdk-api-dynamodb-TeamMembers",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: ["update", "register", "delete", "getAll", "getBy-id", "getBy-teamcode", "getBy-username"],
  //   tablename: "nhsbi_teammembers",
  //   baseendpoint: "teammembers",
  //   primarykey: { name: "id", type: "string" },
  //   secondarykey: { name: "teamcode", type: "string" },
  //   fields: [
  //     { name: "username", type: "string", required: true },
  //     { name: "joindate", type: "string", required: true },
  //     { name: "rolecode", type: "string" },
  //     { name: "enddate", type: "string" },
  //   ],
  // },
  // {
  //   name: "cdk-api-dynamodb-TeamRequests",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: ["update", "register", "delete", "getAll", "getBy-id", "getBy-teamcode", "getBy-username"],
  //   tablename: "nhsbi_teamrequests",
  //   baseendpoint: "teamrequests",
  //   primarykey: { name: "id", type: "string" },
  //   secondarykey: { name: "teamcode", type: "string" },
  //   fields: [
  //     { name: "username", type: "string", required: true },
  //     { name: "requestor", type: "string", required: true },
  //     { name: "requestdate", type: "string", required: true },
  //     { name: "approveddate", type: "string" },
  //     { name: "refuseddate", type: "string" },
  //     { name: "requestapprover", type: "string" },
  //   ],
  // },
  // {
  //   name: "cdk-api-dynamodb-Users",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: [],
  //   tablename: "nhsbi_users",
  //   baseendpoint: "users",
  //   primarykey: { name: "username", type: "string" },
  //   secondarykey: { name: "organisation", type: "string" },
  //   fields: [
  //     { name: "email", type: "string", required: true },
  //     { name: "linemanager", type: "string", required: true },
  //     { name: "name", type: "string", required: true },
  //     { name: "password", type: "string", required: true },
  //     { name: "password_expires", type: "string", required: true },
  //   ],
  // },
  // {
  //   name: "cdk-api-dynamodb-VerificationCodes",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: [],
  //   tablename: "nhsbi_verificationcodes",
  //   baseendpoint: "verificationcodes",
  //   primarykey: { name: "code", type: "string" },
  //   secondarykey: { name: "username", type: "string" },
  //   fields: [
  //     { name: "generated", type: "string", required: true },
  //     { name: "organisation", type: "string" },
  //   ],
  // },
  // {
  //   name: "cdk-api-dynamodb-MFA",
  //   type: "dynamodb",
  //   filename: "dynamodb",
  //   functions: [],
  //   tablename: "nhsbi_mfa",
  //   baseendpoint: "mfa",
  //   primarykey: { name: "username", type: "string" },
  //   secondarykey: { name: "verification", type: "string" },
  //   fields: [],
  // },
];

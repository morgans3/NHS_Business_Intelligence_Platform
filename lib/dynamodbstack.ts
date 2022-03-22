import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import { AuthorizationType, Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { _RequiredTables } from "../datasets/dynamodb/tables";
import { DynamodbLambdaProps, DynamoDBStackProps, DynamoDBTableStackProps } from "./types/interfaces";
import { _SETTINGS } from "./_config";

export class DynamoDBStack extends Stack {
  constructor(scope: any, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    const accessLambda = new DynamoDBLambda(this, "DynamoDBLambdaStack", { lambdarole: props.lambdarole });
    const authLambda = props.authLambda;
    const publicAuthLambda = props.publicLambda;
    const api: RestApi = props.apigateway;

    _RequiredTables.forEach((table) => {
      if (!table.customAuth) {
        new DynamoDBTable(this, table.tablename + "-TableStack", {
          tablename: table.tablename,
          primarykey: table.primarykey!,
          secondarykey: table.secondarykey,
        });
      }
      // TODO: add all global-secondary index

      const baseendpoint = api.root.addResource(table.baseendpoint);
      let authorizer = authLambda;
      let splitLambdaNamesByAuthSoThatTheyRemainUnique = "";
      if (table.customAuth) {
        splitLambdaNamesByAuthSoThatTheyRemainUnique = "-" + table.customAuth;
        authorizer = publicAuthLambda;
      }
      if (props.addCors) {
        baseendpoint.addCorsPreflight({
          allowOrigins: Cors.ALL_ORIGINS,
          allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent", "access-control-allow-origin", "Cache-Control", "Pragma"],
        });
      }

      table.functions.forEach((func: any) => {
        const thislambda = new LambdaIntegration(accessLambda.lambda, {
          requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        });
        const methodtype = selectMethodType(func);
        const thisendpoint = baseendpoint.addResource(func.split("-").join(""));
        thisendpoint.addMethod(methodtype, thislambda, { authorizationType: AuthorizationType.CUSTOM, authorizer: authorizer });
        if (props.addCors) {
          thisendpoint.addCorsPreflight({
            allowOrigins: Cors.ALL_ORIGINS,
            allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent", "access-control-allow-origin", "Cache-Control", "Pragma"],
          });
        }
      });
    });
  }
}

export class DynamoDBLambda extends Stack {
  public readonly lambda: Function;
  constructor(scope: any, id: string, props: DynamodbLambdaProps) {
    super(scope, id, props);
    this.lambda = new Function(this, "DynamodbLambda-Handler", {
      functionName: "DynamodbLambda",
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./src/dynamodb", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "dynamodb.decision",
      environment: {},
      role: props.lambdarole,
      timeout: Duration.seconds(30),
    });
  }
}

export class DynamoDBTable extends Stack {
  public readonly dynamoTable: Table;
  constructor(scope: any, id: string, props: DynamoDBTableStackProps) {
    super(scope, id, props);
    const primarykey = props.primarykey;
    const secondarykey = props.secondarykey;
    const partitionKey = { name: primarykey.name, type: convertToAttribueType(primarykey.type) };
    let sortKey = undefined;
    if (secondarykey) sortKey = { name: secondarykey.name, type: convertToAttribueType(secondarykey.type) };
    let TableProps = { partitionKey: partitionKey, tableName: props.tablename, sortKey: sortKey, removalPolicy: RemovalPolicy.DESTROY, billingMode: BillingMode.PAY_PER_REQUEST };
    this.dynamoTable = new Table(this, props.tablename + "-Table", TableProps);
  }
}

function convertToAttribueType(input: string) {
  switch (input) {
    case "string":
    default:
      return AttributeType.STRING;
  }
}

function selectMethodType(func: string) {
  if (func.includes("get")) {
    return "GET";
  }
  return "POST";
}

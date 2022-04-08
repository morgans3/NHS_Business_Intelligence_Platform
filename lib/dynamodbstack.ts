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

    const accessLambda = this.createLambda({ lambdarole: props.lambdarole }, id);
    const authLambda = props.authLambda;
    const publicAuthLambda = props.publicLambda;
    const api: RestApi = props.apigateway;

    _RequiredTables.forEach((table) => {
      if (!table.customAuth) {
        this.createTable({
          tablename: table.tablename,
          primarykey: table.primarykey!,
          secondarykey: table.secondarykey,
        });
      }
      // TODO: add all global-secondary index

      const baseendpoint = api.root.addResource(table.baseendpoint);
      let authorizer = authLambda;
      if (table.customAuth) {
        authorizer = publicAuthLambda;
      }
      if (props.addCors) {
        baseendpoint.addCorsPreflight({
          allowOrigins: Cors.ALL_ORIGINS,
          allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent", "access-control-allow-origin", "Cache-Control", "Pragma"],
        });
      }

      table.functions.forEach((func: any) => {
        const thislambda = new LambdaIntegration(accessLambda, {
          requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        });
        const methodtype = selectMethodType(func);
        const thisendpoint = baseendpoint.addResource(func.split("-").join(""));
        thisendpoint.addMethod(methodtype, thislambda, { authorizationType: AuthorizationType.CUSTOM, authorizer: authorizer });
      });
    });
  }

  createLambda(props: DynamodbLambdaProps, id: string) {
    return new Function(this, "DynamodbLambda-Handler-" + id, {
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

  createTable(props: DynamoDBTableStackProps) {
    const primarykey = props.primarykey;
    const secondarykey = props.secondarykey;
    const partitionKey = { name: primarykey.name, type: convertToAttribueType(primarykey.type) };
    let sortKey = undefined;
    if (secondarykey) sortKey = { name: secondarykey.name, type: convertToAttribueType(secondarykey.type) };
    let TableProps = { partitionKey: partitionKey, tableName: props.tablename, sortKey: sortKey, removalPolicy: RemovalPolicy.DESTROY, billingMode: BillingMode.PAY_PER_REQUEST };
    return new Table(this, props.tablename + "-Table", TableProps);
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

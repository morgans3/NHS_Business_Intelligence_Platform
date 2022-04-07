import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { AuthorizationType, Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion, SubnetGroup } from "aws-cdk-lib/aws-rds";
import { pgFunction, PostgreSQLLambdaProps, RDSStackProps } from "./types/interfaces";
import { _SETTINGS } from "./_config";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { _RequiredSQLTables } from "../datasets/postgresql/tables";

export class SQLStack extends Stack {
  public dbInstance: DatabaseInstance;

  constructor(scope: any, id: string, props: RDSStackProps) {
    super(scope, id, props);

    const vpc = props.infrastructure.vpc;
    const secGroup = props.infrastructure.secGroups;
    const subnetgroup = new SubnetGroup(this, "RDSSubnetGroup", {
      description: "Subnet Group for RDS Instance, managed by CDK_RDS",
      vpc,
      subnetGroupName: "RDS-Instance-LL-SUBG",
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
    });

    this.dbInstance = new DatabaseInstance(this, "RDSInstance", {
      vpc: vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      instanceType: _SETTINGS.rds_config.instanceType,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      deleteAutomatedBackups: true,
      publiclyAccessible: false,
      securityGroups: secGroup,
      multiAz: true,
      subnetGroup: subnetgroup,
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_13_3,
      }),
      backupRetention: Duration.days(2),
      storageEncrypted: true,
      port: 5432,
      credentials: Credentials.fromGeneratedSecret("postgres"),
      deletionProtection: _SETTINGS.rds_config.deletionProtection,
      databaseName: "gis",
      maxAllocatedStorage: 100,
      allocatedStorage: 20,
    });

    new CfnOutput(this, "dbEndpoint", { value: this.dbInstance.dbInstanceEndpointAddress });

    const accessLambda = new PostgreSQLLambda(this, "PostgreSQLLambda", { lambdarole: props.lambdarole });
    const authLambda = props.authLambda;
    const publicAuthLambda = props.publicLambda;
    const api: RestApi = props.apigateway;

    _RequiredSQLTables.forEach((table) => {
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

      table.functions.forEach((func: pgFunction) => {
        const thislambda = new LambdaIntegration(accessLambda.lambda, {
          requestTemplates: { "application/json": '{ "statusCode": "200" }' },
        });
        const methodtype = selectMethodType(func.handlermethod);
        const thisendpoint = baseendpoint.addResource(func.method.split("-").join(""));
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

export class PostgreSQLLambda extends Stack {
  public readonly lambda: Function;
  constructor(scope: any, id: string, props: PostgreSQLLambdaProps) {
    super(scope, id, props);
    this.lambda = new Function(this, "PostgreSQLLambda-Handler", {
      functionName: "PostgreSQLLambda",
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./src/postgresql", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "postgresql.decision",
      environment: {},
      role: props.lambdarole,
      timeout: Duration.seconds(30),
    });
  }
}

function selectMethodType(func: string) {
  if (func.includes("get")) {
    return "GET";
  }
  return "POST";
}

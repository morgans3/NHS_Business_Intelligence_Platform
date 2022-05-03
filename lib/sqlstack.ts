import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SubnetType,
} from "aws-cdk-lib/aws-ec2";
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
  SubnetGroup,
} from "aws-cdk-lib/aws-rds";
import { PostgreSQLLambdaProps, RDSStackProps } from "./types/interfaces";
import { _SETTINGS } from "./_config";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { RDSCloudwatchDashboardStack } from "./dashboards/rds-dashboard";

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
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_NAT },
    });

    if (_SETTINGS.existingRDS === false && _SETTINGS.newRDSConfig) {
      this.dbInstance = new DatabaseInstance(this, "RDSInstance", {
        vpc: vpc,
        vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_NAT },
        instanceType: this.setInstanceType(_SETTINGS.newRDSConfig.instanceType),
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
        deletionProtection: _SETTINGS.newRDSConfig.deletionProtection,
        databaseName: "gis",
        maxAllocatedStorage: 100,
        allocatedStorage: 20,
      });
      new CfnOutput(this, "dbEndpoint", {
        value: this.dbInstance.dbInstanceEndpointAddress,
      });
      new StringParameter(this, "RDSEndpointSSMParam", {
        parameterName: "RDS_DB_ENDPOINT",
        description: "The RDS endpoint for the PostgreSQL database",
        stringValue: this.dbInstance.dbInstanceEndpointAddress,
      });

      new RDSCloudwatchDashboardStack(this, "RDSCloudwatchDashboardStack", {
        dashboardName: "RDS-Dashboard",
        databases: [
          {
            DBInstanceIdentifier: this.dbInstance.instanceIdentifier,
            Engine: "postgres",
          },
        ],
      });
    } else if (_SETTINGS.existingRDS && _SETTINGS.existingRDSEndpoint) {
      new StringParameter(this, "RDSEndpointSSMParam", {
        parameterName: "RDS_DB_ENDPOINT",
        description: "The RDS endpoint for the PostgreSQL database",
        stringValue: _SETTINGS.existingRDSEndpoint,
      });
    }

    // const accessLambda = this.createLambda({ lambdarole: props.lambdarole });
    // const authLambda = props.authLambda;
    // const publicAuthLambda = props.publicLambda;
    // const api: RestApi = props.apigateway;

    // _RequiredSQLTables.forEach((table) => {
    //   const baseendpoint = api.root.addResource(table.baseendpoint);
    //   let authorizer = authLambda;
    //   let splitLambdaNamesByAuthSoThatTheyRemainUnique = "";
    //   if (table.customAuth) {
    //     splitLambdaNamesByAuthSoThatTheyRemainUnique = "-" + table.customAuth;
    //     authorizer = publicAuthLambda;
    //   }
    //   if (props.addCors) {
    //     baseendpoint.addCorsPreflight({
    //       allowOrigins: Cors.ALL_ORIGINS,
    //       allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent", "access-control-allow-origin", "Cache-Control", "Pragma"],
    //     });
    //   }

    //   table.functions.forEach((func: pgFunction) => {
    //     const thislambda = new LambdaIntegration(accessLambda, {
    //       requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    //     });
    //     const methodtype = selectMethodType(func.handlermethod);
    //     const thisendpoint = baseendpoint.addResource(func.method.split("-").join(""));
    //     thisendpoint.addMethod(methodtype, thislambda, { authorizationType: AuthorizationType.CUSTOM, authorizer: authorizer });
    //     if (props.addCors) {
    //       thisendpoint.addCorsPreflight({
    //         allowOrigins: Cors.ALL_ORIGINS,
    //         allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent", "access-control-allow-origin", "Cache-Control", "Pragma"],
    //       });
    //     }
    //   });
    // });
  }

  createLambda(props: PostgreSQLLambdaProps) {
    return new Function(this, "PostgreSQLLambda-Handler", {
      functionName: "PostgreSQLLambda",
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./src/postgresql", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "postgresql.decision",
      environment: {},
      role: props.lambdarole,
      timeout: Duration.seconds(30),
      logRetentionRole: props.lambdarole,
      logRetention: RetentionDays.TWO_MONTHS,
    });
  }

  setInstanceType(instanceType: string) {
    const iClass = instanceType.split(".")[0] as InstanceClass;
    const iSize = instanceType.split(".")[1] as InstanceSize;
    return InstanceType.of(iClass, iSize);
  }
}

function selectMethodType(func: string) {
  if (func.includes("get")) {
    return "GET";
  }
  return "POST";
}

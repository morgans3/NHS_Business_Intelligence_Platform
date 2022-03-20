import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion, SubnetGroup } from "aws-cdk-lib/aws-rds";
import { RDSStackProps } from "./types/interfaces";
import { WAFStack } from "./wafstack";
import { _SETTINGS } from "./_config";

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

    // Create Lambda to manage Access Patterns

    // Create API Gateway with all endpoints and CORS (add WAFStack)

    const waf = new WAFStack(this, "WAFStack", { env: props.env });

    if (_SETTINGS.manageDNS) {
      // Add Route 53 DNS records
    }
  }
}

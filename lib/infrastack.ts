import { Stack } from "aws-cdk-lib";
import { Peer, Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { _SETTINGS } from "./_config";

export class InfrastructureStack extends Stack {
  public vpc: Vpc;
  public secGroups: SecurityGroup[];

  constructor(scope: any, id: string, props?: any) {
    super(scope, id, props);

    // TODO: Make Optional (i.e. New or Existing - set in Config)

    this.vpc = new Vpc(this, "BIPlatformVPC", {
      cidr: _SETTINGS.containerIPs[0],
      subnetConfiguration: [
        { name: "BIPlatformVPC-private-0", subnetType: SubnetType.PRIVATE_ISOLATED },
        { name: "BIPlatformVPC-private-1", subnetType: SubnetType.PRIVATE_ISOLATED },
        { name: "BIPlatformVPC-public-0", subnetType: SubnetType.PUBLIC },
        { name: "BIPlatformVPC-public-1", subnetType: SubnetType.PUBLIC },
      ],
      maxAzs: 2,
    });

    const vpcSG = new SecurityGroup(this, "VPCSecGroup", {
      securityGroupName: "SG-BIPlatformVPC",
      description: "Security Group for the BI Platform VPC",
      vpc: this.vpc,
    });
    this.secGroups = [vpcSG];

    _SETTINGS.containerIPs.forEach((range: string) => {
      vpcSG.addIngressRule(Peer.ipv4(range), Port.tcp(5432), "Access between containers and Database");
    });
  }
}

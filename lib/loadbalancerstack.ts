import { Duration, Stack, Tags } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { Subnet, SubnetSelection, SubnetType } from "aws-cdk-lib/aws-ec2";
import { ApplicationListener, ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, ListenerAction, SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Container } from "./container";
import { LoadBalancerStackProps } from "./types/interfaces";
import { _RequiredAppList, _SETTINGS } from "./_config";

export class LoadBalancerStack extends Stack {
  public readonly loadbalancer: ApplicationLoadBalancer;
  public readonly loadbalancer443: ApplicationListener;
  public readonly defaultTargetGroup: ApplicationTargetGroup;

  constructor(scope: Stack, id: string, props: LoadBalancerStackProps) {
    super(scope, id);

    const vpc = props.vpc;
    let settings: SubnetSelection = { subnetType: SubnetType.PUBLIC };
    if (_SETTINGS.existingSubnetIDs) {
      const lbsubnetAZ1 = Subnet.fromSubnetAttributes(this, "lbsubnet", { subnetId: _SETTINGS.existingSubnetIDs[0].ID, availabilityZone: _SETTINGS.existingSubnetIDs[0].AZ });
      const lbsubnetAZ2 = Subnet.fromSubnetAttributes(this, "lbsubnet2", { subnetId: _SETTINGS.existingSubnetIDs[1].ID, availabilityZone: _SETTINGS.existingSubnetIDs[1].AZ });
      settings = { subnets: [lbsubnetAZ1, lbsubnetAZ2] };
    }
    const publicsubnets = vpc.selectSubnets(settings);
    const secGroup = props.secGroup;

    this.loadbalancer = new ApplicationLoadBalancer(this, "BIPlatform-ALB" + props.name, {
      vpc: vpc,
      deletionProtection: true,
      internetFacing: true,
      loadBalancerName: "BIPlatform-alb-" + props.name,
      securityGroup: secGroup,
      vpcSubnets: publicsubnets,
      idleTimeout: Duration.seconds(900),
    });
    Tags.of(this.loadbalancer).add("Component", "Load Balancer");
    Tags.of(this.loadbalancer).add("Name", "BIPlatform-ALB" + props.name);

    const cert = new Certificate(this, "SSLCertificate-LB", {
      domainName: props.domainName,
    });

    const containerList = _RequiredAppList;
    const baseContainer = containerList[0];

    const defaultContainer = new Container(this, "Container", {
      branch: baseContainer.application.branch,
      secGroup: secGroup,
      cluster: props.cluster,
      name: props.name,
      port: baseContainer.port || 80,
      cpu: baseContainer.cpu || 256,
      memory: baseContainer.memory || 512,
      desired: baseContainer.desired || 1,
      minCapacity: baseContainer.minCapacity || 1,
      maxCapacity: baseContainer.maxCapacity || 1,
    });

    this.defaultTargetGroup = new ApplicationTargetGroup(this, "defaultTargetGroup", {
      targetGroupName: "api",
      vpc: vpc,
      protocol: ApplicationProtocol.HTTP,
      port: baseContainer.port || 80,
      targets: [defaultContainer.service],
    });
    Tags.of(this.defaultTargetGroup).add("Component", "Default Target Group");
    Tags.of(this.defaultTargetGroup).add("Name", "BIPlatform-ALB" + props.name + "- Default Target Group");
    this.loadbalancer443 = this.loadbalancer.addListener("443-Listener", {
      protocol: ApplicationProtocol.HTTPS,
      port: 443,
      certificates: [cert],
      sslPolicy: SslPolicy.RECOMMENDED,
      defaultAction: ListenerAction.forward([this.defaultTargetGroup]),
    });

    this.loadbalancer.addListener("80-Listener", {
      protocol: ApplicationProtocol.HTTP,
      port: 80,
      defaultAction: ListenerAction.redirect({
        permanent: true,
        protocol: ApplicationProtocol.HTTPS,
        port: "443",
      }),
    });

    // TODO: add remaining containers as targets

    // TODO: WAFSTACK
  }
}

import { CfnOutput, Stack, Tags } from "aws-cdk-lib";
import { Cluster, EcsOptimizedImage } from "aws-cdk-lib/aws-ecs";
import { _RequiredAppList, _SETTINGS } from "./_config";
import { ApiProps, ContainerStackProps } from "./types/interfaces";
import { InstanceType, ISubnet, Peer, Port, SecurityGroup, Subnet } from "aws-cdk-lib/aws-ec2";
import { Schedule } from "aws-cdk-lib/aws-autoscaling";
import { LoadBalancerStack } from "./loadbalancerstack";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";

export class ContainerStack extends Stack {
  public readonly cluster: Cluster;

  constructor(scope: any, id: string, props: ContainerStackProps) {
    super(scope, id, props);

    this.cluster = new Cluster(this, "ECS-DIU-" + props.name, {
      vpc: props.clusterVPC,
      clusterName: "ECS-DIU-" + props.name,
    });

    let subnetArray: ISubnet[] = [];
    props.range.forEach((subnet: { ID: string; AZ: string }) => {
      subnetArray.push(Subnet.fromSubnetAttributes(this, subnet.ID, { subnetId: subnet.ID, availabilityZone: subnet.AZ }));
    });
    const subnets = props.clusterVPC.selectSubnets({
      subnets: subnetArray,
    });
    const capacity = this.cluster.addCapacity("ASG-BIPlatform-" + props.name, {
      instanceType: new InstanceType("c5.2xlarge"),
      machineImage: EcsOptimizedImage.amazonLinux2(),
      associatePublicIpAddress: false,
      minCapacity: props.capacity.min,
      maxCapacity: props.capacity.max,
      desiredCapacity: props.capacity.desired,
      vpcSubnets: subnets,
      autoScalingGroupName: "ASG-DIU-" + props.name,
    });

    if (_SETTINGS.serversAlwaysOn === false) {
      const starthour = _SETTINGS.startHour || "8";
      const stophour = _SETTINGS.stopHour || "18";
      Tags.of(this.cluster).add("Automation.Schedule", "Operates in Working Hours only");
      Tags.of(this.cluster).add("Automation.Schedules.Shutdown", "Weekdays at " + stophour);
      Tags.of(this.cluster).add("Automation.Schedules.Startup", "Weekdays at " + starthour);

      capacity.scaleOnSchedule(props.name + "-PowerOn", {
        minCapacity: props.capacity.min,
        maxCapacity: props.capacity.max,
        desiredCapacity: props.capacity.desired,
        schedule: Schedule.cron({ hour: starthour, minute: "0" }),
      });
      capacity.scaleOnSchedule(props.name + "-PowerOff", {
        minCapacity: 0,
        maxCapacity: 0,
        desiredCapacity: 0,
        schedule: Schedule.cron({ hour: stophour, minute: "0" }),
      });
      capacity.scaleOnSchedule(props.name + "-PowerOff-Saturday", {
        minCapacity: 0,
        maxCapacity: 0,
        desiredCapacity: 0,
        schedule: Schedule.cron({ hour: starthour, minute: "15", weekDay: "Sat" }),
      });
      capacity.scaleOnSchedule(props.name + "-PowerOff-Sunday", {
        minCapacity: 0,
        maxCapacity: 0,
        desiredCapacity: 0,
        schedule: Schedule.cron({ hour: starthour, minute: "15", weekDay: "Sun" }),
      });
    }

    const secGroup = new SecurityGroup(this, "ECSCluster-SecGroup-" + props.name, {
      vpc: props.clusterVPC,
      securityGroupName: "SG-DIU-LB-" + props.name,
      description: "HTTP/S Access to ECS",
      allowAllOutbound: true,
    });
    secGroup.addIngressRule(Peer.anyIpv6(), Port.tcpRange(80, 8100), "Container Port Range");
    Tags.of(secGroup).add("Component", "Security Group");
    Tags.of(secGroup).add("Name", "SG-DIU-LB-" + props.name);

    const loadbalancer = new LoadBalancerStack(this, "ECSCluster-LoadBalancer-" + props.name, {
      vpc: props.clusterVPC,
      cluster: this.cluster,
      secGroup: secGroup,
      name: props.name,
      domainName: props.domainName,
    }).loadbalancer;

    if (_SETTINGS.manageDNS) {
      const zone = HostedZone.fromLookup(this, props.name + "-Zone", { domainName: props.domainName });
      // TLS certificate
      const cert = new DnsValidatedCertificate(this, props.name + "-SiteCertificate", {
        domainName: "*." + props.domainName,
        hostedZone: zone,
        region: props.env?.region || "eu-west-2",
      });
      new CfnOutput(this, props.name + "-Certificate", { value: cert.certificateArn });

      _RequiredAppList.forEach((app: ApiProps) => {
        const siteDomain = app.siteSubDomain + "." + props.domainName;
        new CfnOutput(this, app.apiname + "-Site", { value: "https://" + siteDomain });
        new ARecord(this, app.apiname + "-SiteAliasRecord", {
          recordName: siteDomain,
          target: RecordTarget.fromAlias(new LoadBalancerTarget(loadbalancer)),
          zone: zone,
        });
      });
    }
  }
}

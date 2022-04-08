import { CfnOutput, Duration, Fn, Stack, Tags } from "aws-cdk-lib";
import { AwsLogDriver, Cluster, ContainerImage, Ec2Service, Ec2TaskDefinition, EcsOptimizedImage, NetworkMode, Protocol } from "aws-cdk-lib/aws-ecs";
import { _AccessListCountries, _RequiredAppList, _SETTINGS } from "./_config";
import { ApiProps, ContainerProps, ContainerStackProps, LoadBalancerStackProps, WAFProps } from "./types/interfaces";
import { InstanceType, ISubnet, Peer, Port, SecurityGroup, Subnet, SubnetSelection, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Schedule } from "aws-cdk-lib/aws-autoscaling";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { Certificate, DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { ApplicationListener, ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, ListenerAction, ListenerCondition, SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { CfnLoggingConfiguration, CfnWebACL, CfnWebACLAssociation } from "aws-cdk-lib/aws-wafv2";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

export class ContainerStack extends Stack {
  public readonly loadbalancer: ApplicationLoadBalancer;
  public readonly loadbalancer443: ApplicationListener;
  public readonly defaultTargetGroup: ApplicationTargetGroup;
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

    const LBObject: LoadBalancerStackProps = {
      vpc: props.clusterVPC,
      cluster: this.cluster,
      secGroup: secGroup,
      name: props.name,
      domainName: props.domainName,
    };

    const vpc = LBObject.vpc;
    let settings: SubnetSelection = { subnetType: SubnetType.PUBLIC };
    if (_SETTINGS.existingSubnetIDs) {
      const lbsubnetAZ1 = Subnet.fromSubnetAttributes(this, "lbsubnet", { subnetId: _SETTINGS.existingSubnetIDs[0].ID, availabilityZone: _SETTINGS.existingSubnetIDs[0].AZ });
      const lbsubnetAZ2 = Subnet.fromSubnetAttributes(this, "lbsubnet2", { subnetId: _SETTINGS.existingSubnetIDs[1].ID, availabilityZone: _SETTINGS.existingSubnetIDs[1].AZ });
      settings = { subnets: [lbsubnetAZ1, lbsubnetAZ2] };
    }
    const publicsubnets = vpc.selectSubnets(settings);

    this.loadbalancer = new ApplicationLoadBalancer(this, "BIPlatform-ALB-" + LBObject.name, {
      vpc: vpc,
      deletionProtection: true,
      internetFacing: true,
      loadBalancerName: "BIPlatform-alb-" + props.name,
      securityGroup: secGroup,
      vpcSubnets: publicsubnets,
      idleTimeout: Duration.seconds(900),
    });
    Tags.of(this.loadbalancer).add("Component", "Load Balancer");
    Tags.of(this.loadbalancer).add("Name", "BIPlatform-ALB" + LBObject.name);

    const cert = new Certificate(this, "SSLCertificate-LB", {
      domainName: LBObject.domainName,
    });

    const containerList = _RequiredAppList;
    const baseContainer = containerList[0];

    const defaultContainerService = this.newContainer({
      branch: baseContainer.application.branch,
      secGroup: secGroup,
      cluster: LBObject.cluster,
      name: LBObject.name,
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
      targets: [defaultContainerService],
    });
    Tags.of(this.defaultTargetGroup).add("Component", "Default Target Group");
    Tags.of(this.defaultTargetGroup).add("Name", "BIPlatform-ALB" + LBObject.name + "- Default Target Group");
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

    let index = 1;
    const otherContainers = containerList.slice(index);
    otherContainers.forEach((container) => {
      const containerService = this.newContainer({
        branch: container.application.branch,
        secGroup: secGroup,
        cluster: LBObject.cluster,
        name: container.apiname,
        port: container.port || 80,
        cpu: container.cpu || 256,
        memory: container.memory || 256,
        desired: container.desired || 1,
        minCapacity: container.minCapacity || 1,
        maxCapacity: container.maxCapacity || 1,
      });

      const target = new ApplicationTargetGroup(this, container.apiname + "-TG", {
        vpc: LBObject.vpc,
        targetGroupName: (props.name.replace("_", "-") + "-lbtarget").substring(0, 31),
        protocol: ApplicationProtocol.HTTP,
        port: container.port || 80,
        targets: [containerService],
        healthCheck: {
          path: "/",
          timeout: Duration.seconds(container.leadInTime || 30),
        },
      });
      this.loadbalancer443.addTargetGroups(container.apiname + "-Listener", {
        targetGroups: [target],
        conditions: [ListenerCondition.hostHeaders(["*" + container.siteSubDomain + "*"])],
        priority: index + 1,
      });
      index++;
    });

    this.albWAF({
      name: "WAF-" + props.name,
      resourceArn: this.loadbalancer.loadBalancerArn,
    });

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
          target: RecordTarget.fromAlias(new LoadBalancerTarget(this.loadbalancer)),
          zone: zone,
        });
      });
    }
  }

  newContainer(props: ContainerProps) {
    const repo = Repository.fromRepositoryName(this, props.name + "-Repo", props.name);
    const inboundlogging = new AwsLogDriver({
      streamPrefix: props.name,
    });
    const taskDef = new Ec2TaskDefinition(this, props.name + "-TaskDef", {
      networkMode: NetworkMode.AWS_VPC,
    });
    Tags.of(taskDef).add("Component", "Task Definition");
    Tags.of(taskDef).add("Name", props.name + "-TaskDef");

    const container = taskDef.addContainer(props.name, {
      image: ContainerImage.fromEcrRepository(repo, props.branch),
      logging: inboundlogging,
      essential: true,
      privileged: true,
      memoryLimitMiB: props.memory,
      cpu: props.cpu,
    });
    container.addPortMappings({ containerPort: props.port, hostPort: props.port, protocol: Protocol.TCP });

    const desiredCount = props.desired || 0;
    const minCapacity = props.minCapacity || 0;
    const maxCapacity = props.maxCapacity || 0;
    const service = new Ec2Service(this, props.name + "-Service", {
      cluster: props.cluster,
      taskDefinition: taskDef,
      assignPublicIp: false,
      desiredCount: desiredCount,
      minHealthyPercent: 50,
      securityGroups: [props.secGroup],
      serviceName: props.name,
    });
    const inboundscaling = service.autoScaleTaskCount({ minCapacity: minCapacity, maxCapacity: maxCapacity });
    inboundscaling.scaleOnCpuUtilization(props.name + "-CpuScaling", {
      targetUtilizationPercent: 80,
      scaleInCooldown: Duration.seconds(300),
      scaleOutCooldown: Duration.seconds(300),
    });

    Tags.of(service).add("Component", "ECS Service");
    Tags.of(service).add("Name", props.name + "-Service");
    return service;
  }

  albWAF(props: WAFProps) {
    const waf = new CfnWebACL(this, "WebACLForAPIGateway", {
      name: "BIPlatform-APIGateway-WAF",
      description: "ACL for Internet facing entry points to the BI Platform",
      scope: props.scope || "REGIONAL",
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "tnc-firewall",
      },
      rules: [
        {
          name: "GeoMatch",
          priority: 0,
          action: {
            block: {},
          },
          statement: {
            notStatement: {
              statement: {
                geoMatchStatement: {
                  countryCodes: _AccessListCountries,
                },
              },
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "GeoMatch",
          },
        },
        {
          name: "LimitRequests1000",
          priority: 2,
          action: {
            block: {},
          },
          statement: {
            rateBasedStatement: {
              limit: 1000,
              aggregateKeyType: "IP",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "LimitRequests1000",
          },
        },
      ],
    });
    const attrId = waf.attrArn;

    if (props.resourceArn) {
      new CfnWebACLAssociation(this, "webaclassoc-" + props.name, {
        webAclArn: waf.attrArn,
        resourceArn: props.resourceArn,
      });
    }

    const loggingGroup = new LogGroup(this, "WebACLLogGroup-" + props.name, { logGroupName: "aws-waf-logs-monitoring", retention: RetentionDays.TWO_MONTHS });
    new CfnLoggingConfiguration(this, "WebACLLogConfiguration-" + props.name, {
      logDestinationConfigs: [loggingGroup.logGroupArn],
      resourceArn: waf.attrArn,
    });

    new CfnOutput(this, "WAFArn", { value: attrId });
  }

  getResourceARNForEndpoint(region: string, restApiId: string, stageName: string): string {
    let Arn: string = Fn.join("", ["arn:aws:apigateway:", region, "::/restapis/", restApiId, "/stages/", stageName]);
    return Arn;
  }
}

import { CfnOutput, Duration, Fn, SecretValue, Stack, Tags } from "aws-cdk-lib";
import { AsgCapacityProvider, AwsLogDriver, Cluster, ContainerImage, Ec2Service, Ec2TaskDefinition, EcsOptimizedImage, NetworkMode, Protocol } from "aws-cdk-lib/aws-ecs";
import { _AccessListCountries, _RequiredAppList, _SETTINGS } from "./_config";
import { ApiProps, ContainerProps, ContainerStackProps, iServiceDetails, ObservabilityProps, ServiceObservabilityProps, WAFProps } from "./types/interfaces";
import { InstanceType, ISubnet, Peer, Port, SecurityGroup, Subnet, SubnetSelection, SubnetType } from "aws-cdk-lib/aws-ec2";
import { AutoScalingGroup, Schedule } from "aws-cdk-lib/aws-autoscaling";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { Certificate, DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { ApplicationListener, ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, ListenerAction, ListenerCondition, SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { CfnLoggingConfiguration, CfnWebACL, CfnWebACLAssociation } from "aws-cdk-lib/aws-wafv2";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { cleanseBucketName } from "../authentication/_functions";
import { ArnPrincipal, CompositePrincipal, Effect, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { CodeBuildAction, EcsDeployAction, GitHubSourceAction, GitHubTrigger } from "aws-cdk-lib/aws-codepipeline-actions";
import { BuildSpec, ComputeType, LinuxBuildImage, PipelineProject } from "aws-cdk-lib/aws-codebuild";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { Alarm, ComparisonOperator, Dashboard, GraphWidget, IMetric, Metric, TextWidget, TreatMissingData } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { CdkLambdaMsTeamsStack } from "./dashboards/lambdamsteams";

export class ContainerStack extends Stack {
  public readonly loadbalancer: ApplicationLoadBalancer;
  public readonly loadbalancer443: ApplicationListener;
  public readonly defaultTargetGroup: ApplicationTargetGroup;
  public readonly cluster: Cluster;

  constructor(scope: any, id: string, props: ContainerStackProps) {
    super(scope, id, props);

    this.cluster = new Cluster(this, "ECS-BIPlatform-" + props.name, {
      vpc: props.clusterVPC,
      clusterName: "ECS-BIPlatform-" + props.name,
    });

    let subnetArray: ISubnet[] = [];
    props.range.forEach((subnet: { ID: string; AZ: string }) => {
      subnetArray.push(Subnet.fromSubnetAttributes(this, subnet.ID, { subnetId: subnet.ID, availabilityZone: subnet.AZ }));
    });
    const subnets = props.clusterVPC.selectSubnets({
      subnets: subnetArray,
    });

    const autoScalingGroup = new AutoScalingGroup(this, "ASG", {
      vpc: props.clusterVPC,
      vpcSubnets: subnets,
      instanceType: new InstanceType("c5.2xlarge"),
      machineImage: EcsOptimizedImage.amazonLinux2(),
      minCapacity: props.capacity.min,
      maxCapacity: props.capacity.max,
      desiredCapacity: props.capacity.desired,
      autoScalingGroupName: "ASG-BIPlatform-" + props.name,
      associatePublicIpAddress: false,
    });

    const capacityProvider = new AsgCapacityProvider(this, "AsgCapacityProvider", {
      autoScalingGroup,
    });
    this.cluster.addAsgCapacityProvider(capacityProvider);

    if (_SETTINGS.serversAlwaysOn === false) {
      const starthour = _SETTINGS.startHour || "8";
      const stophour = _SETTINGS.stopHour || "18";
      Tags.of(this.cluster).add("Automation.Schedule", "Operates in Working Hours only");
      Tags.of(this.cluster).add("Automation.Schedules.Shutdown", "Weekdays at " + stophour);
      Tags.of(this.cluster).add("Automation.Schedules.Startup", "Weekdays at " + starthour);

      autoScalingGroup.scaleOnSchedule(props.name + "-PowerOn", {
        minCapacity: props.capacity.min,
        maxCapacity: props.capacity.max,
        desiredCapacity: props.capacity.desired,
        schedule: Schedule.cron({ hour: starthour, minute: "0" }),
      });
      autoScalingGroup.scaleOnSchedule(props.name + "-PowerOff", {
        minCapacity: 0,
        maxCapacity: 0,
        desiredCapacity: 0,
        schedule: Schedule.cron({ hour: stophour, minute: "0" }),
      });
      autoScalingGroup.scaleOnSchedule(props.name + "-PowerOff-Saturday", {
        minCapacity: 0,
        maxCapacity: 0,
        desiredCapacity: 0,
        schedule: Schedule.cron({ hour: starthour, minute: "15", weekDay: "Sat" }),
      });
      autoScalingGroup.scaleOnSchedule(props.name + "-PowerOff-Sunday", {
        minCapacity: 0,
        maxCapacity: 0,
        desiredCapacity: 0,
        schedule: Schedule.cron({ hour: starthour, minute: "15", weekDay: "Sun" }),
      });
    }

    const secGroup = new SecurityGroup(this, "ECSCluster-SecGroup-" + props.name, {
      vpc: props.clusterVPC,
      securityGroupName: "SG-BIPlatform-LB-" + props.name,
      description: "HTTP/S Access to ECS",
      allowAllOutbound: true,
    });
    secGroup.addIngressRule(Peer.anyIpv6(), Port.tcpRange(80, 8100), "Container Port Range");
    Tags.of(secGroup).add("Component", "Security Group");
    Tags.of(secGroup).add("Name", "SG-BIPlatform-LB-" + props.name);

    const vpc = props.clusterVPC;
    let settings: SubnetSelection = { subnetType: SubnetType.PUBLIC };
    if (_SETTINGS.existingSubnetIDs && _SETTINGS.existingSubnetIDs.filter((x) => x.type === "PUBLIC").length > 0) {
      const pubSubnets = _SETTINGS.existingSubnetIDs.filter((x) => x.type === "PUBLIC");
      const output: ISubnet[] = [];
      let index = 0;
      pubSubnets.forEach((x) => {
        output.push(Subnet.fromSubnetAttributes(this, "lbsubnet-" + index, { subnetId: x.ID, availabilityZone: x.AZ }));
        index++;
      });
      settings = { subnets: output };
    }
    const publicsubnets = vpc.selectSubnets(settings);

    this.loadbalancer = new ApplicationLoadBalancer(this, "BIPlatform-ALB-" + props.name, {
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

    let cert;

    if (_SETTINGS.sslCertificateId) {
      const region = props.env!.region || "eu-west-2";
      const account = props.env!.account! || process.env.CDK_DEFAULT_ACCOUNT;
      cert = Certificate.fromCertificateArn(this, "BIPlatform-Certificate-" + props.name, `arn:aws:acm:${region}:${account}:certificate/` + _SETTINGS.sslCertificateId);
    } else {
      cert = new Certificate(this, "SSLCertificate-LB", {
        domainName: props.domainName,
      });
    }

    const containerList = _RequiredAppList;
    const baseContainer = containerList[0];

    const defaultContainerService = this.newContainer({
      application: baseContainer.application,
      branch: baseContainer.application.branch,
      secGroup: secGroup,
      cluster: this.cluster,
      name: baseContainer.apiname,
      port: baseContainer.port || 80,
      cpu: baseContainer.cpu || 256,
      memory: baseContainer.memory || 512,
      desired: baseContainer.desired || 1,
      minCapacity: baseContainer.minCapacity || 1,
      maxCapacity: baseContainer.maxCapacity || 1,
      buildArgs: baseContainer.buildArgs || [],
      subDomain: baseContainer.siteSubDomain || "api",
      roleArn: props.codebuildRole.roleArn,
      variables: baseContainer.variables,
    });

    this.defaultTargetGroup = new ApplicationTargetGroup(this, "defaultTargetGroup", {
      targetGroupName: baseContainer.siteSubDomain || "api",
      vpc: vpc,
      protocol: ApplicationProtocol.HTTP,
      port: 80,
      targets: [defaultContainerService],
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

    const obsServiceList: iServiceDetails[] = [];

    const otherContainers = containerList.slice(1);
    otherContainers.forEach((container) => {
      const containerService = this.newContainer({
        application: container.application,
        branch: container.application.branch,
        secGroup: secGroup,
        cluster: this.cluster,
        name: container.apiname,
        port: container.port || 80,
        cpu: container.cpu || 256,
        memory: container.memory || 256,
        desired: container.desired || 1,
        minCapacity: container.minCapacity || 1,
        maxCapacity: container.maxCapacity || 1,
        buildArgs: container.buildArgs || [],
        subDomain: container.siteSubDomain,
        roleArn: props.codebuildRole.roleArn,
        variables: container.variables,
      });

      const timeout = (container.leadInTime || 30) * 2;

      const target = new ApplicationTargetGroup(this, container.apiname + "-TG", {
        vpc: vpc,
        targetGroupName: cleanseBucketName(container.apiname.replace("_", "-") + "-lbtarget").substring(0, 31),
        protocol: ApplicationProtocol.HTTP,
        port: 80,
        targets: [containerService],
        healthCheck: {
          path: "/",
          timeout: Duration.seconds(container.leadInTime || 30),
          interval: Duration.seconds(timeout),
        },
      });
      this.loadbalancer443.addTargetGroups(container.apiname + "-Listener", {
        targetGroups: [target],
        conditions: [ListenerCondition.hostHeaders(["*" + container.siteSubDomain + ".*"])],
        priority: container.priority,
      });

      obsServiceList.push({
        service: cleanseBucketName(container.apiname),
        cluster: this.cluster.clusterName,
      });
    });

    this.albWAF(
      {
        name: "WAF-" + props.name,
        resourceArn: this.loadbalancer.loadBalancerArn,
      },
      { account: props.env!.account!, region: props.env!.region || "eu-west-2" }
    );

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

    this.addObservability({
      dashboardName: this.cluster.clusterName + "-ClusterDashboard",
      ECSCluster: ["ECS-BIPlatform-" + props.name],
    });

    let teamsLambda;
    if (_SETTINGS.msTeamsWebhook) {
      teamsLambda = new CdkLambdaMsTeamsStack(this, "MSTeamsLambdaStack-Services", { env: { account: this.account, region: this.region }, name: "Services" });
    }

    this.addServiceObservability({
      dashboardName: "ECS-BIPlatform-ServicesDashboard-" + props.name,
      ECSEc2Service: obsServiceList,
      topic: teamsLambda?.topic || undefined,
    });
  }

  newContainer(props: ContainerProps) {
    const role = Role.fromRoleArn(this, "ApiStackRoleFromArn-" + props.subDomain, props.roleArn, { mutable: false });
    const ecrRepoName = cleanseBucketName(props.name);
    const repo = new Repository(this, "ECR-Repository-" + props.name, { repositoryName: ecrRepoName });
    repo.addLifecycleRule({ tagPrefixList: ["main"], maxImageCount: 99 });
    repo.addLifecycleRule({ maxImageAge: Duration.days(30) });
    const statement = new PolicyStatement({
      effect: Effect.ALLOW,
      sid: "CDK Access",
      principals: [new CompositePrincipal(new ServicePrincipal("codebuild.amazonaws.com"), new ArnPrincipal(role.roleArn))],
      actions: ["ecr:BatchCheckLayerAvailability", "ecr:BatchGetImage", "ecr:DescribeImages", "ecr:DescribeRepositories", "ecr:GetDownloadUrlForLayer", "ecr:GetLifecyclePolicy", "ecr:GetLifecyclePolicyPreview", "ecr:GetRepositoryPolicy", "ecr:InitiateLayerUpload", "ecr:ListImages", "ecr:PutImage", "ecr:UploadLayerPart"],
    });
    repo.addToResourcePolicy(statement);
    let commandlist = [];
    if (_SETTINGS.dockerhub) {
      commandlist.push("docker login -u $dockerhub_username -p $dockerhub_password");
    }
    commandlist.push("docker build " + getBuildArgs(props.buildArgs) + " -t " + ecrRepoName + ":main .");
    const postbuildcommand = ["docker tag " + ecrRepoName + `:${props.branch} ` + this.account + ".dkr.ecr.eu-west-2.amazonaws.com/" + ecrRepoName + ":" + props.branch, "docker push " + this.account + ".dkr.ecr.eu-west-2.amazonaws.com/" + ecrRepoName + ":" + props.branch, `printf '[{"name":"` + ecrRepoName + `","imageUri":"${this.account}.dkr.ecr.eu-west-2.amazonaws.com/` + ecrRepoName + `:${props.branch}"}]' > imagedefinitions.json`];

    const buildSpecObject = {
      version: "0.2",
      env: { "git-credential-helper": "yes" },
      phases: {
        install: {
          "runtime-versions": { docker: 18 },
          commands: "npm install",
        },
        pre_build: {
          commands: ["eval $(aws ecr get-login --no-include-email --region eu-west-2 --registry-ids " + this.account + ")"],
        },
        build: {
          commands: commandlist,
        },
        post_build: {
          commands: postbuildcommand,
        },
      },
      artifacts: {
        files: "imagedefinitions.json",
      },
    };

    const build = new PipelineProject(this, props.name + "-Build", {
      role: role,
      environmentVariables: props.variables,
      buildSpec: BuildSpec.fromObject(buildSpecObject),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_3_0,
        privileged: true,
        computeType: ComputeType.LARGE,
      },
      timeout: Duration.minutes(30),
      projectName: props.name + "-Build",
      // logging: {
      //   cloudWatch: {
      //     enabled: true,
      //     logGroup: new LogGroup(this, props.name + "-BuildLogGroup"),
      //   },
      // },
    });

    const sourceOutput = new Artifact();
    const buildOutput = new Artifact();
    const pipe = new Pipeline(this, props.name + "-Pipeline", {
      role: role,
      pipelineName: props.name + "-Pipeline",
      stages: [
        {
          stageName: "Source",
          actions: [
            new GitHubSourceAction({
              actionName: "Source",
              branch: props.application.branch,
              output: sourceOutput,
              repo: props.application.repo,
              owner: props.application.owner,
              oauthToken: SecretValue.secretsManager("github", {
                jsonField: "oauthToken",
              }),
              trigger: GitHubTrigger.WEBHOOK,
            }),
          ],
        },
        {
          stageName: "Build",
          actions: [
            new CodeBuildAction({
              actionName: "Build",
              project: build,
              input: sourceOutput,
              outputs: [buildOutput],
              role: role,
            }),
          ],
        },
      ],
      restartExecutionOnUpdate: true,
    });
    const inboundlogging = new AwsLogDriver({
      streamPrefix: props.name,
    });
    const taskDef = new Ec2TaskDefinition(this, props.name + "-TaskDef", {
      networkMode: NetworkMode.AWS_VPC,
    });
    Tags.of(taskDef).add("Component", "Task Definition");
    Tags.of(taskDef).add("Name", props.name + "-TaskDef");

    const container = taskDef.addContainer(props.name, {
      containerName: ecrRepoName,
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
      serviceName: ecrRepoName,
    });
    const inboundscaling = service.autoScaleTaskCount({ minCapacity: minCapacity, maxCapacity: maxCapacity });
    inboundscaling.scaleOnCpuUtilization(props.name + "-CpuScaling", {
      targetUtilizationPercent: 80,
      scaleInCooldown: Duration.seconds(300),
      scaleOutCooldown: Duration.seconds(300),
    });

    Tags.of(service).add("Component", "ECS Service");
    Tags.of(service).add("Name", props.name + "-Service");
    pipe.addStage({
      stageName: "Deploy",
      actions: [
        new EcsDeployAction({
          actionName: "Deploy",
          input: buildOutput,
          service: service,
          role: role,
        }),
      ],
    });
    return service;
  }

  albWAF(props: WAFProps, env: { account: string; region: string }) {
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

    const loggingGroup = new LogGroup(this, "WebACLLogGroup-" + props.name, { logGroupName: "aws-waf-logs-biplatformmonitoring", retention: RetentionDays.TWO_MONTHS });
    new CfnLoggingConfiguration(this, "WebACLLogConfiguration-" + props.name, {
      logDestinationConfigs: ["arn:aws:logs:" + env.region + ":" + env.account + ":log-group:aws-waf-logs-biplatformmonitoring"],
      resourceArn: waf.attrArn,
    });

    new CfnOutput(this, "WAFArn", { value: attrId });
  }

  getResourceARNForEndpoint(region: string, restApiId: string, stageName: string): string {
    let Arn: string = Fn.join("", ["arn:aws:apigateway:", region, "::/restapis/", restApiId, "/stages/", stageName]);
    return Arn;
  }

  addObservability(props: ObservabilityProps) {
    const titleWidget = new TextWidget({
      markdown: `# Dashboard: All ECS Clusters`,
      height: 1,
      width: 24,
    });

    const clusterlist = props.ECSCluster;
    const arrECSClusterCPUUtilization: IMetric[] = [];
    const arrECSClusterCPUReservation: IMetric[] = [];
    const arrECSClusterMemoryReservation: IMetric[] = [];
    clusterlist.forEach((item) => {
      arrECSClusterCPUUtilization.push(newMetric(item, "CPUUtilization"));
      arrECSClusterCPUReservation.push(newMetric(item, "CPUReservation"));
      arrECSClusterMemoryReservation.push(newMetric(item, "MemoryReservation"));
    });

    // Create CloudWatch Dashboard for ECS Cluster: CPU Utilization, CPU Reservation, Memory Reservation
    const graphWidget = new GraphWidget({
      title: "ECS Cluster CPU Utilization",
      left: arrECSClusterCPUUtilization,
      width: 24,
    });

    const graphWidget2 = new GraphWidget({
      title: "ECS Cluster CPU Reservation",
      left: arrECSClusterCPUReservation,
      width: 24,
    });

    const graphWidget3 = new GraphWidget({
      title: "ECS Cluster Memory Reservation",
      left: arrECSClusterMemoryReservation,
      width: 24,
    });

    // Create CloudWatch Dashboard
    new Dashboard(this, "ECSDashboard-Cluster", {
      dashboardName: props.dashboardName,
      widgets: [[titleWidget], [graphWidget], [graphWidget2], [graphWidget3]],
    });

    // Generate Outputs
    const cloudwatchDashboardURL = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${props.dashboardName}`;
    new CfnOutput(this, "DashboardOutput-Cluster", {
      value: cloudwatchDashboardURL,
      description: "URL of the CloudWatch Dashboard",
      exportName: "CloudWatchDashboardURL-Clusters",
    });
  }

  addServiceObservability(props: ServiceObservabilityProps) {
    // Create Title for Dashboard
    const titleWidget = new TextWidget({
      markdown: `# Dashboard: All ECS Services`,
      height: 1,
      width: 24,
    });

    // ECS EC2Service Configuration
    const Ec2Servicelist: iServiceDetails[] = props.ECSEc2Service;
    const arrECSEc2ServiceCPUUtilization: IMetric[] = [];
    const arrECSEc2ServiceMemoryUtilization: IMetric[] = [];
    const arrECSEc2ServiceRunningTaskCount: IMetric[] = [];
    Ec2Servicelist.forEach((service) => {
      arrECSEc2ServiceCPUUtilization.push(newServiceMetric(service.service, "CPUUtilization", service.cluster, "avg"));
      arrECSEc2ServiceMemoryUtilization.push(newServiceMetric(service.service, "MemoryUtilization", service.cluster, "avg"));
      arrECSEc2ServiceRunningTaskCount.push(newServiceMetric(service.service, "CPUUtilization", service.cluster, "n"));
      const alarm = new Alarm(this, service.service + "ServiceRunningCountAlarm", {
        alarmName: service.service + "ServiceRunningCountAlarm",
        comparisonOperator: ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
        threshold: 0,
        evaluationPeriods: 1,
        treatMissingData: TreatMissingData.BREACHING,
        metric: newServiceMetric(service.service, "CPUUtilization", service.cluster, "n"),
        alarmDescription: "ECS Ec2Service alarm if the services running threshold equals (0) for 1 evaluation period",
      });
      if (props.topic) alarm.addAlarmAction(new SnsAction(props.topic));
    });

    // Create CloudWatch Widget for ECS Ec2Service: CPU Utilization
    const graphWidget = new GraphWidget({
      title: "ECS EC2 Service CPU Utilization",
      left: arrECSEc2ServiceCPUUtilization,
      width: 24,
    });

    // Create CloudWatch Widget for ECS Ec2Service: Memory Utilization
    const graphWidgetMem = new GraphWidget({
      title: "ECS EC2 Service Memory Utilization",
      left: arrECSEc2ServiceMemoryUtilization,
      width: 24,
    });

    // Create CloudWatch Widget for ECS Ec2Service: Running Services Count
    // https://docs.aws.amazon.com/AmazonECS/latest/developerguide/cloudwatch-metrics.html#cw_running_task_count - https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-cloudwatch.MetricProps.html
    const graphWidgetCount = new GraphWidget({
      title: "ECS EC2 Service Running Task Count",
      left: arrECSEc2ServiceRunningTaskCount,
      width: 24,
    });

    // Create CloudWatch Dashboard
    new Dashboard(this, "ECSDashboard-Service", {
      dashboardName: props.dashboardName,
      widgets: [[titleWidget], [graphWidget], [graphWidgetMem], [graphWidgetCount]],
    });

    // Generate Outputs
    const cloudwatchDashboardURL = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${props.dashboardName}`;
    new CfnOutput(this, "DashboardOutput-Services", {
      value: cloudwatchDashboardURL,
      description: "URL of the CloudWatch Dashboard",
      exportName: "CloudWatchDashboardURL-Services",
    });
  }
}

function getBuildArgs(argArray: string[]) {
  let str = "";
  argArray.forEach((arg) => {
    str += "--build-arg " + arg + "=$" + arg + " ";
  });
  return str;
}

// Metric to show CPU Utilization, CPU Reservation, Memory Reservation
function newMetric(clustername: string, metricName: string) {
  return new Metric({
    metricName: metricName,
    namespace: "AWS/ECS",
    dimensionsMap: {
      ClusterName: clustername,
    },
    statistic: "avg",
    period: Duration.minutes(1),
  });
}

// Metric to show CPU Utilization, Memory Utilization
function newServiceMetric(servicename: string, metricName: string, clustername: string, statistic: string) {
  return new Metric({
    metricName: metricName,
    namespace: "AWS/ECS",
    dimensionsMap: {
      ClusterName: clustername,
      ServiceName: servicename,
    },
    statistic: statistic,
    period: Duration.minutes(1),
  });
}

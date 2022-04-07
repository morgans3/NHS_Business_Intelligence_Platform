import { Duration, Stack, Tags } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { AwsLogDriver, ContainerImage, Ec2Service, Ec2TaskDefinition, NetworkMode, Protocol } from "aws-cdk-lib/aws-ecs";
import { ContainerProps } from "./types/interfaces";
import { _SETTINGS } from "./_config";

export class Container extends Stack {
  public readonly service: Ec2Service;

  constructor(scope: Stack, id: string, props: ContainerProps) {
    super(scope, id);

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
    this.service = new Ec2Service(this, props.name + "-Service", {
      cluster: props.cluster,
      taskDefinition: taskDef,
      assignPublicIp: false,
      desiredCount: desiredCount,
      minHealthyPercent: 50,
      securityGroups: [props.secGroup],
      serviceName: props.name,
    });
    const inboundscaling = this.service.autoScaleTaskCount({ minCapacity: minCapacity, maxCapacity: maxCapacity });
    inboundscaling.scaleOnCpuUtilization(props.name + "-CpuScaling", {
      targetUtilizationPercent: 80,
      scaleInCooldown: Duration.seconds(300),
      scaleOutCooldown: Duration.seconds(300),
    });

    Tags.of(this.service).add("Component", "ECS Service");
    Tags.of(this.service).add("Name", props.name + "-Service");
  }
}

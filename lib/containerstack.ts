import { CfnOutput, Stack } from "aws-cdk-lib";
import { ContainerImage } from "aws-cdk-lib/aws-ecs";
import { _SETTINGS } from "./_config";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";

export class ContainerStack extends Stack {
  constructor(scope: any, id: string, props: any) {
    super(scope, id, props);

    const fargate = new ecs_patterns.ApplicationLoadBalancedFargateService(this, props.name + "-FargateService", {
      cpu: props.cpu,
      desiredCount: props.desiredCount,
      taskImageOptions: { image: ContainerImage.fromEcrRepository(props.repo) },
      memoryLimitMiB: props.memory,
      publicLoadBalancer: true,
      domainName: props.subdomain + props.domainName,
    });

    new CfnOutput(this, props.name + "-LoadBalancerDNS", {
      value: fargate.loadBalancer.loadBalancerDnsName,
    });

    if (_SETTINGS.manageDNS) {
      // TODO: Add Route 53 DNS records
    }
  }
}

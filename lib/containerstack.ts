import { Stack } from "aws-cdk-lib";
import { _SETTINGS } from "./_config";

export class ContainerStack extends Stack {
  constructor(scope: any, id: string, props?: any) {
    super(scope, id, props);

    // Fargate ECS pattern + WAFStack

    // TaskDefinitions?
    // ECS Services?

    if (_SETTINGS.manageDNS) {
      // Add Route 53 DNS records
    }
  }
}

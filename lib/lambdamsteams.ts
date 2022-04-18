import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { _SETTINGS } from "./_config";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";

export interface CdkLambdaMsTeamsStackProps extends NestedStackProps {
  name: string;
  env: { region: string; account: string };
}

export class CdkLambdaMsTeamsStack extends NestedStack {
  public topic: Topic;
  constructor(scope: any, id: string, props: CdkLambdaMsTeamsStackProps) {
    super(scope, id, props);

    const lambdarole = new Role(this, "LambdaDynamoDBRole-" + props.name, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      roleName: "LambdaMSTeamsConnectorRole-" + props.name,
    });
    lambdarole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));

    const handler = new Function(this, "MSTeamConnectorHandler-" + props.name, {
      functionName: "MSTeamConnectorLambda-" + props.name,
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./src/msteams", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "msteams.handler",
      environment: {
        MS_TEAMS_WEBHOOK_URL: _SETTINGS.msTeamsWebhook || "",
        ACCOUNT: props.env.account,
      },
      role: lambdarole,
    });
    // Create Standard SNS Topic
    this.topic = new Topic(this, "sns-topic", {
      displayName: "Lambda SNS Topic-" + props.name,
    });

    // Subscribe Lambda to SNS topic
    this.topic.addSubscription(new LambdaSubscription(handler));
  }
}

import { Stack, StackProps } from "aws-cdk-lib";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

export class IAMStack extends Stack {
  public codebuildRole: Role;
  public databaseRole: Role;

  constructor(scope: any, id: string, props: StackProps) {
    super(scope, id, props);

    this.codebuildRole = new Role(this, "CodeBuildRole", {
      roleName: "CodeBuildRole",
      assumedBy: new ServicePrincipal("codebuild.amazonaws.com"),
      description: "Role for building and deploying code bases",
    });
    this.codebuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AWSCodePipelineFullAccess"));
    this.codebuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));
    this.codebuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"));
    this.codebuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AWSCodeDeployRoleForECS"));
    this.codebuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"));

    this.databaseRole = new Role(this, "CodeBuildRole", {
      roleName: "DatabaseRole",
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      description: "Role for Databases to manage access.",
    });
    this.databaseRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"));
    this.databaseRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));
  }
}
import { Stack, StackProps } from "aws-cdk-lib";
import { ArnPrincipal, CompositePrincipal, ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

export class IAMStack extends Stack {
  public codebuildRole: Role;
  public databaseRole: Role;
  public lambdaRole: Role;

  constructor(scope: any, id: string, props: StackProps) {
    super(scope, id, props);

    this.codebuildRole = new Role(this, "CodeBuildRole", {
      roleName: "BI_CodeBuildRole",
      assumedBy: new CompositePrincipal(new ServicePrincipal("codebuild.amazonaws.com"), new ServicePrincipal("codepipeline.amazonaws.com"), new ArnPrincipal(`arn:aws:iam::${props.env?.account}:role/BI_CodeBuildRole`)),
      description: "Role for building code bases",
    });
    this.codebuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AWSCodeBuildDeveloperAccess"));
    this.codebuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AWSCodePipelineFullAccess"));
    this.codebuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));
    this.codebuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"));
    this.codebuildRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"));

    this.databaseRole = new Role(this, "DatabaseRole", {
      roleName: "BI_DatabaseRole",
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      description: "Role for Databases to manage access.",
    });
    this.databaseRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"));
    this.databaseRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));

    this.lambdaRole = new Role(this, "LambdaRole", {
      roleName: "BI_LambdaRole",
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      description: "Role for Lambdas to manage access.",
    });
    this.lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"));
    this.lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));
    this.lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"));
  }
}

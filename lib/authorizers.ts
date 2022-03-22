import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { TokenAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaAuthorizersProps } from "./types/interfaces";

export class LambdaAuthorizers extends Stack {
  public readonly authlambda: Function;
  public readonly authorizer: TokenAuthorizer;
  public readonly publicLambda: Function;
  public readonly publicAuthorizer: TokenAuthorizer;

  constructor(scope: any, id: string, props: LambdaAuthorizersProps) {
    super(scope, id, props);

    this.authlambda = new Function(this, "API-Auth-Handler", {
      functionName: "API-Auth-Lambda" + props.name,
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./src/auth", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "handler.main",
      environment: { SECRET: props.JWTSECRET },
    });

    this.authorizer = new TokenAuthorizer(this, "API-Auth-Authorizer", {
      handler: this.authlambda,
      authorizerName: "API-Auth-Authorizer" + props.name,
      resultsCacheTtl: Duration.seconds(0),
    });

    new CfnOutput(this, "API-Auth-Authorizer-Output", { value: this.authorizer.authorizerArn });

    this.publicLambda = new Function(this, "API-Public-Auth-Handler", {
      functionName: "API-Public-Auth-Lambda" + props.name,
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./src/publicauth", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "handler.main",
      environment: { SECRET: props.JWTSECRET },
    });

    this.publicAuthorizer = new TokenAuthorizer(this, "API-Public-Auth-Authorizer", {
      handler: this.publicLambda,
      authorizerName: "API-Public-Auth-Authorizer" + props.name,
      resultsCacheTtl: Duration.seconds(0),
    });

    new CfnOutput(this, "API-Public-Auth-Authorizer-Output", { value: this.publicAuthorizer.authorizerArn });
  }
}

import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { TokenAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaAuthorizersProps } from "./types/interfaces";
import { RestApi, SecurityPolicy } from "aws-cdk-lib/aws-apigateway";
import { Certificate, CertificateValidation, ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGatewayDomain } from "aws-cdk-lib/aws-route53-targets";
import { _SETTINGS } from "./_config";
import { AnyPrincipal, Effect, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export class LambdaAuthorizers extends Stack {
  public readonly authlambda: Function;
  public readonly authorizer: TokenAuthorizer;
  public readonly publicLambda: Function;
  public readonly publicAuthorizer: TokenAuthorizer;
  public apigateway: RestApi;

  constructor(scope: any, id: string, props: LambdaAuthorizersProps) {
    super(scope, id, props);

    let sslcert: ICertificate;

    if (_SETTINGS.manageDNS) {
      const zone = HostedZone.fromLookup(this, "ApiGateway-Zone-Cert", { domainName: props.domainName });
      sslcert = new Certificate(this, "SSLCertificate", {
        domainName: props.domainName,
        validation: CertificateValidation.fromDns(zone),
      });
    } else {
      sslcert = new Certificate(this, "SSLCertificate", {
        domainName: props.domainName,
      });
    }

    this.apigateway = new RestApi(this, "BIPlatform-api-gateway", {
      restApiName: "API Services",
      description: "This service is for secured Serverless routes using RESTful methods to and from the BI Platform databases.",
      deploy: true,
      domainName: {
        domainName: props.domainName,
        certificate: sslcert,
        securityPolicy: SecurityPolicy.TLS_1_2,
      },
    });

    new CfnOutput(this, "API-Gateway-RestAPIID", { value: this.apigateway.restApiId });
    new CfnOutput(this, "API-Gateway-restApiRootResourceId", { value: this.apigateway.restApiRootResourceId });

    if (_SETTINGS.manageDNS) {
      const zone = HostedZone.fromLookup(this, "ApiGateway-Zone", { domainName: props.domainName });
      new ARecord(this, "ApiGateway-SiteAliasRecord", {
        recordName: "apig",
        target: RecordTarget.fromAlias(new ApiGatewayDomain(this.apigateway.domainName!)),
        zone: zone!,
      });
    }

    const role = Role.fromRoleArn(this, "AuthorizerRole", props.roleArn, { mutable: false });

    this.authlambda = new Function(this, "API-Auth-Handler", {
      functionName: "API-Auth-Lambda" + props.name,
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("./src/auth", {
        exclude: ["cdk", "*.ts"],
      }),
      handler: "handler.main",
      environment: { SECRET: props.JWTSECRET },
      role: role,
      logRetentionRole: role,
      logRetention: RetentionDays.TWO_MONTHS,
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: ["*"],
          principals: [new AnyPrincipal()],
        }),
      ],
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
      role: role,
      logRetentionRole: role,
      logRetention: RetentionDays.TWO_MONTHS,
    });

    this.publicAuthorizer = new TokenAuthorizer(this, "API-Public-Auth-Authorizer", {
      handler: this.publicLambda,
      authorizerName: "API-Public-Auth-Authorizer" + props.name,
      resultsCacheTtl: Duration.seconds(0),
    });

    new CfnOutput(this, "API-Public-Auth-Authorizer-Output", { value: this.publicAuthorizer.authorizerArn });
  }
}

import { CfnOutput, Duration, Fn, Stack } from "aws-cdk-lib";
import { Cors, TokenAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaAuthorizersProps } from "./types/interfaces";
import { RestApi, SecurityPolicy } from "aws-cdk-lib/aws-apigateway";
import { Certificate, CertificateValidation, ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGatewayDomain } from "aws-cdk-lib/aws-route53-targets";
import { _AccessListCountries, _SETTINGS } from "./_config";
import { ArnPrincipal, CompositePrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { WAFStack } from "./wafstack";
import { CfnWebACL, CfnWebACLAssociation } from "aws-cdk-lib/aws-wafv2";

export class LambdaAuthorizers extends Stack {
  public readonly authlambda: Function;
  public readonly authorizer: TokenAuthorizer;
  public readonly publicLambda: Function;
  public readonly publicAuthorizer: TokenAuthorizer;
  public apigateway: RestApi;

  constructor(scope: any, id: string, props: LambdaAuthorizersProps) {
    super(scope, id, props);

    let sslcert: ICertificate;

    // if (_SETTINGS.manageDNS) {
    //   const zone = HostedZone.fromLookup(this, "ApiGateway-Zone-Cert", { domainName: props.domainName });
    //   sslcert = new Certificate(this, "SSLCertificate", {
    //     domainName: "apig." + props.domainName,
    //     validation: CertificateValidation.fromDns(zone),
    //   });
    // } else {
    //   sslcert = new Certificate(this, "SSLCertificate", {
    //     domainName: props.domainName,
    //   });
    // }

    // this.apigateway = new RestApi(this, "BIPlatform-api-gateway", {
    //   restApiName: "API Services",
    //   description: "This service is for secured Serverless routes using RESTful methods to and from the BI Platform databases.",
    //   deploy: true,
    //   domainName: {
    //     domainName: props.domainName,
    //     certificate: sslcert,
    //     securityPolicy: SecurityPolicy.TLS_1_2,
    //   },
    //   policy: new PolicyDocument({
    //     statements: [
    //       new PolicyStatement({
    //         actions: ["lambda:*"],
    //         principals: [new CompositePrincipal(new ArnPrincipal(props.roleArn), new ServicePrincipal("apigateway.amazonaws.com"), new ServicePrincipal("lambda.amazonaws.com"))],
    //         resources: ["*"],
    //       }),
    //     ],
    //   }),
    //   defaultCorsPreflightOptions: {
    //     allowOrigins: Cors.ALL_ORIGINS,
    //     allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent", "access-control-allow-origin", "Cache-Control", "Pragma"],
    //   },
    // });

    // this.addWAF(this.apigateway, "apig." + props.domainName);

    // new CfnOutput(this, "API-Gateway-RestAPIID", { value: this.apigateway.restApiId });
    // new CfnOutput(this, "API-Gateway-restApiRootResourceId", { value: this.apigateway.restApiRootResourceId });

    // if (_SETTINGS.manageDNS) {
    //   const zone = HostedZone.fromLookup(this, "ApiGateway-Zone", { domainName: props.domainName });
    //   new ARecord(this, "ApiGateway-SiteAliasRecord", {
    //     recordName: "apig",
    //     target: RecordTarget.fromAlias(new ApiGatewayDomain(this.apigateway.domainName!)),
    //     zone: zone!,
    //   });
    // }

    // const role = Role.fromRoleArn(this, "AuthorizerRole", props.roleArn, { mutable: false });

    // this.authlambda = new Function(this, "API-Auth-Handler", {
    //   functionName: "API-Auth-Lambda" + props.name,
    //   runtime: Runtime.NODEJS_14_X,
    //   code: Code.fromAsset("./src/auth", {
    //     exclude: ["cdk", "*.ts"],
    //   }),
    //   handler: "handler.main",
    //   environment: { SECRET: props.JWTSECRET },
    //   role: role,
    //   logRetentionRole: role,
    //   logRetention: RetentionDays.TWO_MONTHS,
    //   initialPolicy: [
    //     new PolicyStatement({
    //       actions: ["lambda:InvokeFunction"],
    //       effect: Effect.ALLOW,
    //       resources: ["*"],
    //       principals: [new CompositePrincipal(new ArnPrincipal(props.roleArn), new ServicePrincipal("apigateway.amazonaws.com"), new ServicePrincipal("lambda.amazonaws.com"))],
    //     }),
    //   ],
    // });

    // this.authorizer = new TokenAuthorizer(this, "API-Auth-Authorizer", {
    //   handler: this.authlambda,
    //   authorizerName: "API-Auth-Authorizer" + props.name,
    //   resultsCacheTtl: Duration.seconds(0),
    //   assumeRole: role,
    // });

    // new CfnOutput(this, "API-Auth-Authorizer-Output", { value: this.authorizer.authorizerArn });

    // this.publicLambda = new Function(this, "API-Public-Auth-Handler", {
    //   functionName: "API-Public-Auth-Lambda" + props.name,
    //   runtime: Runtime.NODEJS_14_X,
    //   code: Code.fromAsset("./src/publicauth", {
    //     exclude: ["cdk", "*.ts"],
    //   }),
    //   handler: "handler.main",
    //   environment: { SECRET: props.JWTSECRET },
    //   role: role,
    //   logRetentionRole: role,
    //   logRetention: RetentionDays.TWO_MONTHS,
    //   initialPolicy: [
    //     new PolicyStatement({
    //       actions: ["lambda:InvokeFunction"],
    //       effect: Effect.ALLOW,
    //       resources: ["*"],
    //       principals: [new CompositePrincipal(new ArnPrincipal(props.roleArn), new ServicePrincipal("apigateway.amazonaws.com"), new ServicePrincipal("lambda.amazonaws.com"))],
    //     }),
    //   ],
    // });

    // this.publicAuthorizer = new TokenAuthorizer(this, "API-Public-Auth-Authorizer", {
    //   handler: this.publicLambda,
    //   authorizerName: "API-Public-Auth-Authorizer" + props.name,
    //   resultsCacheTtl: Duration.seconds(0),
    //   assumeRole: role,
    // });

    // new CfnOutput(this, "API-Public-Auth-Authorizer-Output", { value: this.publicAuthorizer.authorizerArn });
  }

  addWAF(gateway: RestApi, domainName: string) {
    const waf = new CfnWebACL(this, "WebACLForAPIGateway-" + domainName, {
      name: "BIPlatform-RestAPI-WAF",
      description: "ACL for Internet facing entry points to the BI Platform",
      scope: "REGIONAL",
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

    let apiGwArn = this.getResourceARNForEndpoint(this.region || "eu-west-2", gateway.deploymentStage.restApi.restApiId, gateway.deploymentStage.stageName);
    new CfnWebACLAssociation(this, "webaclassoc-" + domainName, {
      webAclArn: waf.attrArn,
      resourceArn: apiGwArn,
    });
  }

  getResourceARNForEndpoint(region: string, restApiId: string, stageName: string): string {
    let Arn: string = Fn.join("", ["arn:aws:apigateway:", region, "::/restapis/", restApiId, "/stages/", stageName]);
    return Arn;
  }
}

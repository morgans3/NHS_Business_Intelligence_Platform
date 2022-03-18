import { CfnOutput, Fn, Stack, StackProps } from "aws-cdk-lib";
import { CfnWebACL, CfnWebACLAssociation } from "aws-cdk-lib/aws-wafv2";
import { RestApi } from "aws-cdk-lib/aws-apigateway";
import { _AccessListCountries } from "./_config";

export interface WAFProps extends StackProps {
  apigateway: RestApi;
}

export class WAFStack extends Stack {
  public readonly attrId: string;
  constructor(scope: any, id: string, props: WAFProps) {
    super(scope, id, props);

    const waf = new CfnWebACL(this, "WebACLForAPIGateway", {
      name: "BIPlatform-APIGateway-WAF",
      description: "ACL for API Gateway",
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
    this.attrId = waf.attrArn;
    let apiGwArn = this.getResourceARNForEndpoint(props.env!.region || "eu-west-2", props.apigateway.deploymentStage.restApi.restApiId, props.apigateway.deploymentStage.stageName);
    new CfnWebACLAssociation(this, "mywebaclassoc", {
      webAclArn: waf.attrArn,
      resourceArn: apiGwArn,
    });
    this.attrId = waf.attrArn;
    new CfnOutput(this, "WAFArn", { value: this.attrId });
  }

  getResourceARNForEndpoint(region: string, restApiId: string, stageName: string): string {
    let Arn: string = Fn.join("", ["arn:aws:apigateway:", region, "::/restapis/", restApiId, "/stages/", stageName]);
    return Arn;
  }
}

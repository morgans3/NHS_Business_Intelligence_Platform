import { CfnOutput, Fn, Stack } from "aws-cdk-lib";
import { CfnLoggingConfiguration, CfnWebACL, CfnWebACLAssociation } from "aws-cdk-lib/aws-wafv2";
import { _AccessListCountries } from "./_config";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { WAFProps } from "./types/interfaces";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export class WAFStack extends Stack {
  public readonly attrId: string;
  constructor(scope: any, id: string, props: WAFProps) {
    super(scope, id, props);

    const waf = new CfnWebACL(this, "WebACLForAPIGateway", {
      name: "BIPlatform-APIGateway-WAF",
      description: "ACL for Internet facing entry points to the BI Platform",
      scope: props.scope || "REGIONAL",
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
    if (props.apigateway) {
      let apiGwArn = this.getResourceARNForEndpoint(props.env!.region || "eu-west-2", props.apigateway.deploymentStage.restApi.restApiId, props.apigateway.deploymentStage.stageName);
      new CfnWebACLAssociation(this, "webaclassoc-" + props.name, {
        webAclArn: waf.attrArn,
        resourceArn: apiGwArn,
      });
    }

    if (props.resourceArn) {
      new CfnWebACLAssociation(this, "webaclassoc-" + props.name, {
        webAclArn: waf.attrArn,
        resourceArn: props.resourceArn,
      });
    }

    if (props.scope === "CLOUDFRONT") {
      new StringParameter(this, "GloablWafArnSSMParam", {
        parameterName: "GLOBAL_WAF_ARN_PARAM",
        description: "The Global WAF ARN for this account",
        stringValue: waf.attrId,
      });
    }

    const loggingGroup = new LogGroup(this, "WebACLLogGroup-" + props.name, { logGroupName: "aws-waf-logs-monitoring", retention: RetentionDays.TWO_MONTHS });
    new CfnLoggingConfiguration(this, "WebACLLogConfiguration-" + props.name, {
      logDestinationConfigs: [loggingGroup.logGroupArn],
      resourceArn: waf.attrArn,
    });

    this.attrId = waf.attrArn;
    new CfnOutput(this, "WAFArn", { value: this.attrId });
  }

  getResourceARNForEndpoint(region: string, restApiId: string, stageName: string): string {
    let Arn: string = Fn.join("", ["arn:aws:apigateway:", region, "::/restapis/", restApiId, "/stages/", stageName]);
    return Arn;
  }
}

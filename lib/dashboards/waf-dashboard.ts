import { StackProps, Stack, CfnOutput } from "aws-cdk-lib";
import { TextWidget, IMetric, GraphWidget, IWidget, LogQueryWidget, Dashboard, Metric, Statistic } from "aws-cdk-lib/aws-cloudwatch";

export interface WAFCloudwatchDashboardStackProps extends StackProps {
  dashboardName: string;
  WAFWebACL: iWAFDataFromSDKCall[];
}

export interface iWAFDataFromSDKCall {
  name: string;
  region: string;
}

export class WAFCloudwatchDashboardStack extends Stack {
  constructor(scope: any, id: string, props: WAFCloudwatchDashboardStackProps) {
    super(scope, id, props);

    const titleWidget = new TextWidget({
      markdown: `# Dashboard: All WAFs`,
      height: 1,
      width: 24,
    });

    // WAF Cluster Configuration
    const WAFWebACLList = props.WAFWebACL;
    const arrWAFWebACLAllowedRequests: IMetric[] = [];
    const arrWAFWebACLBlockedRequests: IMetric[] = [];
    WAFWebACLList.forEach((item: iWAFDataFromSDKCall) => {
      arrWAFWebACLAllowedRequests.push(addWAFMetric("AllowedRequests", item));
      arrWAFWebACLBlockedRequests.push(addWAFMetric("BlockedRequests", item));
    });

    const graphWidget = new GraphWidget({
      title: "WAF Allowed Requests",
      left: arrWAFWebACLAllowedRequests,
      width: 24,
    });

    const graphWidget2 = new GraphWidget({
      title: "WAF Blocked Requests",
      left: arrWAFWebACLBlockedRequests,
      width: 24,
    });

    const arrWidgets: IWidget[] = [];
    arrWidgets.push(
      new LogQueryWidget({
        logGroupNames: ["aws-waf-logs-monitoring"],
        queryLines: ["fields @timestamp, @message", "sort @timestamp desc", "limit 100"],
        width: 24,
        height: 30,
      })
    );

    // Create CloudWatch Dashboard
    new Dashboard(this, "WAFDashboardTemplate-" + props.dashboardName, {
      dashboardName: props.dashboardName,
      widgets: [[titleWidget], [graphWidget], [graphWidget2], arrWidgets],
    });

    // Generate Outputs
    const cloudwatchDashboardURL = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${props.dashboardName}`;
    new CfnOutput(this, "DashboardOutput-" + props.dashboardName, {
      value: cloudwatchDashboardURL,
      description: "URL of the CloudWatch Dashboard",
      exportName: "CloudWatchDashboardURL-WAF",
    });
  }
}

function addWAFMetric(type: string, item: iWAFDataFromSDKCall) {
  return new Metric({
    namespace: "AWS/WAFV2",
    metricName: type,
    statistic: Statistic.SUM,
    dimensionsMap: {
      WebACL: item.name,
      Rule: "ALL",
      Region: item.region,
    },
  });
}

import { CfnOutput, NestedStack, NestedStackProps } from "aws-cdk-lib";
import { Dashboard, GraphWidget, IMetric, Metric, TextWidget } from "aws-cdk-lib/aws-cloudwatch";

interface CDNCloudwatchDashboardStackProps extends NestedStackProps {
  distributions: CDNListProps[];
  dashboardName: string;
}

interface CDNListProps {
  Id: string;
  Alias: string;
}

export class CDNCloudwatchDashboardStack extends NestedStack {
  constructor(scope: any, id: string, props: CDNCloudwatchDashboardStackProps) {
    super(scope, id, props);

    // Create Title for Dashboard
    const titleWidget = new TextWidget({
      markdown: `# Dashboard: All CloudFront`,
      height: 1,
      width: 24,
    });

    const CDNDistributionList = props.distributions;
    const arrCDNRequests: IMetric[] = [];
    const arrCDN4xxErrorRate: IMetric[] = [];
    const arrCDN5xxErrorRate: IMetric[] = [];
    CDNDistributionList.forEach((cdn: CDNListProps) => {
      arrCDNRequests.push(addCDNMetric("Requests", cdn));
      arrCDN4xxErrorRate.push(addCDNMetric("4xxErrorRate", cdn));
      arrCDN5xxErrorRate.push(addCDNMetric("5xxErrorRate", cdn));
    });

    // Create CloudWatch Dashboard for CloudFront Distribution: 4xx Errors, 5xx Errors
    const graphWidget = new GraphWidget({
      title: "CloudFront Requests",
      left: arrCDNRequests,
      width: 24,
    });

    const graphWidget2 = new GraphWidget({
      title: "CloudFront 4xx Error Rate",
      left: arrCDN4xxErrorRate,
      width: 24,
    });

    const graphWidget3 = new GraphWidget({
      title: "CloudFront 5xx Error Rate",
      left: arrCDN5xxErrorRate,
      width: 24,
    });

    // Create CloudWatch Dashboard
    new Dashboard(this, "CDNDashboardTemplate", {
      dashboardName: props.dashboardName,
      widgets: [[titleWidget], [graphWidget], [graphWidget2], [graphWidget3]],
    });

    // Generate Outputs
    const cloudwatchDashboardURL = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${props.dashboardName}`;
    new CfnOutput(this, "DashboardOutput", {
      value: cloudwatchDashboardURL,
      description: "URL of the CloudWatch Dashboard",
      exportName: "CloudWatchDashboardURL-CDN",
    });
  }
}

function addCDNMetric(type: string, item: CDNListProps) {
  return new Metric({
    namespace: "AWS/CloudFront",
    metricName: type,
    dimensionsMap: {
      DistributionId: item.Id,
      Region: "Global",
    }, // TODO: find out what is required in the dimensionsMap to get the graphs to properly render values (Is there anyway to include in the Schema: DistributionId,Region)
    label: item.Alias,
  });
}

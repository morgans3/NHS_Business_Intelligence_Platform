import { StackProps, Stack, Aws, CfnOutput } from "aws-cdk-lib";
import { TextWidget, IMetric, GraphWidget, Dashboard, Metric } from "aws-cdk-lib/aws-cloudwatch";

export interface RDSCloudwatchDashboardStackProps extends StackProps {
  dashboardName: string;
  databases: RDSDashboardProps[];
}

export interface RDSDashboardProps {
  DBInstanceIdentifier: string;
  Engine: string;
}

export class RDSCloudwatchDashboardStack extends Stack {
  constructor(scope: any, id: string, props: RDSCloudwatchDashboardStackProps) {
    super(scope, id, props);

    // Create Title for Dashboard
    const titleWidget = new TextWidget({
      markdown: `# Dashboard: All RDS`,
      height: 1,
      width: 24,
    });

    // WAF Cluster Configuration
    const RDSList: RDSDashboardProps[] = props.databases;
    const arrRDSCPUUtilization: IMetric[] = [];
    const arrRDSReadThroughput: IMetric[] = [];
    RDSList.forEach((rds: RDSDashboardProps) => {
      arrRDSCPUUtilization.push(addRDSMetric("CPUUtilization", rds));
      arrRDSReadThroughput.push(addRDSMetric("ReadThroughput", rds));
    });

    // Create CloudWatch Dashboard for RDS: CPU Utilization
    const graphWidget = new GraphWidget({
      title: "RDS CPU Utilization",
      left: arrRDSCPUUtilization,
      width: 24,
    });

    const graphWidget2 = new GraphWidget({
      title: "RDS Read Throughput",
      left: arrRDSReadThroughput,
      width: 24,
    });

    // Create CloudWatch Dashboard
    new Dashboard(this, "WAFDashboardTemplate-" + props.dashboardName, {
      dashboardName: props.dashboardName,
      widgets: [[titleWidget], [graphWidget], [graphWidget2]],
    });

    // Generate Outputs
    const cloudwatchDashboardURL = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${props.dashboardName}`;
    new CfnOutput(this, "DashboardOutput-" + props.dashboardName, {
      value: cloudwatchDashboardURL,
      description: "URL of the CloudWatch Dashboard",
      exportName: "CloudWatchDashboardURL-RDS",
    });
  }
}

function addRDSMetric(type: string, item: RDSDashboardProps) {
  return new Metric({
    namespace: "AWS/RDS",
    metricName: type,
    dimensionsMap: {
      DBInstanceIdentifier: item.DBInstanceIdentifier,
    },
    label: item.DBInstanceIdentifier + " (" + item.Engine + ")",
  });
}

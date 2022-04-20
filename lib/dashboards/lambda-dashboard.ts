import { StackProps, Stack, CfnOutput, Duration } from "aws-cdk-lib";
import { TextWidget, IMetric, Alarm, ComparisonOperator, TreatMissingData, GraphWidget, IWidget, LogQueryWidget, Dashboard, Metric } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { IFunction, Function } from "aws-cdk-lib/aws-lambda";
import { Topic } from "aws-cdk-lib/aws-sns";

interface LambdaDashboardStackProps extends StackProps {
  topic: Topic;
  dashboardName: string;
  lambdaFunctions: { FunctionName: string; FunctionArn: string }[];
}

export class LambdaDashboardStack extends Stack {
  constructor(scope: any, id: string, props: LambdaDashboardStackProps) {
    super(scope, id, props);

    // Create Title for Dashboard
    const titleWidget = new TextWidget({
      markdown: `# Dashboard: All Lambdas`,
      height: 1,
      width: 24,
    });

    const lambdalist = props.lambdaFunctions;
    const arrLambdaFunctions: IFunction[] = [];
    const arrMetricInvocations: IMetric[] = [];
    const arrMetricErrors: IMetric[] = [];
    const arrLogGroupNames: string[] = [];
    lambdalist.forEach((lambda) => {
      const lam = Function.fromFunctionArn(this, lambda.FunctionName, lambda.FunctionArn);
      arrLambdaFunctions.push(lam);
      arrMetricInvocations.push(lam.metricInvocations());
      arrMetricErrors.push(lam.metricErrors());
      arrLogGroupNames.push("/aws/lambda/" + lambda.FunctionName);
      const alarm = new Alarm(this, lambda.FunctionName + "LambdaErrorAlarm", {
        alarmName: lambda.FunctionName + "LambdaErrorAlarm",
        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        threshold: 3,
        evaluationPeriods: 1,
        treatMissingData: TreatMissingData.IGNORE,
        metric: newMetric(lambda.FunctionName, "Errors", "n"),
        alarmDescription: "Lambda alarm if the SUM of Errors is greater than or equal to the threshold (3) for 1 evaluation period",
      });
      alarm.addAlarmAction(new SnsAction(props.topic));
    });

    // Create CloudWatch Dashboard Widgets: Errors, Invocations
    const graphWidget = new GraphWidget({
      title: "Invocations",
      left: arrMetricInvocations,
      width: 24,
    });

    const graphWidget2 = new GraphWidget({
      title: "Errors",
      left: arrMetricErrors,
      width: 24,
    });

    // Create Widget to show last 10 Log Entries
    const arrWidgets: IWidget[] = [];
    arrLambdaFunctions.forEach((lambda) => {
      arrWidgets.push(
        new LogQueryWidget({
          logGroupNames: ["/aws/lambda/" + lambda.functionName],
          queryLines: ["fields @timestamp, @message", "filter (@message like /ERROR/ or @message like /REPORT/ or @message like /WARN/)", "sort @timestamp desc", "limit 10"],
        })
      );
    });

    // Create CloudWatch Dashboard
    new Dashboard(this, "LambdaDashboardTemplate-" + props.dashboardName, {
      dashboardName: props.dashboardName,
      widgets: [[titleWidget], [graphWidget], [graphWidget2], arrWidgets],
    });

    // Create Alarms for Lambdas of 3 errors in 1 minute

    new Alarm(this, `${props.dashboardName} Error Alarm`, {
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 3,
      evaluationPeriods: 1,
      metric: Function.metricAllErrors(),
    });

    // Generate Outputs
    const cloudwatchDashboardURL = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${props.dashboardName}`;
    new CfnOutput(this, "DashboardOutput-" + props.dashboardName, {
      value: cloudwatchDashboardURL,
      description: "URL of the CloudWatch Dashboard",
      exportName: "CloudWatchDashboardURL-Lambda",
    });
  }
}

function newMetric(FunctionName: string, metricName: string, statistic: string) {
  return new Metric({
    metricName: metricName,
    namespace: "AWS/Lambda",
    dimensionsMap: {
      FunctionName: FunctionName,
    },
    statistic: statistic,
    period: Duration.minutes(1),
  });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaDashboardStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_cloudwatch_1 = require("aws-cdk-lib/aws-cloudwatch");
const aws_cloudwatch_actions_1 = require("aws-cdk-lib/aws-cloudwatch-actions");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
class LambdaDashboardStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create Title for Dashboard
        const titleWidget = new aws_cloudwatch_1.TextWidget({
            markdown: `# Dashboard: All Lambdas`,
            height: 1,
            width: 24,
        });
        const lambdalist = props.lambdaFunctions;
        const arrLambdaFunctions = [];
        const arrMetricInvocations = [];
        const arrMetricErrors = [];
        const arrLogGroupNames = [];
        lambdalist.forEach((lambda) => {
            const lam = aws_lambda_1.Function.fromFunctionArn(this, lambda.FunctionName, lambda.FunctionArn);
            arrLambdaFunctions.push(lam);
            arrMetricInvocations.push(lam.metricInvocations());
            arrMetricErrors.push(lam.metricErrors());
            arrLogGroupNames.push("/aws/lambda/" + lambda.FunctionName);
            const alarm = new aws_cloudwatch_1.Alarm(this, lambda.FunctionName + "LambdaErrorAlarm", {
                alarmName: lambda.FunctionName + "LambdaErrorAlarm",
                comparisonOperator: aws_cloudwatch_1.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                threshold: 3,
                evaluationPeriods: 1,
                treatMissingData: aws_cloudwatch_1.TreatMissingData.BREACHING,
                metric: newMetric(lambda.FunctionName, "Errors", "n"),
                alarmDescription: "Lambda alarm if the SUM of Errors is greater than or equal to the threshold (3) for 1 evaluation period",
            });
            alarm.addAlarmAction(new aws_cloudwatch_actions_1.SnsAction(props.topic));
        });
        // Create CloudWatch Dashboard Widgets: Errors, Invocations
        const graphWidget = new aws_cloudwatch_1.GraphWidget({
            title: "Invocations",
            left: arrMetricInvocations,
            width: 24,
        });
        const graphWidget2 = new aws_cloudwatch_1.GraphWidget({
            title: "Errors",
            left: arrMetricErrors,
            width: 24,
        });
        // Create Widget to show last 10 Log Entries
        const arrWidgets = [];
        arrLambdaFunctions.forEach((lambda) => {
            arrWidgets.push(new aws_cloudwatch_1.LogQueryWidget({
                logGroupNames: ["/aws/lambda/" + lambda.functionName],
                queryLines: ["fields @timestamp, @message", "filter (@message like /ERROR/ or @message like /REPORT/ or @message like /WARN/)", "sort @timestamp desc", "limit 10"],
            }));
        });
        // Create CloudWatch Dashboard
        new aws_cloudwatch_1.Dashboard(this, "LambdaDashboardTemplate-" + props.dashboardName, {
            dashboardName: props.dashboardName,
            widgets: [[titleWidget], [graphWidget], [graphWidget2], arrWidgets],
        });
        // Create Alarms for Lambdas of 3 errors in 1 minute
        new aws_cloudwatch_1.Alarm(this, `${props.dashboardName} Error Alarm`, {
            comparisonOperator: aws_cloudwatch_1.ComparisonOperator.GREATER_THAN_THRESHOLD,
            threshold: 3,
            evaluationPeriods: 1,
            metric: aws_lambda_1.Function.metricAllErrors(),
        });
        // Generate Outputs
        const cloudwatchDashboardURL = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${props.dashboardName}`;
        new aws_cdk_lib_1.CfnOutput(this, "DashboardOutput-" + props.dashboardName, {
            value: cloudwatchDashboardURL,
            description: "URL of the CloudWatch Dashboard",
            exportName: "CloudWatchDashboardURL-Lambda",
        });
    }
}
exports.LambdaDashboardStack = LambdaDashboardStack;
function newMetric(FunctionName, metricName, statistic) {
    return new aws_cloudwatch_1.Metric({
        metricName: metricName,
        namespace: "AWS/Lambda",
        dimensionsMap: {
            FunctionName: FunctionName,
        },
        statistic: statistic,
        period: aws_cdk_lib_1.Duration.minutes(1),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLWRhc2hib2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxhbWJkYS1kYXNoYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQXFFO0FBQ3JFLCtEQUF1SztBQUN2SywrRUFBK0Q7QUFDL0QsdURBQTZEO0FBUzdELE1BQWEsb0JBQXFCLFNBQVEsbUJBQUs7SUFDN0MsWUFBWSxLQUFVLEVBQUUsRUFBVSxFQUFFLEtBQWdDO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDZCQUE2QjtRQUM3QixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFVLENBQUM7WUFDakMsUUFBUSxFQUFFLDBCQUEwQjtZQUNwQyxNQUFNLEVBQUUsQ0FBQztZQUNULEtBQUssRUFBRSxFQUFFO1NBQ1YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztRQUN6QyxNQUFNLGtCQUFrQixHQUFnQixFQUFFLENBQUM7UUFDM0MsTUFBTSxvQkFBb0IsR0FBYyxFQUFFLENBQUM7UUFDM0MsTUFBTSxlQUFlLEdBQWMsRUFBRSxDQUFDO1FBQ3RDLE1BQU0sZ0JBQWdCLEdBQWEsRUFBRSxDQUFDO1FBQ3RDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUM1QixNQUFNLEdBQUcsR0FBRyxxQkFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDcEYsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQ25ELGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDekMsZ0JBQWdC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LHVCQUFNLENBQUM7UUFDaEIsVUFBVSxFQUFFLFVBQVU7UUFDdEIsU0FBUyxFQUFFLFlBQVk7UUFDdkIsYUFBYSxFQUFFO1lBQ2IsWUFBWSxFQUFFLFlBQVk7U0FDM0I7UUFDRCxTQUFTLEVBQUUsU0FBUztRQUNwQixNQUFNLEVBQUUsc0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0tBQzVCLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdGFja1Byb3BzLCBTdGFjaywgQ2ZuT3V0cHV0LCBEdXJhdGlvbiB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xyXG5pbXBvcnQgeyBUZXh0V2lkZ2V0LCBJTWV0cmljLCBBbGFybSwgQ29tcGFyaXNvbk9wZXJhdG9yLCBUcmVhdE1pc3NpbmdEYXRhLCBHcmFwaFdpZGdldCwgSVdpZGdldCwgTG9nUXVlcnlXaWRnZXQsIERhc2hib2FyZCwgTWV0cmljIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoXCI7XHJcbmltcG9ydCB7IFNuc0FjdGlvbiB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zXCI7XHJcbmltcG9ydCB7IElGdW5jdGlvbiwgRnVuY3Rpb24gfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYVwiO1xyXG5pbXBvcnQgeyBUb3BpYyB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtc25zXCI7XHJcblxyXG5pbnRlcmZhY2UgTGFtYmRhRGFzaGJvYXJkU3RhY2tQcm9wcyBleHRlbmRzIFN0YWNrUHJvcHMge1xyXG4gIHRvcGljOiBUb3BpYztcclxuICBkYXNoYm9hcmROYW1lOiBzdHJpbmc7XHJcbiAgbGFtYmRhRnVuY3Rpb25zOiB7IEZ1bmN0aW9uTmFtZTogc3RyaW5nOyBGdW5jdGlvbkFybjogc3RyaW5nIH1bXTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExhbWJkYURhc2hib2FyZFN0YWNrIGV4dGVuZHMgU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBhbnksIGlkOiBzdHJpbmcsIHByb3BzOiBMYW1iZGFEYXNoYm9hcmRTdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgVGl0bGUgZm9yIERhc2hib2FyZFxyXG4gICAgY29uc3QgdGl0bGVXaWRnZXQgPSBuZXcgVGV4dFdpZGdldCh7XHJcbiAgICAgIG1hcmtkb3duOiBgIyBEYXNoYm9hcmQ6IEFsbCBMYW1iZGFzYCxcclxuICAgICAgaGVpZ2h0OiAxLFxyXG4gICAgICB3aWR0aDogMjQsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBsYW1iZGFsaXN0ID0gcHJvcHMubGFtYmRhRnVuY3Rpb25zO1xyXG4gICAgY29uc3QgYXJyTGFtYmRhRnVuY3Rpb25zOiBJRnVuY3Rpb25bXSA9IFtdO1xyXG4gICAgY29uc3QgYXJyTWV0cmljSW52b2NhdGlvbnM6IElNZXRyaWNbXSA9IFtdO1xyXG4gICAgY29uc3QgYXJyTWV0cmljRXJyb3JzOiBJTWV0cmljW10gPSBbXTtcclxuICAgIGNvbnN0IGFyckxvZ0dyb3VwTmFtZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICBsYW1iZGFsaXN0LmZvckVhY2goKGxhbWJkYSkgPT4ge1xyXG4gICAgICBjb25zdCBsYW0gPSBGdW5jdGlvbi5mcm9tRnVuY3Rpb25Bcm4odGhpcywgbGFtYmRhLkZ1bmN0aW9uTmFtZSwgbGFtYmRhLkZ1bmN0aW9uQXJuKTtcclxuICAgICAgYXJyTGFtYmRhRnVuY3Rpb25zLnB1c2gobGFtKTtcclxuICAgICAgYXJyTWV0cmljSW52b2NhdGlvbnMucHVzaChsYW0ubWV0cmljSW52b2NhdGlvbnMoKSk7XHJcbiAgICAgIGFyck1ldHJpY0Vycm9ycy5wdXNoKGxhbS5tZXRyaWNFcnJvcnMoKSk7XHJcbiAgICAgIGFyckxvZ0dyb3VwTmFtZXMucHVzaChcIi9hd3MvbGFtYmRhL1wiICsgbGFtYmRhLkZ1bmN0aW9uTmFtZSk7XHJcbiAgICAgIGNvbnN0IGFsYXJtID0gbmV3IEFsYXJtKHRoaXMsIGxhbWJkYS5GdW5jdGlvbk5hbWUgKyBcIkxhbWJkYUVycm9yQWxhcm1cIiwge1xyXG4gICAgICAgIGFsYXJtTmFtZTogbGFtYmRhLkZ1bmN0aW9uTmFtZSArIFwiTGFtYmRhRXJyb3JBbGFybVwiLFxyXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9PUl9FUVVBTF9UT19USFJFU0hPTEQsXHJcbiAgICAgICAgdGhyZXNob2xkOiAzLFxyXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxyXG4gICAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IFRyZWF0TWlzc2luZ0RhdGEuQlJFQUNISU5HLFxyXG4gICAgICAgIG1ldHJpYzogbmV3TWV0cmljKGxhbWJkYS5GdW5jdGlvbk5hbWUsIFwiRXJyb3JzXCIsIFwiblwiKSxcclxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiBcIkxhbWJkYSBhbGFybSBpZiB0aGUgU1VNIG9mIEVycm9ycyBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHRocmVzaG9sZCAoMykgZm9yIDEgZXZhbHVhdGlvbiBwZXJpb2RcIixcclxuICAgICAgfSk7XHJcbiAgICAgIGFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBTbnNBY3Rpb24ocHJvcHMudG9waWMpKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIERhc2hib2FyZCBXaWRnZXRzOiBFcnJvcnMsIEludm9jYXRpb25zXHJcbiAgICBjb25zdCBncmFwaFdpZGdldCA9IG5ldyBHcmFwaFdpZGdldCh7XHJcbiAgICAgIHRpdGxlOiBcIkludm9jYXRpb25zXCIsXHJcbiAgICAgIGxlZnQ6IGFyck1ldHJpY0ludm9jYXRpb25zLFxyXG4gICAgICB3aWR0aDogMjQsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBncmFwaFdpZGdldDIgPSBuZXcgR3JhcGhXaWRnZXQoe1xyXG4gICAgICB0aXRsZTogXCJFcnJvcnNcIixcclxuICAgICAgbGVmdDogYXJyTWV0cmljRXJyb3JzLFxyXG4gICAgICB3aWR0aDogMjQsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDcmVhdGUgV2lkZ2V0IHRvIHNob3cgbGFzdCAxMCBMb2cgRW50cmllc1xyXG4gICAgY29uc3QgYXJyV2lkZ2V0czogSVdpZGdldFtdID0gW107XHJcbiAgICBhcnJMYW1iZGFGdW5jdGlvbnMuZm9yRWFjaCgobGFtYmRhKSA9PiB7XHJcbiAgICAgIGFycldpZGdldHMucHVzaChcclxuICAgICAgICBuZXcgTG9nUXVlcnlXaWRnZXQoe1xyXG4gICAgICAgICAgbG9nR3JvdXBOYW1lczogW1wiL2F3cy9sYW1iZGEvXCIgKyBsYW1iZGEuZnVuY3Rpb25OYW1lXSxcclxuICAgICAgICAgIHF1ZXJ5TGluZXM6IFtcImZpZWxkcyBAdGltZXN0YW1wLCBAbWVzc2FnZVwiLCBcImZpbHRlciAoQG1lc3NhZ2UgbGlrZSAvRVJST1IvIG9yIEBtZXNzYWdlIGxpa2UgL1JFUE9SVC8gb3IgQG1lc3NhZ2UgbGlrZSAvV0FSTi8pXCIsIFwic29ydCBAdGltZXN0YW1wIGRlc2NcIiwgXCJsaW1pdCAxMFwiXSxcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggRGFzaGJvYXJkXHJcbiAgICBuZXcgRGFzaGJvYXJkKHRoaXMsIFwiTGFtYmRhRGFzaGJvYXJkVGVtcGxhdGUtXCIgKyBwcm9wcy5kYXNoYm9hcmROYW1lLCB7XHJcbiAgICAgIGRhc2hib2FyZE5hbWU6IHByb3BzLmRhc2hib2FyZE5hbWUsXHJcbiAgICAgIHdpZGdldHM6IFtbdGl0bGVXaWRnZXRdLCBbZ3JhcGhXaWRnZXRdLCBbZ3JhcGhXaWRnZXQyXSwgYXJyV2lkZ2V0c10sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDcmVhdGUgQWxhcm1zIGZvciBMYW1iZGFzIG9mIDMgZXJyb3JzIGluIDEgbWludXRlXHJcblxyXG4gICAgbmV3IEFsYXJtKHRoaXMsIGAke3Byb3BzLmRhc2hib2FyZE5hbWV9IEVycm9yIEFsYXJtYCwge1xyXG4gICAgICBjb21wYXJpc29uT3BlcmF0b3I6IENvbXBhcmlzb25PcGVyYXRvci5HUkVBVEVSX1RIQU5fVEhSRVNIT0xELFxyXG4gICAgICB0aHJlc2hvbGQ6IDMsXHJcbiAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxyXG4gICAgICBtZXRyaWM6IEZ1bmN0aW9uLm1ldHJpY0FsbEVycm9ycygpLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gR2VuZXJhdGUgT3V0cHV0c1xyXG4gICAgY29uc3QgY2xvdWR3YXRjaERhc2hib2FyZFVSTCA9IGBodHRwczovLyR7dGhpcy5yZWdpb259LmNvbnNvbGUuYXdzLmFtYXpvbi5jb20vY2xvdWR3YXRjaC9ob21lP3JlZ2lvbj0ke3RoaXMucmVnaW9ufSNkYXNoYm9hcmRzOm5hbWU9JHtwcm9wcy5kYXNoYm9hcmROYW1lfWA7XHJcbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsIFwiRGFzaGJvYXJkT3V0cHV0LVwiICsgcHJvcHMuZGFzaGJvYXJkTmFtZSwge1xyXG4gICAgICB2YWx1ZTogY2xvdWR3YXRjaERhc2hib2FyZFVSTCxcclxuICAgICAgZGVzY3JpcHRpb246IFwiVVJMIG9mIHRoZSBDbG91ZFdhdGNoIERhc2hib2FyZFwiLFxyXG4gICAgICBleHBvcnROYW1lOiBcIkNsb3VkV2F0Y2hEYXNoYm9hcmRVUkwtTGFtYmRhXCIsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5ld01ldHJpYyhGdW5jdGlvbk5hbWU6IHN0cmluZywgbWV0cmljTmFtZTogc3RyaW5nLCBzdGF0aXN0aWM6IHN0cmluZykge1xyXG4gIHJldHVybiBuZXcgTWV0cmljKHtcclxuICAgIG1ldHJpY05hbWU6IG1ldHJpY05hbWUsXHJcbiAgICBuYW1lc3BhY2U6IFwiQVdTL0xhbWJkYVwiLFxyXG4gICAgZGltZW5zaW9uc01hcDoge1xyXG4gICAgICBGdW5jdGlvbk5hbWU6IEZ1bmN0aW9uTmFtZSxcclxuICAgIH0sXHJcbiAgICBzdGF0aXN0aWM6IHN0YXRpc3RpYyxcclxuICAgIHBlcmlvZDogRHVyYXRpb24ubWludXRlcygxKSxcclxuICB9KTtcclxufVxyXG4iXX0=
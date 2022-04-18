"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAFCloudwatchDashboardStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_cloudwatch_1 = require("aws-cdk-lib/aws-cloudwatch");
class WAFCloudwatchDashboardStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const titleWidget = new aws_cloudwatch_1.TextWidget({
            markdown: `# Dashboard: All WAFs`,
            height: 1,
            width: 24,
        });
        // WAF Cluster Configuration
        const WAFWebACLList = props.WAFWebACL;
        const arrWAFWebACLAllowedRequests = [];
        const arrWAFWebACLBlockedRequests = [];
        WAFWebACLList.forEach((item) => {
            arrWAFWebACLAllowedRequests.push(addWAFMetric("AllowedRequests", item));
            arrWAFWebACLBlockedRequests.push(addWAFMetric("BlockedRequests", item));
        });
        const graphWidget = new aws_cloudwatch_1.GraphWidget({
            title: "WAF Allowed Requests",
            left: arrWAFWebACLAllowedRequests,
            width: 24,
        });
        const graphWidget2 = new aws_cloudwatch_1.GraphWidget({
            title: "WAF Blocked Requests",
            left: arrWAFWebACLBlockedRequests,
            width: 24,
        });
        const arrWidgets = [];
        arrWidgets.push(new aws_cloudwatch_1.LogQueryWidget({
            logGroupNames: ["aws-waf-logs-monitoring"],
            queryLines: ["fields @timestamp, @message", "sort @timestamp desc", "limit 100"],
            width: 24,
            height: 30,
        }));
        // Create CloudWatch Dashboard
        new aws_cloudwatch_1.Dashboard(this, "WAFDashboardTemplate-" + props.dashboardName, {
            dashboardName: props.dashboardName,
            widgets: [[titleWidget], [graphWidget], [graphWidget2], arrWidgets],
        });
        // Generate Outputs
        const cloudwatchDashboardURL = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${props.dashboardName}`;
        new aws_cdk_lib_1.CfnOutput(this, "DashboardOutput-" + props.dashboardName, {
            value: cloudwatchDashboardURL,
            description: "URL of the CloudWatch Dashboard",
            exportName: "CloudWatchDashboardURL-WAF",
        });
    }
}
exports.WAFCloudwatchDashboardStack = WAFCloudwatchDashboardStack;
function addWAFMetric(type, item) {
    return new aws_cloudwatch_1.Metric({
        namespace: "AWS/WAFV2",
        metricName: type,
        statistic: aws_cloudwatch_1.Statistic.SUM,
        dimensionsMap: {
            WebACL: item.name,
            Rule: "ALL",
            Region: item.region,
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FmLWRhc2hib2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhZi1kYXNoYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQTJEO0FBQzNELCtEQUFxSTtBQVlySSxNQUFhLDJCQUE0QixTQUFRLG1CQUFLO0lBQ3BELFlBQVksS0FBVSxFQUFFLEVBQVUsRUFBRSxLQUF1QztRQUN6RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFVLENBQUM7WUFDakMsUUFBUSxFQUFFLHVCQUF1QjtZQUNqQyxNQUFNLEVBQUUsQ0FBQztZQUNULEtBQUssRUFBRSxFQUFFO1NBQ1YsQ0FBQyxDQUFDO1FBRUgsNEJBQTRCO1FBQzVCLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDdEMsTUFBTSwyQkFBMkIsR0FBYyxFQUFFLENBQUM7UUFDbEQsTUFBTSwyQkFBMkIsR0FBYyxFQUFFLENBQUM7UUFDbEQsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQXlCLEVBQUUsRUFBRTtZQUNsRCwyQkFBMkIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDeEUsMkJBQTJCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzFFLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxXQUFXLEdBQUcsSUFBSSw0QkFBVyxDQUFDO1lBQ2xDLEtBQUssRUFBRSxzQkFBc0I7WUFDN0IsSUFBSSxFQUFFLDJCQUEyQjtZQUNqQyxLQUFLLEVBQUUsRUFBRTtTQUNWLENBQUMsQ0FBQztRQUVILE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVcsQ0FBQztZQUNuQyxLQUFLLEVBQUUsc0JBQXNCO1lBQzdCLElBQUksRUFBRSwyQkFBMkI7WUFDakMsS0FBSyxFQUFFLEVBQUU7U0FDVixDQUFDLENBQUM7UUFFSCxNQUFNLFVBQVUsR0FBYyxFQUFFLENBQUM7UUFDakMsVUFBVSxDQUFDLElBQUksQ0FDYixJQUFJLCtCQUFjLENBQUM7WUFDakIsYUFBYSxFQUFFLENBQUMseUJBQXlCLENBQUM7WUFDMUMsVUFBVSxFQUFFLENBQUMsNkJBQTZCLEVBQUUsc0JBQXNCLEVBQUUsV0FBVyxDQUFDO1lBQ2hGLEtBQUssRUFBRSxFQUFFO1lBQ1QsTUFBTSxFQUFFLEVBQUU7U0FDWCxDQUFDLENBQ0gsQ0FBQztRQUVGLDhCQUE4QjtRQUM5QixJQUFJLDBCQUFTLENBQUMsSUFBSSxFQUFFLHVCQUF1QixHQUFHLEtBQUssQ0FBQyxhQUFhLEVBQUU7WUFDakUsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhO1lBQ2xDLE9BQU8sRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLFVBQVUsQ0FBQztTQUNwRSxDQUFDLENBQUM7UUFFSCxtQkFBbUI7UUFDbkIsTUFBTSxzQkFBc0IsR0FBRyxXQUFXLElBQUksQ0FBQyxNQUFNLGtEQUFrRCxJQUFJLENBQUMsTUFBTSxvQkFBb0IsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzVKLElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGFBQWEsRUFBRTtZQUM1RCxLQUFLLEVBQUUsc0JBQXNCO1lBQzdCLFdBQVcsRUFBRSxpQ0FBaUM7WUFDOUMsVUFBVSxFQUFFLDRCQUE0QjtTQUN6QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF2REQsa0VBdURDO0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBWSxFQUFFLElBQXlCO0lBQzNELE9BQU8sSUFBSSx1QkFBTSxDQUFDO1FBQ2hCLFNBQVMsRUFBRSxXQUFXO1FBQ3RCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFNBQVMsRUFBRSwwQkFBUyxDQUFDLEdBQUc7UUFDeEIsYUFBYSxFQUFFO1lBQ2IsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2pCLElBQUksRUFBRSxLQUFLO1lBQ1gsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1NBQ3BCO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN0YWNrUHJvcHMsIFN0YWNrLCBDZm5PdXRwdXQgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuaW1wb3J0IHsgVGV4dFdpZGdldCwgSU1ldHJpYywgR3JhcGhXaWRnZXQsIElXaWRnZXQsIExvZ1F1ZXJ5V2lkZ2V0LCBEYXNoYm9hcmQsIE1ldHJpYywgU3RhdGlzdGljIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFdBRkNsb3Vkd2F0Y2hEYXNoYm9hcmRTdGFja1Byb3BzIGV4dGVuZHMgU3RhY2tQcm9wcyB7XHJcbiAgZGFzaGJvYXJkTmFtZTogc3RyaW5nO1xyXG4gIFdBRldlYkFDTDogaVdBRkRhdGFGcm9tU0RLQ2FsbFtdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIGlXQUZEYXRhRnJvbVNES0NhbGwge1xyXG4gIG5hbWU6IHN0cmluZztcclxuICByZWdpb246IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFdBRkNsb3Vkd2F0Y2hEYXNoYm9hcmRTdGFjayBleHRlbmRzIFN0YWNrIHtcclxuICBjb25zdHJ1Y3RvcihzY29wZTogYW55LCBpZDogc3RyaW5nLCBwcm9wczogV0FGQ2xvdWR3YXRjaERhc2hib2FyZFN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIGNvbnN0IHRpdGxlV2lkZ2V0ID0gbmV3IFRleHRXaWRnZXQoe1xyXG4gICAgICBtYXJrZG93bjogYCMgRGFzaGJvYXJkOiBBbGwgV0FGc2AsXHJcbiAgICAgIGhlaWdodDogMSxcclxuICAgICAgd2lkdGg6IDI0LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gV0FGIENsdXN0ZXIgQ29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgV0FGV2ViQUNMTGlzdCA9IHByb3BzLldBRldlYkFDTDtcclxuICAgIGNvbnN0IGFycldBRldlYkFDTEFsbG93ZWRSZXF1ZXN0czogSU1ldHJpY1tdID0gW107XHJcbiAgICBjb25zdCBhcnJXQUZXZWJBQ0xCbG9ja2VkUmVxdWVzdHM6IElNZXRyaWNbXSA9IFtdO1xyXG4gICAgV0FGV2ViQUNMTGlzdC5mb3JFYWNoKChpdGVtOiBpV0FGRGF0YUZyb21TREtDYWxsKSA9PiB7XHJcbiAgICAgIGFycldBRldlYkFDTEFsbG93ZWRSZXF1ZXN0cy5wdXNoKGFkZFdBRk1ldHJpYyhcIkFsbG93ZWRSZXF1ZXN0c1wiLCBpdGVtKSk7XHJcbiAgICAgIGFycldBRldlYkFDTEJsb2NrZWRSZXF1ZXN0cy5wdXNoKGFkZFdBRk1ldHJpYyhcIkJsb2NrZWRSZXF1ZXN0c1wiLCBpdGVtKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBncmFwaFdpZGdldCA9IG5ldyBHcmFwaFdpZGdldCh7XHJcbiAgICAgIHRpdGxlOiBcIldBRiBBbGxvd2VkIFJlcXVlc3RzXCIsXHJcbiAgICAgIGxlZnQ6IGFycldBRldlYkFDTEFsbG93ZWRSZXF1ZXN0cyxcclxuICAgICAgd2lkdGg6IDI0LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZ3JhcGhXaWRnZXQyID0gbmV3IEdyYXBoV2lkZ2V0KHtcclxuICAgICAgdGl0bGU6IFwiV0FGIEJsb2NrZWQgUmVxdWVzdHNcIixcclxuICAgICAgbGVmdDogYXJyV0FGV2ViQUNMQmxvY2tlZFJlcXVlc3RzLFxyXG4gICAgICB3aWR0aDogMjQsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBhcnJXaWRnZXRzOiBJV2lkZ2V0W10gPSBbXTtcclxuICAgIGFycldpZGdldHMucHVzaChcclxuICAgICAgbmV3IExvZ1F1ZXJ5V2lkZ2V0KHtcclxuICAgICAgICBsb2dHcm91cE5hbWVzOiBbXCJhd3Mtd2FmLWxvZ3MtbW9uaXRvcmluZ1wiXSxcclxuICAgICAgICBxdWVyeUxpbmVzOiBbXCJmaWVsZHMgQHRpbWVzdGFtcCwgQG1lc3NhZ2VcIiwgXCJzb3J0IEB0aW1lc3RhbXAgZGVzY1wiLCBcImxpbWl0IDEwMFwiXSxcclxuICAgICAgICB3aWR0aDogMjQsXHJcbiAgICAgICAgaGVpZ2h0OiAzMCxcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggRGFzaGJvYXJkXHJcbiAgICBuZXcgRGFzaGJvYXJkKHRoaXMsIFwiV0FGRGFzaGJvYXJkVGVtcGxhdGUtXCIgKyBwcm9wcy5kYXNoYm9hcmROYW1lLCB7XHJcbiAgICAgIGRhc2hib2FyZE5hbWU6IHByb3BzLmRhc2hib2FyZE5hbWUsXHJcbiAgICAgIHdpZGdldHM6IFtbdGl0bGVXaWRnZXRdLCBbZ3JhcGhXaWRnZXRdLCBbZ3JhcGhXaWRnZXQyXSwgYXJyV2lkZ2V0c10sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBHZW5lcmF0ZSBPdXRwdXRzXHJcbiAgICBjb25zdCBjbG91ZHdhdGNoRGFzaGJvYXJkVVJMID0gYGh0dHBzOi8vJHt0aGlzLnJlZ2lvbn0uY29uc29sZS5hd3MuYW1hem9uLmNvbS9jbG91ZHdhdGNoL2hvbWU/cmVnaW9uPSR7dGhpcy5yZWdpb259I2Rhc2hib2FyZHM6bmFtZT0ke3Byb3BzLmRhc2hib2FyZE5hbWV9YDtcclxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgXCJEYXNoYm9hcmRPdXRwdXQtXCIgKyBwcm9wcy5kYXNoYm9hcmROYW1lLCB7XHJcbiAgICAgIHZhbHVlOiBjbG91ZHdhdGNoRGFzaGJvYXJkVVJMLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJVUkwgb2YgdGhlIENsb3VkV2F0Y2ggRGFzaGJvYXJkXCIsXHJcbiAgICAgIGV4cG9ydE5hbWU6IFwiQ2xvdWRXYXRjaERhc2hib2FyZFVSTC1XQUZcIixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYWRkV0FGTWV0cmljKHR5cGU6IHN0cmluZywgaXRlbTogaVdBRkRhdGFGcm9tU0RLQ2FsbCkge1xyXG4gIHJldHVybiBuZXcgTWV0cmljKHtcclxuICAgIG5hbWVzcGFjZTogXCJBV1MvV0FGVjJcIixcclxuICAgIG1ldHJpY05hbWU6IHR5cGUsXHJcbiAgICBzdGF0aXN0aWM6IFN0YXRpc3RpYy5TVU0sXHJcbiAgICBkaW1lbnNpb25zTWFwOiB7XHJcbiAgICAgIFdlYkFDTDogaXRlbS5uYW1lLFxyXG4gICAgICBSdWxlOiBcIkFMTFwiLFxyXG4gICAgICBSZWdpb246IGl0ZW0ucmVnaW9uLFxyXG4gICAgfSxcclxuICB9KTtcclxufVxyXG4iXX0=
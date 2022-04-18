"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDNCloudwatchDashboardStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_cloudwatch_1 = require("aws-cdk-lib/aws-cloudwatch");
class CDNCloudwatchDashboardStack extends aws_cdk_lib_1.NestedStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create Title for Dashboard
        const titleWidget = new aws_cloudwatch_1.TextWidget({
            markdown: `# Dashboard: All CloudFront`,
            height: 1,
            width: 24,
        });
        const CDNDistributionList = props.distributions;
        const arrCDNRequests = [];
        const arrCDN4xxErrorRate = [];
        const arrCDN5xxErrorRate = [];
        CDNDistributionList.forEach((cdn) => {
            arrCDNRequests.push(addCDNMetric("Requests", cdn));
            arrCDN4xxErrorRate.push(addCDNMetric("4xxErrorRate", cdn));
            arrCDN5xxErrorRate.push(addCDNMetric("5xxErrorRate", cdn));
        });
        // Create CloudWatch Dashboard for CloudFront Distribution: 4xx Errors, 5xx Errors
        const graphWidget = new aws_cloudwatch_1.GraphWidget({
            title: "CloudFront Requests",
            left: arrCDNRequests,
            width: 24,
        });
        const graphWidget2 = new aws_cloudwatch_1.GraphWidget({
            title: "CloudFront 4xx Error Rate",
            left: arrCDN4xxErrorRate,
            width: 24,
        });
        const graphWidget3 = new aws_cloudwatch_1.GraphWidget({
            title: "CloudFront 5xx Error Rate",
            left: arrCDN5xxErrorRate,
            width: 24,
        });
        // Create CloudWatch Dashboard
        new aws_cloudwatch_1.Dashboard(this, "CDNDashboardTemplate", {
            dashboardName: props.dashboardName,
            widgets: [[titleWidget], [graphWidget], [graphWidget2], [graphWidget3]],
        });
        // Generate Outputs
        const cloudwatchDashboardURL = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${props.dashboardName}`;
        new aws_cdk_lib_1.CfnOutput(this, "DashboardOutput", {
            value: cloudwatchDashboardURL,
            description: "URL of the CloudWatch Dashboard",
            exportName: "CloudWatchDashboardURL-CDN",
        });
    }
}
exports.CDNCloudwatchDashboardStack = CDNCloudwatchDashboardStack;
function addCDNMetric(type, item) {
    return new aws_cloudwatch_1.Metric({
        namespace: "AWS/CloudFront",
        metricName: type,
        dimensionsMap: {
            DistributionId: item.Id,
            Region: "Global",
        },
        label: item.Alias,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RuLWRhc2hib2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNkbi1kYXNoYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQXVFO0FBQ3ZFLCtEQUFpRztBQVlqRyxNQUFhLDJCQUE0QixTQUFRLHlCQUFXO0lBQzFELFlBQVksS0FBVSxFQUFFLEVBQVUsRUFBRSxLQUF1QztRQUN6RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qiw2QkFBNkI7UUFDN0IsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBVSxDQUFDO1lBQ2pDLFFBQVEsRUFBRSw2QkFBNkI7WUFDdkMsTUFBTSxFQUFFLENBQUM7WUFDVCxLQUFLLEVBQUUsRUFBRTtTQUNWLENBQUMsQ0FBQztRQUVILE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztRQUNoRCxNQUFNLGNBQWMsR0FBYyxFQUFFLENBQUM7UUFDckMsTUFBTSxrQkFBa0IsR0FBYyxFQUFFLENBQUM7UUFDekMsTUFBTSxrQkFBa0IsR0FBYyxFQUFFLENBQUM7UUFDekMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBaUIsRUFBRSxFQUFFO1lBQ2hELGNBQWMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ25ELGtCQUFrQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDM0Qsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztRQUVILGtGQUFrRjtRQUNsRixNQUFNLFdBQVcsR0FBRyxJQUFJLDRCQUFXLENBQUM7WUFDbEMsS0FBSyxFQUFFLHFCQUFxQjtZQUM1QixJQUFJLEVBQUUsY0FBYztZQUNwQixLQUFLLEVBQUUsRUFBRTtTQUNWLENBQUMsQ0FBQztRQUVILE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVcsQ0FBQztZQUNuQyxLQUFLLEVBQUUsMkJBQTJCO1lBQ2xDLElBQUksRUFBRSxrQkFBa0I7WUFDeEIsS0FBSyxFQUFFLEVBQUU7U0FDVixDQUFDLENBQUM7UUFFSCxNQUFNLFlBQVksR0FBRyxJQUFJLDRCQUFXLENBQUM7WUFDbkMsS0FBSyxFQUFFLDJCQUEyQjtZQUNsQyxJQUFJLEVBQUUsa0JBQWtCO1lBQ3hCLEtBQUssRUFBRSxFQUFFO1NBQ1YsQ0FBQyxDQUFDO1FBRUgsOEJBQThCO1FBQzlCLElBQUksMEJBQVMsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDMUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhO1lBQ2xDLE9BQU8sRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDeEUsQ0FBQyxDQUFDO1FBRUgsbUJBQW1CO1FBQ25CLE1BQU0sc0JBQXNCLEdBQUcsV0FBVyxJQUFJLENBQUMsTUFBTSxrREFBa0QsSUFBSSxDQUFDLE1BQU0sb0JBQW9CLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUM1SixJQUFJLHVCQUFTLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3JDLEtBQUssRUFBRSxzQkFBc0I7WUFDN0IsV0FBVyxFQUFFLGlDQUFpQztZQUM5QyxVQUFVLEVBQUUsNEJBQTRCO1NBQ3pDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXRERCxrRUFzREM7QUFFRCxTQUFTLFlBQVksQ0FBQyxJQUFZLEVBQUUsSUFBa0I7SUFDcEQsT0FBTyxJQUFJLHVCQUFNLENBQUM7UUFDaEIsU0FBUyxFQUFFLGdCQUFnQjtRQUMzQixVQUFVLEVBQUUsSUFBSTtRQUNoQixhQUFhLEVBQUU7WUFDYixjQUFjLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDdkIsTUFBTSxFQUFFLFFBQVE7U0FDakI7UUFDRCxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7S0FDbEIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENmbk91dHB1dCwgTmVzdGVkU3RhY2ssIE5lc3RlZFN0YWNrUHJvcHMgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuaW1wb3J0IHsgRGFzaGJvYXJkLCBHcmFwaFdpZGdldCwgSU1ldHJpYywgTWV0cmljLCBUZXh0V2lkZ2V0IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoXCI7XHJcblxyXG5pbnRlcmZhY2UgQ0ROQ2xvdWR3YXRjaERhc2hib2FyZFN0YWNrUHJvcHMgZXh0ZW5kcyBOZXN0ZWRTdGFja1Byb3BzIHtcclxuICBkaXN0cmlidXRpb25zOiBDRE5MaXN0UHJvcHNbXTtcclxuICBkYXNoYm9hcmROYW1lOiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBDRE5MaXN0UHJvcHMge1xyXG4gIElkOiBzdHJpbmc7XHJcbiAgQWxpYXM6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENETkNsb3Vkd2F0Y2hEYXNoYm9hcmRTdGFjayBleHRlbmRzIE5lc3RlZFN0YWNrIHtcclxuICBjb25zdHJ1Y3RvcihzY29wZTogYW55LCBpZDogc3RyaW5nLCBwcm9wczogQ0ROQ2xvdWR3YXRjaERhc2hib2FyZFN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIC8vIENyZWF0ZSBUaXRsZSBmb3IgRGFzaGJvYXJkXHJcbiAgICBjb25zdCB0aXRsZVdpZGdldCA9IG5ldyBUZXh0V2lkZ2V0KHtcclxuICAgICAgbWFya2Rvd246IGAjIERhc2hib2FyZDogQWxsIENsb3VkRnJvbnRgLFxyXG4gICAgICBoZWlnaHQ6IDEsXHJcbiAgICAgIHdpZHRoOiAyNCxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IENETkRpc3RyaWJ1dGlvbkxpc3QgPSBwcm9wcy5kaXN0cmlidXRpb25zO1xyXG4gICAgY29uc3QgYXJyQ0ROUmVxdWVzdHM6IElNZXRyaWNbXSA9IFtdO1xyXG4gICAgY29uc3QgYXJyQ0RONHh4RXJyb3JSYXRlOiBJTWV0cmljW10gPSBbXTtcclxuICAgIGNvbnN0IGFyckNETjV4eEVycm9yUmF0ZTogSU1ldHJpY1tdID0gW107XHJcbiAgICBDRE5EaXN0cmlidXRpb25MaXN0LmZvckVhY2goKGNkbjogQ0ROTGlzdFByb3BzKSA9PiB7XHJcbiAgICAgIGFyckNETlJlcXVlc3RzLnB1c2goYWRkQ0ROTWV0cmljKFwiUmVxdWVzdHNcIiwgY2RuKSk7XHJcbiAgICAgIGFyckNETjR4eEVycm9yUmF0ZS5wdXNoKGFkZENETk1ldHJpYyhcIjR4eEVycm9yUmF0ZVwiLCBjZG4pKTtcclxuICAgICAgYXJyQ0RONXh4RXJyb3JSYXRlLnB1c2goYWRkQ0ROTWV0cmljKFwiNXh4RXJyb3JSYXRlXCIsIGNkbikpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggRGFzaGJvYXJkIGZvciBDbG91ZEZyb250IERpc3RyaWJ1dGlvbjogNHh4IEVycm9ycywgNXh4IEVycm9yc1xyXG4gICAgY29uc3QgZ3JhcGhXaWRnZXQgPSBuZXcgR3JhcGhXaWRnZXQoe1xyXG4gICAgICB0aXRsZTogXCJDbG91ZEZyb250IFJlcXVlc3RzXCIsXHJcbiAgICAgIGxlZnQ6IGFyckNETlJlcXVlc3RzLFxyXG4gICAgICB3aWR0aDogMjQsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBncmFwaFdpZGdldDIgPSBuZXcgR3JhcGhXaWRnZXQoe1xyXG4gICAgICB0aXRsZTogXCJDbG91ZEZyb250IDR4eCBFcnJvciBSYXRlXCIsXHJcbiAgICAgIGxlZnQ6IGFyckNETjR4eEVycm9yUmF0ZSxcclxuICAgICAgd2lkdGg6IDI0LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZ3JhcGhXaWRnZXQzID0gbmV3IEdyYXBoV2lkZ2V0KHtcclxuICAgICAgdGl0bGU6IFwiQ2xvdWRGcm9udCA1eHggRXJyb3IgUmF0ZVwiLFxyXG4gICAgICBsZWZ0OiBhcnJDRE41eHhFcnJvclJhdGUsXHJcbiAgICAgIHdpZHRoOiAyNCxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIERhc2hib2FyZFxyXG4gICAgbmV3IERhc2hib2FyZCh0aGlzLCBcIkNETkRhc2hib2FyZFRlbXBsYXRlXCIsIHtcclxuICAgICAgZGFzaGJvYXJkTmFtZTogcHJvcHMuZGFzaGJvYXJkTmFtZSxcclxuICAgICAgd2lkZ2V0czogW1t0aXRsZVdpZGdldF0sIFtncmFwaFdpZGdldF0sIFtncmFwaFdpZGdldDJdLCBbZ3JhcGhXaWRnZXQzXV0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBHZW5lcmF0ZSBPdXRwdXRzXHJcbiAgICBjb25zdCBjbG91ZHdhdGNoRGFzaGJvYXJkVVJMID0gYGh0dHBzOi8vJHt0aGlzLnJlZ2lvbn0uY29uc29sZS5hd3MuYW1hem9uLmNvbS9jbG91ZHdhdGNoL2hvbWU/cmVnaW9uPSR7dGhpcy5yZWdpb259I2Rhc2hib2FyZHM6bmFtZT0ke3Byb3BzLmRhc2hib2FyZE5hbWV9YDtcclxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgXCJEYXNoYm9hcmRPdXRwdXRcIiwge1xyXG4gICAgICB2YWx1ZTogY2xvdWR3YXRjaERhc2hib2FyZFVSTCxcclxuICAgICAgZGVzY3JpcHRpb246IFwiVVJMIG9mIHRoZSBDbG91ZFdhdGNoIERhc2hib2FyZFwiLFxyXG4gICAgICBleHBvcnROYW1lOiBcIkNsb3VkV2F0Y2hEYXNoYm9hcmRVUkwtQ0ROXCIsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZENETk1ldHJpYyh0eXBlOiBzdHJpbmcsIGl0ZW06IENETkxpc3RQcm9wcykge1xyXG4gIHJldHVybiBuZXcgTWV0cmljKHtcclxuICAgIG5hbWVzcGFjZTogXCJBV1MvQ2xvdWRGcm9udFwiLFxyXG4gICAgbWV0cmljTmFtZTogdHlwZSxcclxuICAgIGRpbWVuc2lvbnNNYXA6IHtcclxuICAgICAgRGlzdHJpYnV0aW9uSWQ6IGl0ZW0uSWQsXHJcbiAgICAgIFJlZ2lvbjogXCJHbG9iYWxcIixcclxuICAgIH0sIC8vIFRPRE86IGZpbmQgb3V0IHdoYXQgaXMgcmVxdWlyZWQgaW4gdGhlIGRpbWVuc2lvbnNNYXAgdG8gZ2V0IHRoZSBncmFwaHMgdG8gcHJvcGVybHkgcmVuZGVyIHZhbHVlcyAoSXMgdGhlcmUgYW55d2F5IHRvIGluY2x1ZGUgaW4gdGhlIFNjaGVtYTogRGlzdHJpYnV0aW9uSWQsUmVnaW9uKVxyXG4gICAgbGFiZWw6IGl0ZW0uQWxpYXMsXHJcbiAgfSk7XHJcbn1cclxuIl19
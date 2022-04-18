"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDSCloudwatchDashboardStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_cloudwatch_1 = require("aws-cdk-lib/aws-cloudwatch");
class RDSCloudwatchDashboardStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create Title for Dashboard
        const titleWidget = new aws_cloudwatch_1.TextWidget({
            markdown: `# Dashboard: All RDS`,
            height: 1,
            width: 24,
        });
        // WAF Cluster Configuration
        const RDSList = props.databases;
        const arrRDSCPUUtilization = [];
        const arrRDSReadThroughput = [];
        RDSList.forEach((rds) => {
            arrRDSCPUUtilization.push(addRDSMetric("CPUUtilization", rds));
            arrRDSReadThroughput.push(addRDSMetric("ReadThroughput", rds));
        });
        // Create CloudWatch Dashboard for RDS: CPU Utilization
        const graphWidget = new aws_cloudwatch_1.GraphWidget({
            title: "RDS CPU Utilization",
            left: arrRDSCPUUtilization,
            width: 24,
        });
        const graphWidget2 = new aws_cloudwatch_1.GraphWidget({
            title: "RDS Read Throughput",
            left: arrRDSReadThroughput,
            width: 24,
        });
        // Create CloudWatch Dashboard
        new aws_cloudwatch_1.Dashboard(this, "WAFDashboardTemplate-" + props.dashboardName, {
            dashboardName: props.dashboardName,
            widgets: [[titleWidget], [graphWidget], [graphWidget2]],
        });
        // Generate Outputs
        const cloudwatchDashboardURL = `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${props.dashboardName}`;
        new aws_cdk_lib_1.CfnOutput(this, "DashboardOutput-" + props.dashboardName, {
            value: cloudwatchDashboardURL,
            description: "URL of the CloudWatch Dashboard",
            exportName: "CloudWatchDashboardURL-RDS",
        });
    }
}
exports.RDSCloudwatchDashboardStack = RDSCloudwatchDashboardStack;
function addRDSMetric(type, item) {
    return new aws_cloudwatch_1.Metric({
        namespace: "AWS/RDS",
        metricName: type,
        dimensionsMap: {
            DBInstanceIdentifier: item.DBInstanceIdentifier,
        },
        label: item.DBInstanceIdentifier + " (" + item.Engine + ")",
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzLWRhc2hib2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJkcy1kYXNoYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQWdFO0FBQ2hFLCtEQUFpRztBQVlqRyxNQUFhLDJCQUE0QixTQUFRLG1CQUFLO0lBQ3BELFlBQVksS0FBVSxFQUFFLEVBQVUsRUFBRSxLQUF1QztRQUN6RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qiw2QkFBNkI7UUFDN0IsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBVSxDQUFDO1lBQ2pDLFFBQVEsRUFBRSxzQkFBc0I7WUFDaEMsTUFBTSxFQUFFLENBQUM7WUFDVCxLQUFLLEVBQUUsRUFBRTtTQUNWLENBQUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixNQUFNLE9BQU8sR0FBd0IsS0FBSyxDQUFDLFNBQVMsQ0FBQztRQUNyRCxNQUFNLG9CQUFvQixHQUFjLEVBQUUsQ0FBQztRQUMzQyxNQUFNLG9CQUFvQixHQUFjLEVBQUUsQ0FBQztRQUMzQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBc0IsRUFBRSxFQUFFO1lBQ3pDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMvRCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLENBQUM7UUFFSCx1REFBdUQ7UUFDdkQsTUFBTSxXQUFXLEdBQUcsSUFBSSw0QkFBVyxDQUFDO1lBQ2xDLEtBQUssRUFBRSxxQkFBcUI7WUFDNUIsSUFBSSxFQUFFLG9CQUFvQjtZQUMxQixLQUFLLEVBQUUsRUFBRTtTQUNWLENBQUMsQ0FBQztRQUVILE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVcsQ0FBQztZQUNuQyxLQUFLLEVBQUUscUJBQXFCO1lBQzVCLElBQUksRUFBRSxvQkFBb0I7WUFDMUIsS0FBSyxFQUFFLEVBQUU7U0FDVixDQUFDLENBQUM7UUFFSCw4QkFBOEI7UUFDOUIsSUFBSSwwQkFBUyxDQUFDLElBQUksRUFBRSx1QkFBdUIsR0FBRyxLQUFLLENBQUMsYUFBYSxFQUFFO1lBQ2pFLGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYTtZQUNsQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUN4RCxDQUFDLENBQUM7UUFFSCxtQkFBbUI7UUFDbkIsTUFBTSxzQkFBc0IsR0FBRyxXQUFXLElBQUksQ0FBQyxNQUFNLGtEQUFrRCxJQUFJLENBQUMsTUFBTSxvQkFBb0IsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzVKLElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGFBQWEsRUFBRTtZQUM1RCxLQUFLLEVBQUUsc0JBQXNCO1lBQzdCLFdBQVcsRUFBRSxpQ0FBaUM7WUFDOUMsVUFBVSxFQUFFLDRCQUE0QjtTQUN6QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUEvQ0Qsa0VBK0NDO0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBWSxFQUFFLElBQXVCO0lBQ3pELE9BQU8sSUFBSSx1QkFBTSxDQUFDO1FBQ2hCLFNBQVMsRUFBRSxTQUFTO1FBQ3BCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLGFBQWEsRUFBRTtZQUNiLG9CQUFvQixFQUFFLElBQUksQ0FBQyxvQkFBb0I7U0FDaEQ7UUFDRCxLQUFLLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUc7S0FDNUQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN0YWNrUHJvcHMsIFN0YWNrLCBBd3MsIENmbk91dHB1dCB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xyXG5pbXBvcnQgeyBUZXh0V2lkZ2V0LCBJTWV0cmljLCBHcmFwaFdpZGdldCwgRGFzaGJvYXJkLCBNZXRyaWMgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2hcIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUkRTQ2xvdWR3YXRjaERhc2hib2FyZFN0YWNrUHJvcHMgZXh0ZW5kcyBTdGFja1Byb3BzIHtcclxuICBkYXNoYm9hcmROYW1lOiBzdHJpbmc7XHJcbiAgZGF0YWJhc2VzOiBSRFNEYXNoYm9hcmRQcm9wc1tdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFJEU0Rhc2hib2FyZFByb3BzIHtcclxuICBEQkluc3RhbmNlSWRlbnRpZmllcjogc3RyaW5nO1xyXG4gIEVuZ2luZTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUkRTQ2xvdWR3YXRjaERhc2hib2FyZFN0YWNrIGV4dGVuZHMgU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBhbnksIGlkOiBzdHJpbmcsIHByb3BzOiBSRFNDbG91ZHdhdGNoRGFzaGJvYXJkU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIFRpdGxlIGZvciBEYXNoYm9hcmRcclxuICAgIGNvbnN0IHRpdGxlV2lkZ2V0ID0gbmV3IFRleHRXaWRnZXQoe1xyXG4gICAgICBtYXJrZG93bjogYCMgRGFzaGJvYXJkOiBBbGwgUkRTYCxcclxuICAgICAgaGVpZ2h0OiAxLFxyXG4gICAgICB3aWR0aDogMjQsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBXQUYgQ2x1c3RlciBDb25maWd1cmF0aW9uXHJcbiAgICBjb25zdCBSRFNMaXN0OiBSRFNEYXNoYm9hcmRQcm9wc1tdID0gcHJvcHMuZGF0YWJhc2VzO1xyXG4gICAgY29uc3QgYXJyUkRTQ1BVVXRpbGl6YXRpb246IElNZXRyaWNbXSA9IFtdO1xyXG4gICAgY29uc3QgYXJyUkRTUmVhZFRocm91Z2hwdXQ6IElNZXRyaWNbXSA9IFtdO1xyXG4gICAgUkRTTGlzdC5mb3JFYWNoKChyZHM6IFJEU0Rhc2hib2FyZFByb3BzKSA9PiB7XHJcbiAgICAgIGFyclJEU0NQVVV0aWxpemF0aW9uLnB1c2goYWRkUkRTTWV0cmljKFwiQ1BVVXRpbGl6YXRpb25cIiwgcmRzKSk7XHJcbiAgICAgIGFyclJEU1JlYWRUaHJvdWdocHV0LnB1c2goYWRkUkRTTWV0cmljKFwiUmVhZFRocm91Z2hwdXRcIiwgcmRzKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBEYXNoYm9hcmQgZm9yIFJEUzogQ1BVIFV0aWxpemF0aW9uXHJcbiAgICBjb25zdCBncmFwaFdpZGdldCA9IG5ldyBHcmFwaFdpZGdldCh7XHJcbiAgICAgIHRpdGxlOiBcIlJEUyBDUFUgVXRpbGl6YXRpb25cIixcclxuICAgICAgbGVmdDogYXJyUkRTQ1BVVXRpbGl6YXRpb24sXHJcbiAgICAgIHdpZHRoOiAyNCxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGdyYXBoV2lkZ2V0MiA9IG5ldyBHcmFwaFdpZGdldCh7XHJcbiAgICAgIHRpdGxlOiBcIlJEUyBSZWFkIFRocm91Z2hwdXRcIixcclxuICAgICAgbGVmdDogYXJyUkRTUmVhZFRocm91Z2hwdXQsXHJcbiAgICAgIHdpZHRoOiAyNCxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIERhc2hib2FyZFxyXG4gICAgbmV3IERhc2hib2FyZCh0aGlzLCBcIldBRkRhc2hib2FyZFRlbXBsYXRlLVwiICsgcHJvcHMuZGFzaGJvYXJkTmFtZSwge1xyXG4gICAgICBkYXNoYm9hcmROYW1lOiBwcm9wcy5kYXNoYm9hcmROYW1lLFxyXG4gICAgICB3aWRnZXRzOiBbW3RpdGxlV2lkZ2V0XSwgW2dyYXBoV2lkZ2V0XSwgW2dyYXBoV2lkZ2V0Ml1dLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gR2VuZXJhdGUgT3V0cHV0c1xyXG4gICAgY29uc3QgY2xvdWR3YXRjaERhc2hib2FyZFVSTCA9IGBodHRwczovLyR7dGhpcy5yZWdpb259LmNvbnNvbGUuYXdzLmFtYXpvbi5jb20vY2xvdWR3YXRjaC9ob21lP3JlZ2lvbj0ke3RoaXMucmVnaW9ufSNkYXNoYm9hcmRzOm5hbWU9JHtwcm9wcy5kYXNoYm9hcmROYW1lfWA7XHJcbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsIFwiRGFzaGJvYXJkT3V0cHV0LVwiICsgcHJvcHMuZGFzaGJvYXJkTmFtZSwge1xyXG4gICAgICB2YWx1ZTogY2xvdWR3YXRjaERhc2hib2FyZFVSTCxcclxuICAgICAgZGVzY3JpcHRpb246IFwiVVJMIG9mIHRoZSBDbG91ZFdhdGNoIERhc2hib2FyZFwiLFxyXG4gICAgICBleHBvcnROYW1lOiBcIkNsb3VkV2F0Y2hEYXNoYm9hcmRVUkwtUkRTXCIsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZFJEU01ldHJpYyh0eXBlOiBzdHJpbmcsIGl0ZW06IFJEU0Rhc2hib2FyZFByb3BzKSB7XHJcbiAgcmV0dXJuIG5ldyBNZXRyaWMoe1xyXG4gICAgbmFtZXNwYWNlOiBcIkFXUy9SRFNcIixcclxuICAgIG1ldHJpY05hbWU6IHR5cGUsXHJcbiAgICBkaW1lbnNpb25zTWFwOiB7XHJcbiAgICAgIERCSW5zdGFuY2VJZGVudGlmaWVyOiBpdGVtLkRCSW5zdGFuY2VJZGVudGlmaWVyLFxyXG4gICAgfSxcclxuICAgIGxhYmVsOiBpdGVtLkRCSW5zdGFuY2VJZGVudGlmaWVyICsgXCIgKFwiICsgaXRlbS5FbmdpbmUgKyBcIilcIixcclxuICB9KTtcclxufVxyXG4iXX0=
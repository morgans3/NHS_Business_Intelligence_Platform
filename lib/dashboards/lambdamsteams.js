"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkLambdaMsTeamsStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_sns_1 = require("aws-cdk-lib/aws-sns");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const aws_sns_subscriptions_1 = require("aws-cdk-lib/aws-sns-subscriptions");
const _config_1 = require("../_config");
class CdkLambdaMsTeamsStack extends aws_cdk_lib_1.NestedStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const lambdarole = new aws_iam_1.Role(this, "LambdaDynamoDBRole-" + props.name, {
            assumedBy: new aws_iam_1.ServicePrincipal("lambda.amazonaws.com"),
            roleName: "LambdaMSTeamsConnectorRole-" + props.name,
        });
        lambdarole.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));
        const handler = new aws_lambda_1.Function(this, "MSTeamConnectorHandler-" + props.name, {
            functionName: "MSTeamConnectorLambda-" + props.name,
            runtime: aws_lambda_1.Runtime.NODEJS_14_X,
            code: aws_lambda_1.Code.fromAsset("./src/msteams", {
                exclude: ["cdk", "*.ts"],
            }),
            handler: "msteams.handler",
            environment: {
                MS_TEAMS_WEBHOOK_URL: _config_1._SETTINGS.msTeamsWebhook || "",
                ACCOUNT: props.env.account,
            },
            role: lambdarole,
        });
        // Create Standard SNS Topic
        this.topic = new aws_sns_1.Topic(this, "sns-topic", {
            displayName: "Lambda SNS Topic-" + props.name,
        });
        // Subscribe Lambda to SNS topic
        this.topic.addSubscription(new aws_sns_subscriptions_1.LambdaSubscription(handler));
    }
}
exports.CdkLambdaMsTeamsStack = CdkLambdaMsTeamsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhbXN0ZWFtcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxhbWJkYW1zdGVhbXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQTREO0FBQzVELGlEQUE0RTtBQUM1RSxpREFBNEM7QUFDNUMsdURBQWlFO0FBQ2pFLDZFQUF1RTtBQUN2RSx3Q0FBdUM7QUFPdkMsTUFBYSxxQkFBc0IsU0FBUSx5QkFBVztJQUVwRCxZQUFZLEtBQVUsRUFBRSxFQUFVLEVBQUUsS0FBaUM7UUFDbkUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxjQUFJLENBQUMsSUFBSSxFQUFFLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUU7WUFDcEUsU0FBUyxFQUFFLElBQUksMEJBQWdCLENBQUMsc0JBQXNCLENBQUM7WUFDdkQsUUFBUSxFQUFFLDZCQUE2QixHQUFHLEtBQUssQ0FBQyxJQUFJO1NBQ3JELENBQUMsQ0FBQztRQUNILFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUU1RixNQUFNLE9BQU8sR0FBRyxJQUFJLHFCQUFRLENBQUMsSUFBSSxFQUFFLHlCQUF5QixHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUU7WUFDekUsWUFBWSxFQUFFLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxJQUFJO1lBQ25ELE9BQU8sRUFBRSxvQkFBTyxDQUFDLFdBQVc7WUFDNUIsSUFBSSxFQUFFLGlCQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRTtnQkFDcEMsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQzthQUN6QixDQUFDO1lBQ0YsT0FBTyxFQUFFLGlCQUFpQjtZQUMxQixXQUFXLEVBQUU7Z0JBQ1gsb0JBQW9CLEVBQUUsbUJBQVMsQ0FBQyxjQUFjLElBQUksRUFBRTtnQkFDcEQsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTzthQUMzQjtZQUNELElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQUMsQ0FBQztRQUNILDRCQUE0QjtRQUM1QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksZUFBSyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDeEMsV0FBVyxFQUFFLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxJQUFJO1NBQzlDLENBQUMsQ0FBQztRQUVILGdDQUFnQztRQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLDBDQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQztDQUNGO0FBaENELHNEQWdDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5lc3RlZFN0YWNrLCBOZXN0ZWRTdGFja1Byb3BzIH0gZnJvbSBcImF3cy1jZGstbGliXCI7XHJcbmltcG9ydCB7IE1hbmFnZWRQb2xpY3ksIFJvbGUsIFNlcnZpY2VQcmluY2lwYWwgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xyXG5pbXBvcnQgeyBUb3BpYyB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtc25zXCI7XHJcbmltcG9ydCB7IENvZGUsIEZ1bmN0aW9uLCBSdW50aW1lIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1sYW1iZGFcIjtcclxuaW1wb3J0IHsgTGFtYmRhU3Vic2NyaXB0aW9uIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1zbnMtc3Vic2NyaXB0aW9uc1wiO1xyXG5pbXBvcnQgeyBfU0VUVElOR1MgfSBmcm9tIFwiLi4vX2NvbmZpZ1wiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDZGtMYW1iZGFNc1RlYW1zU3RhY2tQcm9wcyBleHRlbmRzIE5lc3RlZFN0YWNrUHJvcHMge1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBlbnY6IHsgcmVnaW9uOiBzdHJpbmc7IGFjY291bnQ6IHN0cmluZyB9O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ2RrTGFtYmRhTXNUZWFtc1N0YWNrIGV4dGVuZHMgTmVzdGVkU3RhY2sge1xyXG4gIHB1YmxpYyB0b3BpYzogVG9waWM7XHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGFueSwgaWQ6IHN0cmluZywgcHJvcHM6IENka0xhbWJkYU1zVGVhbXNTdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICBjb25zdCBsYW1iZGFyb2xlID0gbmV3IFJvbGUodGhpcywgXCJMYW1iZGFEeW5hbW9EQlJvbGUtXCIgKyBwcm9wcy5uYW1lLCB7XHJcbiAgICAgIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoXCJsYW1iZGEuYW1hem9uYXdzLmNvbVwiKSxcclxuICAgICAgcm9sZU5hbWU6IFwiTGFtYmRhTVNUZWFtc0Nvbm5lY3RvclJvbGUtXCIgKyBwcm9wcy5uYW1lLFxyXG4gICAgfSk7XHJcbiAgICBsYW1iZGFyb2xlLmFkZE1hbmFnZWRQb2xpY3koTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXCJDbG91ZFdhdGNoRnVsbEFjY2Vzc1wiKSk7XHJcblxyXG4gICAgY29uc3QgaGFuZGxlciA9IG5ldyBGdW5jdGlvbih0aGlzLCBcIk1TVGVhbUNvbm5lY3RvckhhbmRsZXItXCIgKyBwcm9wcy5uYW1lLCB7XHJcbiAgICAgIGZ1bmN0aW9uTmFtZTogXCJNU1RlYW1Db25uZWN0b3JMYW1iZGEtXCIgKyBwcm9wcy5uYW1lLFxyXG4gICAgICBydW50aW1lOiBSdW50aW1lLk5PREVKU18xNF9YLFxyXG4gICAgICBjb2RlOiBDb2RlLmZyb21Bc3NldChcIi4vc3JjL21zdGVhbXNcIiwge1xyXG4gICAgICAgIGV4Y2x1ZGU6IFtcImNka1wiLCBcIioudHNcIl0sXHJcbiAgICAgIH0pLFxyXG4gICAgICBoYW5kbGVyOiBcIm1zdGVhbXMuaGFuZGxlclwiLFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIE1TX1RFQU1TX1dFQkhPT0tfVVJMOiBfU0VUVElOR1MubXNUZWFtc1dlYmhvb2sgfHwgXCJcIixcclxuICAgICAgICBBQ0NPVU5UOiBwcm9wcy5lbnYuYWNjb3VudCxcclxuICAgICAgfSxcclxuICAgICAgcm9sZTogbGFtYmRhcm9sZSxcclxuICAgIH0pO1xyXG4gICAgLy8gQ3JlYXRlIFN0YW5kYXJkIFNOUyBUb3BpY1xyXG4gICAgdGhpcy50b3BpYyA9IG5ldyBUb3BpYyh0aGlzLCBcInNucy10b3BpY1wiLCB7XHJcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkxhbWJkYSBTTlMgVG9waWMtXCIgKyBwcm9wcy5uYW1lLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU3Vic2NyaWJlIExhbWJkYSB0byBTTlMgdG9waWNcclxuICAgIHRoaXMudG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBMYW1iZGFTdWJzY3JpcHRpb24oaGFuZGxlcikpO1xyXG4gIH1cclxufVxyXG4iXX0=
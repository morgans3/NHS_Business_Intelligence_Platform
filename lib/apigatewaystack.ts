import { CfnOutput, Stack } from "aws-cdk-lib";
import { Cors, RestApi, SecurityPolicy } from "aws-cdk-lib/aws-apigateway";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ApiGatewayStackProps } from "./types/interfaces";

export class ApiGatewayStack extends Stack {
  public apigateway: RestApi;
  constructor(scope: any, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const sslcert = new Certificate(this, "SSLCertificate", {
      domainName: props.domainName,
    });

    this.apigateway = new RestApi(this, "BIPlatform-api-gateway", {
      restApiName: "API Services",
      description: "This service is for secured Serverless routes using RESTful methods to and from the BI Platform databases.",
      deploy: true,
      domainName: {
        domainName: props.domainName,
        certificate: sslcert,
        securityPolicy: SecurityPolicy.TLS_1_2,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent", "access-control-allow-origin", "Cache-Control", "Pragma"],
      },
    });

    new CfnOutput(this, "API-Gateway-RestAPIID", { value: this.apigateway.restApiId });
    new CfnOutput(this, "API-Gateway-restApiRootResourceId", { value: this.apigateway.restApiRootResourceId });
  }
}

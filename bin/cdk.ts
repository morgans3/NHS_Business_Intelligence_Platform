#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfrastructureStack } from "../lib/infrastack";
import { _ACCOUNT, _AWSREGION, _MYDOMAIN, _PLATFORMAPP, _SETTINGS } from "../lib/_config";
import { DynamoDBStack } from "../lib/dynamodbstack";
import { SQLStack } from "../lib/sqlstack";
import { ContainerStack } from "../lib/containerstack";
import { AppStack } from "../lib/appstack";
import { IAMStack } from "../lib/iamstack";
import { LambdaAuthorizers } from "../lib/authorizers";
import { getSecret } from "../authentication/_functions";
import { ApiGatewayStack } from "../lib/apigatewaystack";

const env = { account: _ACCOUNT, region: _AWSREGION };

getSecret("jwt", (data: any) => {
  if (!data) {
    console.log("Unable to fetch secret for JWT Authorizer");
    return;
  }
  const jwtCredentials = JSON.parse(data);

  const app = new cdk.App();

  const iams = new IAMStack(app, "IAMStack", { env });
  cdk.Tags.of(iams).add("IAC.Module", "IAMStack");

  const infrastructure = new InfrastructureStack(app, "InfrastructureStack", { env });
  cdk.Tags.of(infrastructure).add("IAC.Module", "InfrastructureStack");

  const lambdaAuthorizers = new LambdaAuthorizers(app, "LambdaAuthorizers", {
    env,
    name: "AuthStack",
    JWTSECRET: jwtCredentials.secret,
  });
  cdk.Tags.of(lambdaAuthorizers).add("IAC.Module", "LambdaAuthorizers");

  const apigatewayStack = new ApiGatewayStack(app, "ApiGatewayStack", { env, domainName: _MYDOMAIN });
  cdk.Tags.of(apigatewayStack).add("IAC.Module", "ApiGatewayStack");

  const dynamodbStack = new DynamoDBStack(app, "DynamoDBStack", {
    env,
    authLambda: lambdaAuthorizers.authorizer,
    publicLambda: lambdaAuthorizers.publicAuthorizer,
    lambdarole: iams.databaseRole,
    apigateway: apigatewayStack.apigateway,
    addCors: true,
  });
  cdk.Tags.of(dynamodbStack).add("IAC.Module", "DynamoDBStack");

  const rdsStack = new SQLStack(app, "SQLStack", {
    env,
    infrastructure,
    authLambda: lambdaAuthorizers.authorizer,
    publicLambda: lambdaAuthorizers.publicAuthorizer,
    lambdarole: iams.databaseRole,
    apigateway: apigatewayStack.apigateway,
    addCors: true,
  });
  cdk.Tags.of(rdsStack).add("IAC.Module", "SQLStack");

  const containerStack = new ContainerStack(app, "ContainerStack", { env });
  cdk.Tags.of(containerStack).add("IAC.Module", "ContainerStack");

  const platformApp = new AppStack(app, "PlatformAppStack", {
    env,
    appname: "BI_Platform",
    domainName: _MYDOMAIN,
    siteSubDomain: "www",
    application: _PLATFORMAPP,
    webACLId: "", // TODO: add WAF Id
    codebuildRole: iams.codebuildRole,
  });
  cdk.Tags.of(platformApp).add("IAC.Module", "AppStack");

  // TODO: add required apis to containerStack

  // TODO: add selected optional apps & apis based on config

  // Global Tags
  cdk.Tags.of(app).add("Author", "https://github.com/morgans3");
  cdk.Tags.of(app).add("Component.Docs", "https://github.com/morgans3/NHS_Business_Intelligence_Platform");
  cdk.Tags.of(app).add("Component.Version", "Latest");
  cdk.Tags.of(app).add("IAC.Repository", "NHS_Business_Intelligence_Platform");
});

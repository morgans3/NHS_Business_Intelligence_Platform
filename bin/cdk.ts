#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfrastructureStack } from "../lib/infrastack";
import { _ACCOUNT, _AWSREGION, _MYDOMAIN, _PLATFORMAPP } from "../lib/_config";
import { DynamoDBStack } from "../lib/dynamodbstack";
import { SQLStack } from "../lib/sqlstack";
import { ContainerStack } from "../lib/containerstack";
import { AppStack } from "../lib/appstack";
import { IAMStack } from "../lib/iamstack";

const env = { account: _ACCOUNT, region: _AWSREGION };
const app = new cdk.App();

const iams = new IAMStack(app, "IAMStack", { env });
cdk.Tags.of(iams).add("IAC.Module", "IAMStack");

const infrastructure = new InfrastructureStack(app, "InfrastructureStack", { env });
cdk.Tags.of(infrastructure).add("IAC.Module", "InfrastructureStack");

const dynamodbStack = new DynamoDBStack(app, "DynamoDBStack", { env });
cdk.Tags.of(dynamodbStack).add("IAC.Module", "DynamoDBStack");

const rdsStack = new SQLStack(app, "SQLStack", { env, infrastructure });
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

// Global Tags
cdk.Tags.of(app).add("Author", "https://github.com/morgans3");
cdk.Tags.of(app).add("Component.Docs", "https://github.com/morgans3/NHS_Business_Intelligence_Platform");
cdk.Tags.of(app).add("Component.Version", "Latest");
cdk.Tags.of(app).add("IAC.Repository", "NHS_Business_Intelligence_Platform");

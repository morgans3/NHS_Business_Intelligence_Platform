#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkStack } from "../lib/cdk-stack";
import { _ACCOUNT, _AWSREGION } from "../lib/_config";

const env = { account: _ACCOUNT, region: _AWSREGION };
const app = new cdk.App();
new CdkStack(app, "CdkStack", { env });

// Global Tags
cdk.Tags.of(app).add("Author", "https://github.com/morgans3");
cdk.Tags.of(app).add("Component.Docs", "https://github.com/morgans3/NHS_Business_Intelligence_Platform");
cdk.Tags.of(app).add("Component.Version", "Latest");
cdk.Tags.of(app).add("IAC.Repository", "NHS_Business_Intelligence_Platform");
cdk.Tags.of(app).add("IAC.Module", "CdkStack");

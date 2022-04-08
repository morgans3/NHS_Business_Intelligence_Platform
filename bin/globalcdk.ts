import * as cdk from "aws-cdk-lib";
import { _ACCOUNT, _AWSREGION, _MYDOMAIN, _PLATFORMAPP, _SETTINGS } from "../lib/_config";
import { WAFStack } from "../lib/wafstack";

const envGlobal = { account: _ACCOUNT, region: "us-east-1" };
const app = new cdk.App();

const waf = new WAFStack(app, "GlobalWAFStack", { name: "WAFStack", scope: "CLOUDFRONT", env: envGlobal });
cdk.Tags.of(waf).add("IAC.Module", "WAFStack");

// Global Tags
cdk.Tags.of(app).add("Author", "https://github.com/morgans3");
cdk.Tags.of(app).add("Component.Docs", "https://github.com/morgans3/NHS_Business_Intelligence_Platform");
cdk.Tags.of(app).add("Component.Version", "Latest");
cdk.Tags.of(app).add("IAC.Repository", "NHS_Business_Intelligence_Platform");

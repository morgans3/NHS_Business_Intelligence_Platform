import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { AwsCustomResource, AwsSdkCall } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

const crypto = require("crypto");
const AWS = (module.exports.AWS = require("aws-sdk"));
AWS.config.update({
  region: process.env.CDK_DEFAULT_REGION || "eu-west-2",
});
let access = process.env.AWSPROFILE || "default";
const credentials = new AWS.SharedIniFileCredentials({ profile: access });
AWS.config.credentials = credentials;
const secretsmanager = new AWS.SecretsManager();

export const cleanseBucketName = function (original: string): string {
  return original.split("_").join("-").split(".").join("-").toLowerCase();
};

export const generateSecrets = function (name: string, keyA: string, keyB: string, valueA: string, valueB: string, callback: any) {
  let secretstring = `{\"` + keyA + `\":\"` + valueA + `\"}`;
  if (keyB.length > 0) {
    secretstring = `{\"` + keyA + `\":\"` + valueA + `\",\"` + keyB + `\":\"` + valueB + `\"}`;
  }
  const params = {
    Description: "Adding secrets for CDK deployment: " + name,
    Name: name,
    SecretString: secretstring,
  };
  secretsmanager.createSecret(params, (err: any, data: any) => {
    if (err) callback("FAILED: " + err.toString());
    else callback("Secret generated.");
  });
};

export const checkSecretExists = function (name: string, callback: any) {
  const params = {
    SecretId: name,
  };
  secretsmanager.describeSecret(params, (err: any, data: any) => {
    if (err) {
      console.log(err);
      callback(false);
    } else {
      if (data && data.ARN) callback(true);
      callback(false);
    }
  });
};

export const generatePassword = function (length: number, wishlist: string) {
  return Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x: any) => wishlist[x % wishlist.length])
    .join("");
};

export async function getSecret(secretName: string, callback: (arg: any) => void) {
  let client = new AWS.SecretsManager();
  await client.getSecretValue({ SecretId: secretName }, (err: any, data: any) => {
    if (err) {
      callback(null);
    } else {
      if ("SecretString" in data) {
        callback(data.SecretString);
      } else {
        callback(Buffer.from(data.SecretBinary, "base64").toString("ascii"));
      }
    }
  });
}

interface SSMParameterReaderProps {
  parameterName: string;
  region: string;
}

export class SSMParameterReader extends AwsCustomResource {
  constructor(scope: Construct, name: string, props: SSMParameterReaderProps) {
    const { parameterName, region } = props;

    const ssmAwsSdkCall: AwsSdkCall = {
      service: "SSM",
      action: "getParameter",
      parameters: {
        Name: parameterName,
      },
      region,
      physicalResourceId: { id: Date.now().toString() },
    };

    super(scope, name, {
      onUpdate: ssmAwsSdkCall,
      policy: {
        statements: [
          new PolicyStatement({
            resources: ["*"],
            actions: ["ssm:GetParameter"],
            effect: Effect.ALLOW,
          }),
        ],
      },
    });
  }

  public getParameterValue(): string {
    return this.getResponseField("Parameter.Value").toString();
  }
}

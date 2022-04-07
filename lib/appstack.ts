import { CfnOutput, Duration, RemovalPolicy, SecretValue, Stack } from "aws-cdk-lib";
import { Certificate, DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import { CloudFrontWebDistribution, OriginProtocolPolicy, SecurityPolicyProtocol, SSLMethod, ViewerCertificate } from "aws-cdk-lib/aws-cloudfront";
import { BuildSpec, ComputeType, LinuxBuildImage, PipelineProject } from "aws-cdk-lib/aws-codebuild";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { CodeBuildAction, GitHubSourceAction, GitHubTrigger, S3DeployAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { ARecord, HostedZone, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { cleanseBucketName } from "../authentication/_functions";
import { StaticSiteProps } from "./types/interfaces";
import { WAFStack } from "./wafstack";
import { _SETTINGS } from "./_config";

export class AppStack extends Stack {
  constructor(scope: any, id: string, props: StaticSiteProps) {
    super(scope, id, props);

    const siteDomain = props.siteSubDomain + "." + props.domainName;
    new CfnOutput(this, props.appname + "-Site", { value: "https://" + siteDomain });

    // Content bucket
    const siteBucket = new Bucket(this, props.appname + "-SiteBucket", {
      bucketName: cleanseBucketName(props.application.repo + "-" + props.application.name + "-bucket"),
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      publicReadAccess: true,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [HttpMethods.GET],
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
    });
    new CfnOutput(this, props.appname + "-Bucket", { value: siteBucket.bucketName });

    let cert, zone: IHostedZone;
    if (_SETTINGS.manageDNS) {
      zone = HostedZone.fromLookup(this, props.appname + "-Zone", { domainName: props.domainName });
      // TLS certificate
      cert = new DnsValidatedCertificate(this, props.appname + "-SiteCertificate", {
        domainName: siteDomain,
        hostedZone: zone,
        region: "us-east-1", // Cloudfront only checks this region for certificates.
      });
      new CfnOutput(this, props.appname + "-Certificate", { value: cert.certificateArn });
    } else {
      cert = new Certificate(this, props.appname + "-SiteCertificate", { domainName: siteDomain });
    }

    let wafArn: string = props.webACLId || "";
    if (!props.webACLId) {
      const waf = new WAFStack(this, props.appname + "-WAF", { name: props.appname + "-WAF" });
      wafArn = waf.attrId;
    }

    // CloudFront distribution that provides HTTPS
    const distribution = new CloudFrontWebDistribution(this, props.appname + "-SiteDistribution", {
      viewerCertificate: ViewerCertificate.fromAcmCertificate(cert, {
        aliases: [siteDomain],
        securityPolicy: SecurityPolicyProtocol.SSL_V3,
        sslMethod: SSLMethod.SNI,
      }),
      originConfigs: [
        {
          customOriginSource: {
            domainName: siteBucket.bucketWebsiteDomainName,
            originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      webACLId: wafArn,
    });
    new CfnOutput(this, props.appname + "-DistributionId", { value: distribution.distributionId });

    // Route53 alias record for the CloudFront distribution
    if (_SETTINGS.manageDNS) {
      new ARecord(this, props.appname + "-SiteAliasRecord", {
        recordName: siteDomain,
        target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        zone: zone!,
      });
    }

    const buildSpecObject = {
      version: "0.2",
      phases: {
        install: {
          commands: "npm install",
        },
        build: {
          commands: ["npm run build-prod"],
        },
      },
      artifacts: {
        "base-directory": "dist",
        files: "**/*",
      },
    };

    const build = new PipelineProject(this, props.application.name + "-Build", {
      buildSpec: BuildSpec.fromObject(buildSpecObject),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_3_0,
        privileged: true,
        computeType: ComputeType.SMALL,
      },
      timeout: Duration.minutes(10),
      projectName: props.application.name + "-Build",
      role: props.codebuildRole,
    });

    // Deploy site contents to S3 bucket
    const sourceOutput = new Artifact();
    const buildOutput = new Artifact();
    new Pipeline(this, "Pipeline", {
      pipelineName: props.application.name + "-Pipeline",
      stages: [
        {
          stageName: "Source",
          actions: [
            new GitHubSourceAction({
              actionName: "CodeCommit_Source",
              branch: props.application.branch,
              output: sourceOutput,
              repo: props.application.repo,
              owner: props.application.owner,
              oauthToken: SecretValue.secretsManager("github", {
                jsonField: "oauthToken",
              }),
              trigger: GitHubTrigger.WEBHOOK,
            }),
          ],
        },
        {
          stageName: "Build",
          actions: [
            new CodeBuildAction({
              actionName: "Build",
              project: build,
              input: sourceOutput,
              outputs: [buildOutput],
              role: props.codebuildRole,
            }),
          ],
        },
        {
          stageName: "Deploy",
          actions: [
            new S3DeployAction({
              actionName: "S3_Deploy",
              bucket: siteBucket,
              input: buildOutput,
              role: props.codebuildRole,
            }),
          ],
        },
      ],
      restartExecutionOnUpdate: true,
    });
  }
}

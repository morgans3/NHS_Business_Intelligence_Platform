import { Duration, SecretValue, Stack } from "aws-cdk-lib";
import { BuildSpec, ComputeType, LinuxBuildImage, PipelineProject } from "aws-cdk-lib/aws-codebuild";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { CodeBuildAction, EcsDeployAction, GitHubSourceAction, GitHubTrigger } from "aws-cdk-lib/aws-codepipeline-actions";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { ArnPrincipal, Effect, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { ApiStackProps } from "./types/interfaces";
import { _SETTINGS } from "./_config";

export class ApiStack extends Stack {
  constructor(scope: any, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const siteDomain = props.siteSubDomain + "." + props.domainName;
    const role = Role.fromRoleArn(this, "ApiStackRoleFromArn" + props.siteSubDomain, props.codebuildRole.roleArn, { mutable: false });
    const repository = new Repository(this, "ECR-Repository-" + props.apiname, { repositoryName: props.apiname });
    repository.addLifecycleRule({ tagPrefixList: ["main"], maxImageCount: 99 });
    repository.addLifecycleRule({ maxImageAge: Duration.days(30) });
    const statement = new PolicyStatement({
      effect: Effect.ALLOW,
      sid: "CDK Access",
      principals: [new ArnPrincipal(role.roleArn)],
      actions: ["ecr:BatchCheckLayerAvailability", "ecr:BatchGetImage", "ecr:DescribeImages", "ecr:DescribeRepositories", "ecr:GetDownloadUrlForLayer", "ecr:GetLifecyclePolicy", "ecr:GetLifecyclePolicyPreview", "ecr:GetRepositoryPolicy", "ecr:InitiateLayerUpload", "ecr:ListImages"],
    });
    repository.addToResourcePolicy(statement);

    let commandlist = [];
    if (_SETTINGS.dockerhub) {
      commandlist.push("docker login -u $dockerhub_username -p $dockerhub_password");
    }
    commandlist.push("docker build " + getBuildArgs(props.buildArgs) + " -t " + props.apiname + ":main .");
    const postbuildcommand = ["docker tag " + props.apiname + ":main " + props.env?.account + ".dkr.ecr.eu-west-2.amazonaws.com/" + props.apiname + ":main", "docker push " + props.env?.account + ".dkr.ecr.eu-west-2.amazonaws.com/" + props.apiname + ":main", `printf '[{"name":"` + props.apiname + `","imageUri":"" + props.env?.account + ".dkr.ecr.eu-west-2.amazonaws.com/` + props.apiname + `:main}]' > imagedefinitions.json`];

    const buildSpecObject = {
      version: "0.2",
      env: { "git-credential-helper": "yes" },
      phases: {
        install: {
          "runtime-versions": { docker: 18 },
          commands: "npm install",
        },
        pre_build: {
          commands: ["eval $(aws ecr get-login --no-include-email --region eu-west-2 --registry-ids " + props.env?.account + ")"],
        },
        build: {
          commands: commandlist,
        },
        post_build: {
          commands: postbuildcommand,
        },
      },
      artifacts: {
        files: "imagedefinitions.json",
      },
    };

    const build = new PipelineProject(this, props.application.name + "-Build", {
      role: role,
      buildSpec: BuildSpec.fromObject(buildSpecObject),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_3_0,
        privileged: true,
        computeType: ComputeType.SMALL,
      },
      timeout: Duration.minutes(10),
      projectName: props.application.name + "-Build",
      logging: {
        cloudWatch: {
          enabled: true,
          logGroup: new LogGroup(this, props.apiname + "-BuildLogGroup"),
        },
      },
    });

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
              role: role,
            }),
          ],
        },
        {
          stageName: "Deploy",
          actions: [
            new EcsDeployAction({
              actionName: "Deploy",
              input: buildOutput,
              service: props.service,
              role: role,
            }),
          ],
        },
      ],
      restartExecutionOnUpdate: true,
    });

    if (_SETTINGS.manageDNS) {
      const zone = HostedZone.fromLookup(this, props.apiname + "-Zone", { domainName: props.domainName });
      new ARecord(this, props.apiname + "-SiteAliasRecord", {
        recordName: siteDomain,
        target: RecordTarget.fromAlias(new LoadBalancerTarget(props.loadbalancer)),
        zone: zone!,
      });
    }
  }
}

function getBuildArgs(argArray: string[]) {
  let str = "";
  argArray.forEach((arg) => {
    str += "--build-arg " + arg + "=$" + arg + " ";
  });
  return str;
}

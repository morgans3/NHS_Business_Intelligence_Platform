import { StackProps } from "aws-cdk-lib";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { InfrastructureStack } from "../infrastack";
import { InstanceType } from "aws-cdk-lib/aws-ec2";
import { TokenAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { IRole } from "aws-cdk-lib/aws-iam";
import { IBaseService } from "aws-cdk-lib/aws-ecs";
import { ILoadBalancerV2 } from "aws-cdk-lib/aws-elasticloadbalancingv2";

export interface iSettings {
  containerIPs: string[];
  dockerhub?: any;
  manageDNS: boolean;
  rds_config: {
    username: string;
    instanceType: InstanceType;
    deletionProtection: boolean;
  };
  github: {
    oAuthToken: string;
  };
}

export interface DynamoDBStackProps extends StackProps {
  name: string;
  tab: DynamoDBConfig;
}

export interface DynamoDBConfig {
  name: string;
  fields: dynamodbfield[];
}

interface dynamodbfield {
  name: string;
  type: AttributeType;
  key: string;
}

export interface RDSStackProps extends StackProps {
  infrastructure: InfrastructureStack;
}

export interface StaticSiteProps extends StackProps {
  appname: string;
  domainName: string;
  siteSubDomain: string;
  application: iApplication;
  webACLId: string;
  codebuildRole: IRole;
}

export interface iApplication {
  repo: string;
  name: string;
  owner: string;
  branch: string;
}

export interface LambdaInfo {
  name: string;
  type: string;
  filename: string;
  functions: string[];
  primarykey?: fields;
  secondarykey?: fields;
  customfilters?: any;
  fields: fields[];
  tablename: string;
  baseendpoint: string;
  customAuth?: string;
}

interface fields {
  name: string;
  type: string;
  required?: boolean;
}

export interface ApiStackProps extends StackProps {
  apiname: string;
  domainName: string;
  siteSubDomain: string;
  application: any;
  codebuildRole: IRole;
  buildArgs: string[];
  service: IBaseService;
  loadbalancer: ILoadBalancerV2;
}

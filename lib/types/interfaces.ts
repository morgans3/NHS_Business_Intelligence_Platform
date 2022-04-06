import { StackProps } from "aws-cdk-lib";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { InfrastructureStack } from "../infrastack";
import { InstanceType } from "aws-cdk-lib/aws-ec2";
import { IRole, Role } from "aws-cdk-lib/aws-iam";
import { IBaseService } from "aws-cdk-lib/aws-ecs";
import { ILoadBalancerV2 } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Authorizer, RestApi } from "aws-cdk-lib/aws-apigateway";

export interface iSettings {
  containerIPs: string[];
  dockerhub?: any;
  manageDNS: boolean;
  existingVPC?: boolean;
  existingVPCID?: string;
  rds_config: {
    username: string;
    instanceType: InstanceType;
    deletionProtection: boolean;
  };
  github: {
    oAuthToken: string;
  };
}

export interface RDSStackProps extends StackProps {
  infrastructure: InfrastructureStack;
  lambdarole: Role;
  authLambda: Authorizer;
  publicLambda: Authorizer;
  apigateway: RestApi;
  addCors: boolean;
}

export interface DynamodbLambdaProps extends StackProps {
  lambdarole: any;
}

export interface StaticSiteProps extends StackProps {
  appname: string;
  domainName: string;
  siteSubDomain: string;
  application: iApplication;
  webACLId?: string;
  codebuildRole: IRole;
}

export interface iApplication {
  repo: string;
  name: string;
  owner: string;
  branch: string;
}

export interface DynamoDBStackProps extends StackProps {
  lambdarole: Role;
  authLambda: Authorizer;
  publicLambda: Authorizer;
  apigateway: RestApi;
  addCors: boolean;
}

export interface DynamoDBTableStackProps extends StackProps {
  primarykey: fields;
  secondarykey?: fields;
  tablename: string;
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
  application: iApplication;
  codebuildRole: IRole;
  buildArgs: string[];
  service: IBaseService;
  loadbalancer: ILoadBalancerV2;
}

export interface ApiProps {
  apiname: string;
  domainName: string;
  siteSubDomain: string;
  application: iApplication;
  buildArgs: string[];
}

export interface LambdaAuthorizersProps extends StackProps {
  name: string;
  JWTSECRET: string;
}

export interface ApiGatewayStackProps extends StackProps {
  domainName: string;
}

export interface LambdaPGInfo {
  name: string;
  filename: string;
  functions: pgFunction[];
  baseendpoint: string;
  customAuth?: string;
}

export interface pgFunction {
  method: string;
  methodType: string;
  queryString: string;
  params: any;
  handlermethod: string;
  role?: string;
  orderString?: string;
}

export interface PostgreSQLLambdaProps extends StackProps {
  lambdarole: Role;
}

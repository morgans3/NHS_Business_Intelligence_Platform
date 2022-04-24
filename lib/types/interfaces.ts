import { StackProps } from "aws-cdk-lib";
import { InfrastructureStack } from "../infrastack";
import { ISecurityGroup, IVpc, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { IRole, Role } from "aws-cdk-lib/aws-iam";
import { ICluster } from "aws-cdk-lib/aws-ecs";
import { Authorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Topic } from "aws-cdk-lib/aws-sns";

export interface iSettings {
  containerIPs: string[];
  dockerhub?: any;
  manageDNS: boolean;
  existingVPC?: boolean;
  existingVPCID?: string;
  existingSubnetIDs?: { ID: string; AZ: string; type: string }[];
  existingRDS?: boolean;
  existingRDSEndpoint?: string;
  newRDSConfig?: {
    username: string;
    instanceType: string;
    deletionProtection: boolean;
  };
  github: {
    oauthToken: string;
  };
  serversAlwaysOn: boolean;
  startHour?: string;
  stopHour?: string;
  ECSConfig: {
    minCapacity: number;
    maxCapacity: number;
    desiredCapacity: number;
  };
  domainName: string;
  sslCertificateId?: string;
  otherSecrets?: any[];
  sslCertificateArn?: string;
  msTeamsWebhook?: string;
}

export interface RDSStackProps extends StackProps {
  infrastructure: InfrastructureStack;
  // lambdarole: Role;
  // JWTSECRET: string;
  // authLambda: Authorizer;
  // publicLambda: Authorizer;
  // apigateway: RestApi;
  // addCors: boolean;
}

export interface DynamodbLambdaProps extends StackProps {
  lambdarole: any;
}

export interface StaticSiteProps extends StackProps {
  appname: string;
  domainName: string;
  siteSubDomain: string;
  application: iApplication;
  // webACLId: string;
  codebuildRole: IRole;
}

export interface iApplication {
  repo: string;
  name: string;
  owner: string;
  branch: string;
}

export interface DynamoDBStackProps extends StackProps {
  // lambdarole: string;
  // JWTSECRET: string;
  // authLambda: Authorizer;
  // publicLambda: Authorizer;
  // apigateway: RestApi;
  // addCors: boolean;
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

export interface ApiProps {
  apiname: string;
  domainName: string;
  siteSubDomain: string;
  application: iApplication;
  buildArgs: string[];
  variables: any;
  port?: number;
  minCapacity?: number;
  maxCapacity?: number;
  desired?: number;
  cpu?: number;
  memory?: number;
  leadInTime?: number;
  priority: number;
}

export interface LambdaAuthorizersProps extends StackProps {
  name: string;
  JWTSECRET: string;
  domainName: string;
  roleArn: string;
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

export interface ContainerStackProps extends StackProps {
  name: string;
  clusterVPC: IVpc;
  capacity: {
    min: number;
    max: number;
    desired: number;
  };
  range: { ID: string; AZ: string }[];
  domainName: string;
  codebuildRole: Role;
}

export interface LoadBalancerStackProps extends StackProps {
  name: string;
  vpc: IVpc;
  secGroup: SecurityGroup;
  cluster: ICluster;
  domainName: string;
}

export interface ContainerProps extends StackProps {
  application: iApplication;
  name: string;
  branch: string;
  buildArgs: string[];
  variables: any;
  port: number;
  memory: number;
  cluster: ICluster;
  secGroup: ISecurityGroup;
  cpu: number;
  desired: number;
  minCapacity: number;
  maxCapacity: number;
  subDomain: string;
  roleArn: string;
}

export interface WAFProps extends StackProps {
  apigateway?: RestApi;
  name: string;
  resourceArn?: string;
  scope?: string;
}

export interface ObservabilityProps {
  dashboardName: string;
  ECSCluster: string[];
}

export interface ServiceObservabilityProps {
  topic?: Topic;
  dashboardName: string;
  ECSEc2Service: iServiceDetails[];
}

export interface iServiceDetails {
  cluster: string;
  service: string;
}

import { StackProps } from "aws-cdk-lib";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { InfrastructureStack } from "../infrastack";
import { InstanceType } from "aws-cdk-lib/aws-ec2";

export interface iSettings {
  containerIPs: string[];
  dockerhub?: any;
  manageDNS: boolean;
  rds_config: {
    username: string;
    instanceType: InstanceType;
    deletionProtection: boolean;
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

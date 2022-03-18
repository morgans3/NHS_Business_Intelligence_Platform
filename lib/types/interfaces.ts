import { StackProps } from "aws-cdk-lib";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";

export interface iSettings {
  containerIPs: string[];
  dockerhub?: any;
  manageDNS: boolean;
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

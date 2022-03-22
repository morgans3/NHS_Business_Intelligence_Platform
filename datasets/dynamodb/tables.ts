import { LambdaInfo } from "../../lib/types/interfaces";
import { _Settings } from "../../src/dynamodb/dynamodb";

export const _RequiredTables: LambdaInfo[] = _Settings; // Table Map for DynamoDB is located in the Lambda function so that it can map HTTPS requests based on context.

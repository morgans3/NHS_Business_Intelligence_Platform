import { LambdaPGInfo } from "../../lib/types/interfaces";
import { _SQLSettings } from "../../src/postgresql/postgresql";

export const _RequiredSQLTables: LambdaPGInfo[] = _SQLSettings; // Table Map for Postgresql is located in the Lambda function so that it can map HTTPS requests based on context.

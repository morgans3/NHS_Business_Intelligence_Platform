import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { DynamoDBStackProps } from "./types/interfaces";
import { _SETTINGS } from "./_config";

export class DynamoDBStack extends Stack {
  constructor(scope: any, id: string, props?: any) {
    super(scope, id, props);

    // Create all tables (DynamoDBTable)

    // Create Lambda to manage Access Patterns

    // Create API Gateway with all endpoints and CORS (add WAFStack)

    if (_SETTINGS.manageDNS) {
      // Add Route 53 DNS records
    }
  }
}

export class DynamoDBTable extends Stack {
  public readonly dynamoTable: Table;

  constructor(scope: any, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    const primarykey = props.tab.fields.filter((x: any) => x.key === "primary");
    const secondarykey = props.tab.fields.filter((x: any) => x.key === "secondary");
    const partitionKey = { name: primarykey[0].name, type: primarykey[0].type };

    let sortKey = undefined;
    if (secondarykey.length > 0) sortKey = { name: secondarykey[0].name, type: secondarykey[0].type };

    let TableProps = { partitionKey: partitionKey, tableName: props.tab.name + "-" + props.name, sortKey: sortKey, removalPolicy: RemovalPolicy.DESTROY, billingMode: BillingMode.PAY_PER_REQUEST };

    this.dynamoTable = new Table(this, props.tab.name + "-items-" + props.name, TableProps);
  }
}

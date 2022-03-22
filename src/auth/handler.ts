const jwt = require("jsonwebtoken");

exports.main = function (event: any, context: any) {
  try {
    var apiOptions: any = {};
    var tmp = event.methodArn.split(":");
    var apiGatewayArnTmp = tmp[5].split("/");
    var awsAccountId = tmp[4];
    apiOptions.region = tmp[3];
    apiOptions.restApiId = apiGatewayArnTmp[0];
    apiOptions.stage = apiGatewayArnTmp[1];

    const policy = new AuthPolicy(event.authorizationToken, awsAccountId, apiOptions);

    if (event["authorizationToken"] && validToken(event["authorizationToken"])) {
      policy.allowAllMethods();
    } else {
      context.fail("Unauthorized");
    }

    context.succeed(policy.build());
  } catch (ex) {
    console.log(ex, ex.stack);
    console.log("AUTHORIZATION--AUTHORIZER--MAIN--FAILED: " + event["authorizationToken"]);
    context.fail("Unauthorized");
  }
};

function validToken(token: string) {
  if (token.includes("JWT ")) {
    const jwtonly = token.replace("JWT ", "");
    try {
      const decoded = jwt.verify(jwtonly, process.env.SECRET);
      return true;
    } catch (ex) {
      console.log("AUTHORIZATION--AUTHORIZER--TOKENVERIFICATION--FAILED: " + token);
      return false;
    }
  }
  console.log("AUTHORIZATION--AUTHORIZER--TOKENVALIDATION--FAILED: " + token);
  return false;
}

export class AuthPolicy {
  /**
   * A set of existing HTTP verbs supported by API Gateway. This property is here
   * only to avoid spelling mistakes in the policy.
   *
   * @property HttpVerb
   * @type {Object}
   */
  public HttpVerb = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    HEAD: "HEAD",
    DELETE: "DELETE",
    OPTIONS: "OPTIONS",
    ALL: "*",
  };

  private readonly awsAccountId: string;
  private readonly principalId: string;
  private readonly version: string;
  private readonly pathRegex: RegExp;
  private readonly allowMethods: ApiMethod[];
  private readonly denyMethods: ApiMethod[];
  private readonly restApiId: string;
  private readonly region: string;
  private readonly stage: string;

  constructor(principal: string, awsAccountId: string, apiOptions?: ApiOptions) {
    /**
     * The AWS account id the policy will be generated for. This is used to create
     * the method ARNs.
     *
     * @property awsAccountId
     * @type {String}
     */
    this.awsAccountId = awsAccountId;

    /**
     * The principal used for the policy, this should be a unique identifier for
     * the end user.
     *
     * @property principalId
     * @type {String}
     */
    this.principalId = principal;

    /**
     * The policy version used for the evaluation. This should always be "2012-10-17"
     *
     * @property version
     * @type {String}
     * @default "2012-10-17"
     */
    this.version = "2012-10-17";

    /**
     * The regular expression used to validate resource paths for the policy
     *
     * @property pathRegex
     * @type {RegExp}
     * @default '^\/[/.a-zA-Z0-9-\*]+$'
     */
    this.pathRegex = new RegExp("^[/.a-zA-Z0-9-*]+$");

    // these are the internal lists of allowed and denied methods. These are lists
    // of objects and each object has 2 properties: A resource ARN and a nullable
    // conditions statement.
    // the build method processes these lists and generates the approriate
    // statements for the final policy
    this.allowMethods = [];
    this.denyMethods = [];

    if (!apiOptions || !apiOptions.restApiId) {
      this.restApiId = "*";
    } else {
      this.restApiId = apiOptions.restApiId;
    }
    if (!apiOptions || !apiOptions.region) {
      this.region = "*";
    } else {
      this.region = apiOptions.region;
    }
    if (!apiOptions || !apiOptions.stage) {
      this.stage = "*";
    } else {
      this.stage = apiOptions.stage;
    }
  }

  /**
   * Adds an allow "*" statement to the policy.
   *
   * @method allowAllMethods
   */
  public allowAllMethods = () => {
    this.addMethod.call(this, "allow", "*", "*", null);
  };

  /**
   * Adds a deny "*" statement to the policy.
   *
   * @method denyAllMethods
   */
  public denyAllMethods = () => {
    this.addMethod.call(this, "deny", "*", "*", null);
  };

  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
   * methods for the policy
   *
   * @method allowMethod
   * @param verb {String} The HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param resource {string} The resource path. For example "/pets"
   * @return {void}
   */
  public allowMethod = (verb: string, resource: string) => {
    this.addMethod.call(this, "allow", verb, resource, null);
  };

  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of denied
   * methods for the policy
   *
   * @method denyMethod
   * @param verb {String} The HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param resource {string} The resource path. For example "/pets"
   * @return {void}
   */
  public denyMethod = (verb: string, resource: string) => {
    this.addMethod.call(this, "deny", verb, resource, null);
  };

  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
   * methods and includes a condition for the policy statement. More on AWS policy
   * conditions here: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html
   *
   * @method allowMethodWithConditions
   * @param verb {String} The HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param resource {string} The resource path. For example "/pets"
   * @param conditions {Object} The conditions object in the format specified by the AWS docs
   * @return {void}
   */
  public allowMethodWithConditions = (verb: string, resource: string, conditions: any) => {
    this.addMethod.call(this, "allow", verb, resource, conditions);
  };

  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of denied
   * methods and includes a condition for the policy statement. More on AWS policy
   * conditions here: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html
   *
   * @method denyMethodWithConditions
   * @param verb {String} The HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param resource {string} The resource path. For example "/pets"
   * @param conditions {Object} The conditions object in the format specified by the AWS docs
   * @return {void}
   */
  public denyMethodWithConditions = (verb: string, resource: string, conditions: any) => {
    this.addMethod.call(this, "deny", verb, resource, conditions);
  };

  /**
   * Generates the policy document based on the internal lists of allowed and denied
   * conditions. This will generate a policy with two main statements for the effect:
   * one statement for Allow and one statement for Deny.
   * Methods that includes conditions will have their own statement in the policy.
   *
   * @method build
   * @return {Object} The policy object that can be serialized to JSON.
   */
  public build = () => {
    if ((!this.allowMethods || this.allowMethods.length === 0) && (!this.denyMethods || this.denyMethods.length === 0)) {
      throw new Error("No statements defined for the policy");
    }

    const policy: any = {};
    policy.principalId = this.principalId;
    const doc: any = {};
    doc.Version = this.version;
    doc.Statement = [];

    doc.Statement = doc.Statement.concat(this.getStatementsForEffect.call(this, "Allow", this.allowMethods));
    doc.Statement = doc.Statement.concat(this.getStatementsForEffect.call(this, "Deny", this.denyMethods));

    policy.policyDocument = doc;

    return policy;
  };

  /**
   * Adds a method to the internal lists of allowed or denied methods. Each object in
   * the internal list contains a resource ARN and a condition statement. The condition
   * statement can be null.
   *
   * @method addMethod
   * @param effect {String} The effect for the policy. This can only be "Allow" or "Deny".
   * @param verb {String} he HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param resource {String} The resource path. For example "/pets"
   * @param conditions {Object} The conditions object in the format specified by the AWS docs.
   * @return {void}
   */
  private addMethod = (effect: string, verb: string, resource: string, conditions: any) => {
    if (verb !== "*" && !this.HttpVerb.hasOwnProperty(verb)) {
      throw new Error("Invalid HTTP verb " + verb + ". Allowed verbs in AuthPolicy.HttpVerb");
    }

    if (!this.pathRegex.test(resource)) {
      throw new Error("Invalid resource path: " + resource + ". Path should match " + this.pathRegex);
    }

    let cleanedResource = resource;
    if (resource.substring(0, 1) === "/") {
      cleanedResource = resource.substring(1, resource.length);
    }
    const resourceArn = "arn:aws:execute-api:" + this.region + ":" + this.awsAccountId + ":" + this.restApiId + "/" + this.stage + "/" + verb + "/" + cleanedResource;

    if (effect.toLowerCase() === "allow") {
      this.allowMethods.push({
        resourceArn,
        conditions,
      });
    } else if (effect.toLowerCase() === "deny") {
      this.denyMethods.push({
        resourceArn,
        conditions,
      });
    }
  };

  /**
   * Returns an empty statement object prepopulated with the correct action and the
   * desired effect.
   *
   * @method getEmptyStatement
   * @param effect {String} The effect of the statement, this can be "Allow" or "Deny"
   * @return {Object} An empty statement object with the Action, Effect, and Resource
   *                  properties prepopulated.
   */
  private getEmptyStatement = (effect: string) => {
    effect = effect.substring(0, 1).toUpperCase() + effect.substring(1, effect.length).toLowerCase();
    const statement: any = {};
    statement.Action = "execute-api:Invoke";
    statement.Effect = effect;
    statement.Resource = [];

    return statement;
  };

  /**
   * This function loops over an array of objects containing a resourceArn and
   * conditions statement and generates the array of statements for the policy.
   *
   * @method getStatementsForEffect
   * @param effect {String} The desired effect. This can be "Allow" or "Deny"
   * @param methods {Array} An array of method objects containing the ARN of the resource
   *                and the conditions for the policy
   * @return {Array} an array of formatted statements for the policy.
   */
  private getStatementsForEffect = (effect: string, methods: ApiMethod[]) => {
    const statements = [];

    if (methods.length > 0) {
      const statement = this.getEmptyStatement(effect);

      for (const curMethod of methods) {
        if (curMethod.conditions === null || curMethod.conditions.length === 0) {
          statement.Resource.push(curMethod.resourceArn);
        } else {
          const conditionalStatement = this.getEmptyStatement(effect);
          conditionalStatement.Resource.push(curMethod.resourceArn);
          conditionalStatement.Condition = curMethod.conditions;
          statements.push(conditionalStatement);
        }
      }

      if (statement.Resource !== null && statement.Resource.length > 0) {
        statements.push(statement);
      }
    }

    return statements;
  };
}

interface ApiMethod {
  resourceArn: string;
  conditions?: any; //As per https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html
}

export interface ApiOptions {
  restApiId?: string;
  region?: string;
  stage?: string;
}

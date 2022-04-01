"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthPolicy = void 0;
const jwt = require("jsonwebtoken");
exports.main = function (event, context) {
    try {
        var apiOptions = {};
        var tmp = event.methodArn.split(":");
        var apiGatewayArnTmp = tmp[5].split("/");
        var awsAccountId = tmp[4];
        apiOptions.region = tmp[3];
        apiOptions.restApiId = apiGatewayArnTmp[0];
        apiOptions.stage = apiGatewayArnTmp[1];
        const policy = new AuthPolicy(event.authorizationToken, awsAccountId, apiOptions);
        if (event["authorizationToken"] && validToken(event["authorizationToken"])) {
            policy.allowAllMethods();
        }
        else {
            context.fail("Unauthorized");
        }
        context.succeed(policy.build());
    }
    catch (ex) {
        console.log(ex, ex.stack);
        console.log("AUTHORIZATION--AUTHORIZER--MAIN--FAILED: " + event["authorizationToken"]);
        context.fail("Unauthorized");
    }
};
function validToken(token) {
    if (token.includes("JWT ")) {
        const jwtonly = token.replace("JWT ", "");
        try {
            const decoded = jwt.verify(jwtonly, process.env.SECRET);
            return true;
        }
        catch (ex) {
            console.log("AUTHORIZATION--AUTHORIZER--TOKENVERIFICATION--FAILED: " + token);
            return false;
        }
    }
    console.log("AUTHORIZATION--AUTHORIZER--TOKENVALIDATION--FAILED: " + token);
    return false;
}
class AuthPolicy {
    constructor(principal, awsAccountId, apiOptions) {
        /**
         * A set of existing HTTP verbs supported by API Gateway. This property is here
         * only to avoid spelling mistakes in the policy.
         *
         * @property HttpVerb
         * @type {Object}
         */
        this.HttpVerb = {
            GET: "GET",
            POST: "POST",
            PUT: "PUT",
            PATCH: "PATCH",
            HEAD: "HEAD",
            DELETE: "DELETE",
            OPTIONS: "OPTIONS",
            ALL: "*",
        };
        /**
         * Adds an allow "*" statement to the policy.
         *
         * @method allowAllMethods
         */
        this.allowAllMethods = () => {
            this.addMethod.call(this, "allow", "*", "*", null);
        };
        /**
         * Adds a deny "*" statement to the policy.
         *
         * @method denyAllMethods
         */
        this.denyAllMethods = () => {
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
        this.allowMethod = (verb, resource) => {
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
        this.denyMethod = (verb, resource) => {
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
        this.allowMethodWithConditions = (verb, resource, conditions) => {
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
        this.denyMethodWithConditions = (verb, resource, conditions) => {
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
        this.build = () => {
            if ((!this.allowMethods || this.allowMethods.length === 0) && (!this.denyMethods || this.denyMethods.length === 0)) {
                throw new Error("No statements defined for the policy");
            }
            const policy = {};
            policy.principalId = this.principalId;
            const doc = {};
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
        this.addMethod = (effect, verb, resource, conditions) => {
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
            }
            else if (effect.toLowerCase() === "deny") {
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
        this.getEmptyStatement = (effect) => {
            effect = effect.substring(0, 1).toUpperCase() + effect.substring(1, effect.length).toLowerCase();
            const statement = {};
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
        this.getStatementsForEffect = (effect, methods) => {
            const statements = [];
            if (methods.length > 0) {
                const statement = this.getEmptyStatement(effect);
                for (const curMethod of methods) {
                    if (curMethod.conditions === null || curMethod.conditions.length === 0) {
                        statement.Resource.push(curMethod.resourceArn);
                    }
                    else {
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
        }
        else {
            this.restApiId = apiOptions.restApiId;
        }
        if (!apiOptions || !apiOptions.region) {
            this.region = "*";
        }
        else {
            this.region = apiOptions.region;
        }
        if (!apiOptions || !apiOptions.stage) {
            this.stage = "*";
        }
        else {
            this.stage = apiOptions.stage;
        }
    }
}
exports.AuthPolicy = AuthPolicy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXBDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsVUFBVSxLQUFVLEVBQUUsT0FBWTtJQUMvQyxJQUFJO1FBQ0YsSUFBSSxVQUFVLEdBQVEsRUFBRSxDQUFDO1FBQ3pCLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLElBQUksZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QyxJQUFJLFlBQVksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsVUFBVSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0IsVUFBVSxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQyxVQUFVLENBQUMsS0FBSyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXZDLE1BQU0sTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFbEYsSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRTtZQUMxRSxNQUFNLENBQUMsZUFBZSxFQUFFLENBQUM7U0FDMUI7YUFBTTtZQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDOUI7UUFFRCxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0tBQ2pDO0lBQUMsT0FBTyxFQUFF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QUNELElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO1lBQ3JDLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1NBQ25CO2FBQU07WUFDTCxJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7U0FDakM7UUFDRCxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRTtZQUNwQyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztTQUNsQjthQUFNO1lBQ0wsSUFBSSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1NBQy9CO0lBQ0gsQ0FBQztDQTBNRjtBQW5TRCxnQ0FtU0MiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBqd3QgPSByZXF1aXJlKFwianNvbndlYnRva2VuXCIpO1xyXG5cclxuZXhwb3J0cy5tYWluID0gZnVuY3Rpb24gKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSkge1xyXG4gIHRyeSB7XHJcbiAgICB2YXIgYXBpT3B0aW9uczogYW55ID0ge307XHJcbiAgICB2YXIgdG1wID0gZXZlbnQubWV0aG9kQXJuLnNwbGl0KFwiOlwiKTtcclxuICAgIHZhciBhcGlHYXRld2F5QXJuVG1wID0gdG1wWzVdLnNwbGl0KFwiL1wiKTtcclxuICAgIHZhciBhd3NBY2NvdW50SWQgPSB0bXBbNF07XHJcbiAgICBhcGlPcHRpb25zLnJlZ2lvbiA9IHRtcFszXTtcclxuICAgIGFwaU9wdGlvbnMucmVzdEFwaUlkID0gYXBpR2F0ZXdheUFyblRtcFswXTtcclxuICAgIGFwaU9wdGlvbnMuc3RhZ2UgPSBhcGlHYXRld2F5QXJuVG1wWzFdO1xyXG5cclxuICAgIGNvbnN0IHBvbGljeSA9IG5ldyBBdXRoUG9saWN5KGV2ZW50LmF1dGhvcml6YXRpb25Ub2tlbiwgYXdzQWNjb3VudElkLCBhcGlPcHRpb25zKTtcclxuXHJcbiAgICBpZiAoZXZlbnRbXCJhdXRob3JpemF0aW9uVG9rZW5cIl0gJiYgdmFsaWRUb2tlbihldmVudFtcImF1dGhvcml6YXRpb25Ub2tlblwiXSkpIHtcclxuICAgICAgcG9saWN5LmFsbG93QWxsTWV0aG9kcygpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29udGV4dC5mYWlsKFwiVW5hdXRob3JpemVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRleHQuc3VjY2VlZChwb2xpY3kuYnVpbGQoKSk7XHJcbiAgfSBjYXRjaCAoZXgpIHtcclxuICAgIGNvbnNvbGUubG9nKGV4LCBleC5zdGFjayk7XHJcbiAgICBjb25zb2xlLmxvZyhcIkFVVEhPUklaQVRJT04tLUFVVEhPUklaRVItLU1BSU4tLUZBSUxFRDogXCIgKyBldmVudFtcImF1dGhvcml6YXRpb25Ub2tlblwiXSk7XHJcbiAgICBjb250ZXh0LmZhaWwoXCJVbmF1dGhvcml6ZWRcIik7XHJcbiAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gdmFsaWRUb2tlbih0b2tlbjogc3RyaW5nKSB7XHJcbiAgaWYgKHRva2VuLmluY2x1ZGVzKFwiSldUIFwiKSkge1xyXG4gICAgY29uc3Qgand0b25seSA9IHRva2VuLnJlcGxhY2UoXCJKV1QgXCIsIFwiXCIpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGVjb2RlZCA9IGp3dC52ZXJpZnkoand0b25seSwgcHJvY2Vzcy5lbnYuU0VDUkVUKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIkFVVEhPUklaQVRJT04tLUFVVEhPUklaRVItLVRPS0VOVkVSSUZJQ0FUSU9OLS1GQUlMRUQ6IFwiICsgdG9rZW4pO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnNvbGUubG9nKFwiQVVUSE9SSVpBVElPTi0tQVVUSE9SSVpFUi0tVE9LRU5WQUxJREFUSU9OLS1GQUlMRUQ6IFwiICsgdG9rZW4pO1xyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEF1dGhQb2xpY3kge1xyXG4gIC8qKlxyXG4gICAqIEEgc2V0IG9mIGV4aXN0aW5nIEhUVFAgdmVyYnMgc3VwcG9ydGVkIGJ5IEFQSSBHYXRld2F5LiBUaGlzIHByb3BlcnR5IGlzIGhlcmVcclxuICAgKiBvbmx5IHRvIGF2b2lkIHNwZWxsaW5nIG1pc3Rha2VzIGluIHRoZSBwb2xpY3kuXHJcbiAgICpcclxuICAgKiBAcHJvcGVydHkgSHR0cFZlcmJcclxuICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAqL1xyXG4gIHB1YmxpYyBIdHRwVmVyYiA9IHtcclxuICAgIEdFVDogXCJHRVRcIixcclxuICAgIFBPU1Q6IFwiUE9TVFwiLFxyXG4gICAgUFVUOiBcIlBVVFwiLFxyXG4gICAgUEFUQ0g6IFwiUEFUQ0hcIixcclxuICAgIEhFQUQ6IFwiSEVBRFwiLFxyXG4gICAgREVMRVRFOiBcIkRFTEVURVwiLFxyXG4gICAgT1BUSU9OUzogXCJPUFRJT05TXCIsXHJcbiAgICBBTEw6IFwiKlwiLFxyXG4gIH07XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgYXdzQWNjb3VudElkOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBwcmluY2lwYWxJZDogc3RyaW5nO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgdmVyc2lvbjogc3RyaW5nO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgcGF0aFJlZ2V4OiBSZWdFeHA7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBhbGxvd01ldGhvZHM6IEFwaU1ldGhvZFtdO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGVueU1ldGhvZHM6IEFwaU1ldGhvZFtdO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgcmVzdEFwaUlkOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSByZWFkb25seSByZWdpb246IHN0cmluZztcclxuICBwcml2YXRlIHJlYWRvbmx5IHN0YWdlOiBzdHJpbmc7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaW5jaXBhbDogc3RyaW5nLCBhd3NBY2NvdW50SWQ6IHN0cmluZywgYXBpT3B0aW9ucz86IEFwaU9wdGlvbnMpIHtcclxuICAgIC8qKlxyXG4gICAgICogVGhlIEFXUyBhY2NvdW50IGlkIHRoZSBwb2xpY3kgd2lsbCBiZSBnZW5lcmF0ZWQgZm9yLiBUaGlzIGlzIHVzZWQgdG8gY3JlYXRlXHJcbiAgICAgKiB0aGUgbWV0aG9kIEFSTnMuXHJcbiAgICAgKlxyXG4gICAgICogQHByb3BlcnR5IGF3c0FjY291bnRJZFxyXG4gICAgICogQHR5cGUge1N0cmluZ31cclxuICAgICAqL1xyXG4gICAgdGhpcy5hd3NBY2NvdW50SWQgPSBhd3NBY2NvdW50SWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcHJpbmNpcGFsIHVzZWQgZm9yIHRoZSBwb2xpY3ksIHRoaXMgc2hvdWxkIGJlIGEgdW5pcXVlIGlkZW50aWZpZXIgZm9yXHJcbiAgICAgKiB0aGUgZW5kIHVzZXIuXHJcbiAgICAgKlxyXG4gICAgICogQHByb3BlcnR5IHByaW5jaXBhbElkXHJcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnByaW5jaXBhbElkID0gcHJpbmNpcGFsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHBvbGljeSB2ZXJzaW9uIHVzZWQgZm9yIHRoZSBldmFsdWF0aW9uLiBUaGlzIHNob3VsZCBhbHdheXMgYmUgXCIyMDEyLTEwLTE3XCJcclxuICAgICAqXHJcbiAgICAgKiBAcHJvcGVydHkgdmVyc2lvblxyXG4gICAgICogQHR5cGUge1N0cmluZ31cclxuICAgICAqIEBkZWZhdWx0IFwiMjAxMi0xMC0xN1wiXHJcbiAgICAgKi9cclxuICAgIHRoaXMudmVyc2lvbiA9IFwiMjAxMi0xMC0xN1wiO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHZhbGlkYXRlIHJlc291cmNlIHBhdGhzIGZvciB0aGUgcG9saWN5XHJcbiAgICAgKlxyXG4gICAgICogQHByb3BlcnR5IHBhdGhSZWdleFxyXG4gICAgICogQHR5cGUge1JlZ0V4cH1cclxuICAgICAqIEBkZWZhdWx0ICdeXFwvWy8uYS16QS1aMC05LVxcKl0rJCdcclxuICAgICAqL1xyXG4gICAgdGhpcy5wYXRoUmVnZXggPSBuZXcgUmVnRXhwKFwiXlsvLmEtekEtWjAtOS0qXSskXCIpO1xyXG5cclxuICAgIC8vIHRoZXNlIGFyZSB0aGUgaW50ZXJuYWwgbGlzdHMgb2YgYWxsb3dlZCBhbmQgZGVuaWVkIG1ldGhvZHMuIFRoZXNlIGFyZSBsaXN0c1xyXG4gICAgLy8gb2Ygb2JqZWN0cyBhbmQgZWFjaCBvYmplY3QgaGFzIDIgcHJvcGVydGllczogQSByZXNvdXJjZSBBUk4gYW5kIGEgbnVsbGFibGVcclxuICAgIC8vIGNvbmRpdGlvbnMgc3RhdGVtZW50LlxyXG4gICAgLy8gdGhlIGJ1aWxkIG1ldGhvZCBwcm9jZXNzZXMgdGhlc2UgbGlzdHMgYW5kIGdlbmVyYXRlcyB0aGUgYXBwcm9yaWF0ZVxyXG4gICAgLy8gc3RhdGVtZW50cyBmb3IgdGhlIGZpbmFsIHBvbGljeVxyXG4gICAgdGhpcy5hbGxvd01ldGhvZHMgPSBbXTtcclxuICAgIHRoaXMuZGVueU1ldGhvZHMgPSBbXTtcclxuXHJcbiAgICBpZiAoIWFwaU9wdGlvbnMgfHwgIWFwaU9wdGlvbnMucmVzdEFwaUlkKSB7XHJcbiAgICAgIHRoaXMucmVzdEFwaUlkID0gXCIqXCI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnJlc3RBcGlJZCA9IGFwaU9wdGlvbnMucmVzdEFwaUlkO1xyXG4gICAgfVxyXG4gICAgaWYgKCFhcGlPcHRpb25zIHx8ICFhcGlPcHRpb25zLnJlZ2lvbikge1xyXG4gICAgICB0aGlzLnJlZ2lvbiA9IFwiKlwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5yZWdpb24gPSBhcGlPcHRpb25zLnJlZ2lvbjtcclxuICAgIH1cclxuICAgIGlmICghYXBpT3B0aW9ucyB8fCAhYXBpT3B0aW9ucy5zdGFnZSkge1xyXG4gICAgICB0aGlzLnN0YWdlID0gXCIqXCI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnN0YWdlID0gYXBpT3B0aW9ucy5zdGFnZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gYWxsb3cgXCIqXCIgc3RhdGVtZW50IHRvIHRoZSBwb2xpY3kuXHJcbiAgICpcclxuICAgKiBAbWV0aG9kIGFsbG93QWxsTWV0aG9kc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBhbGxvd0FsbE1ldGhvZHMgPSAoKSA9PiB7XHJcbiAgICB0aGlzLmFkZE1ldGhvZC5jYWxsKHRoaXMsIFwiYWxsb3dcIiwgXCIqXCIsIFwiKlwiLCBudWxsKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgZGVueSBcIipcIiBzdGF0ZW1lbnQgdG8gdGhlIHBvbGljeS5cclxuICAgKlxyXG4gICAqIEBtZXRob2QgZGVueUFsbE1ldGhvZHNcclxuICAgKi9cclxuICBwdWJsaWMgZGVueUFsbE1ldGhvZHMgPSAoKSA9PiB7XHJcbiAgICB0aGlzLmFkZE1ldGhvZC5jYWxsKHRoaXMsIFwiZGVueVwiLCBcIipcIiwgXCIqXCIsIG51bGwpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gQVBJIEdhdGV3YXkgbWV0aG9kIChIdHRwIHZlcmIgKyBSZXNvdXJjZSBwYXRoKSB0byB0aGUgbGlzdCBvZiBhbGxvd2VkXHJcbiAgICogbWV0aG9kcyBmb3IgdGhlIHBvbGljeVxyXG4gICAqXHJcbiAgICogQG1ldGhvZCBhbGxvd01ldGhvZFxyXG4gICAqIEBwYXJhbSB2ZXJiIHtTdHJpbmd9IFRoZSBIVFRQIHZlcmIgZm9yIHRoZSBtZXRob2QsIHRoaXMgc2hvdWxkIGlkZWFsbHkgY29tZSBmcm9tIHRoZVxyXG4gICAqICAgICAgICAgICAgICAgICBBdXRoUG9saWN5Lkh0dHBWZXJiIG9iamVjdCB0byBhdm9pZCBzcGVsbGluZyBtaXN0YWtlc1xyXG4gICAqIEBwYXJhbSByZXNvdXJjZSB7c3RyaW5nfSBUaGUgcmVzb3VyY2UgcGF0aC4gRm9yIGV4YW1wbGUgXCIvcGV0c1wiXHJcbiAgICogQHJldHVybiB7dm9pZH1cclxuICAgKi9cclxuICBwdWJsaWMgYWxsb3dNZXRob2QgPSAodmVyYjogc3RyaW5nLCByZXNvdXJjZTogc3RyaW5nKSA9PiB7XHJcbiAgICB0aGlzLmFkZE1ldGhvZC5jYWxsKHRoaXMsIFwiYWxsb3dcIiwgdmVyYiwgcmVzb3VyY2UsIG51bGwpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gQVBJIEdhdGV3YXkgbWV0aG9kIChIdHRwIHZlcmIgKyBSZXNvdXJjZSBwYXRoKSB0byB0aGUgbGlzdCBvZiBkZW5pZWRcclxuICAgKiBtZXRob2RzIGZvciB0aGUgcG9saWN5XHJcbiAgICpcclxuICAgKiBAbWV0aG9kIGRlbnlNZXRob2RcclxuICAgKiBAcGFyYW0gdmVyYiB7U3RyaW5nfSBUaGUgSFRUUCB2ZXJiIGZvciB0aGUgbWV0aG9kLCB0aGlzIHNob3VsZCBpZGVhbGx5IGNvbWUgZnJvbSB0aGVcclxuICAgKiAgICAgICAgICAgICAgICAgQXV0aFBvbGljeS5IdHRwVmVyYiBvYmplY3QgdG8gYXZvaWQgc3BlbGxpbmcgbWlzdGFrZXNcclxuICAgKiBAcGFyYW0gcmVzb3VyY2Uge3N0cmluZ30gVGhlIHJlc291cmNlIHBhdGguIEZvciBleGFtcGxlIFwiL3BldHNcIlxyXG4gICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICovXHJcbiAgcHVibGljIGRlbnlNZXRob2QgPSAodmVyYjogc3RyaW5nLCByZXNvdXJjZTogc3RyaW5nKSA9PiB7XHJcbiAgICB0aGlzLmFkZE1ldGhvZC5jYWxsKHRoaXMsIFwiZGVueVwiLCB2ZXJiLCByZXNvdXJjZSwgbnVsbCk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBBUEkgR2F0ZXdheSBtZXRob2QgKEh0dHAgdmVyYiArIFJlc291cmNlIHBhdGgpIHRvIHRoZSBsaXN0IG9mIGFsbG93ZWRcclxuICAgKiBtZXRob2RzIGFuZCBpbmNsdWRlcyBhIGNvbmRpdGlvbiBmb3IgdGhlIHBvbGljeSBzdGF0ZW1lbnQuIE1vcmUgb24gQVdTIHBvbGljeVxyXG4gICAqIGNvbmRpdGlvbnMgaGVyZTogaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0lBTS9sYXRlc3QvVXNlckd1aWRlL3JlZmVyZW5jZV9wb2xpY2llc19lbGVtZW50c19jb25kaXRpb24uaHRtbFxyXG4gICAqXHJcbiAgICogQG1ldGhvZCBhbGxvd01ldGhvZFdpdGhDb25kaXRpb25zXHJcbiAgICogQHBhcmFtIHZlcmIge1N0cmluZ30gVGhlIEhUVFAgdmVyYiBmb3IgdGhlIG1ldGhvZCwgdGhpcyBzaG91bGQgaWRlYWxseSBjb21lIGZyb20gdGhlXHJcbiAgICogICAgICAgICAgICAgICAgIEF1dGhQb2xpY3kuSHR0cFZlcmIgb2JqZWN0IHRvIGF2b2lkIHNwZWxsaW5nIG1pc3Rha2VzXHJcbiAgICogQHBhcmFtIHJlc291cmNlIHtzdHJpbmd9IFRoZSByZXNvdXJjZSBwYXRoLiBGb3IgZXhhbXBsZSBcIi9wZXRzXCJcclxuICAgKiBAcGFyYW0gY29uZGl0aW9ucyB7T2JqZWN0fSBUaGUgY29uZGl0aW9ucyBvYmplY3QgaW4gdGhlIGZvcm1hdCBzcGVjaWZpZWQgYnkgdGhlIEFXUyBkb2NzXHJcbiAgICogQHJldHVybiB7dm9pZH1cclxuICAgKi9cclxuICBwdWJsaWMgYWxsb3dNZXRob2RXaXRoQ29uZGl0aW9ucyA9ICh2ZXJiOiBzdHJpbmcsIHJlc291cmNlOiBzdHJpbmcsIGNvbmRpdGlvbnM6IGFueSkgPT4ge1xyXG4gICAgdGhpcy5hZGRNZXRob2QuY2FsbCh0aGlzLCBcImFsbG93XCIsIHZlcmIsIHJlc291cmNlLCBjb25kaXRpb25zKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGFuIEFQSSBHYXRld2F5IG1ldGhvZCAoSHR0cCB2ZXJiICsgUmVzb3VyY2UgcGF0aCkgdG8gdGhlIGxpc3Qgb2YgZGVuaWVkXHJcbiAgICogbWV0aG9kcyBhbmQgaW5jbHVkZXMgYSBjb25kaXRpb24gZm9yIHRoZSBwb2xpY3kgc3RhdGVtZW50LiBNb3JlIG9uIEFXUyBwb2xpY3lcclxuICAgKiBjb25kaXRpb25zIGhlcmU6IGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9JQU0vbGF0ZXN0L1VzZXJHdWlkZS9yZWZlcmVuY2VfcG9saWNpZXNfZWxlbWVudHNfY29uZGl0aW9uLmh0bWxcclxuICAgKlxyXG4gICAqIEBtZXRob2QgZGVueU1ldGhvZFdpdGhDb25kaXRpb25zXHJcbiAgICogQHBhcmFtIHZlcmIge1N0cmluZ30gVGhlIEhUVFAgdmVyYiBmb3IgdGhlIG1ldGhvZCwgdGhpcyBzaG91bGQgaWRlYWxseSBjb21lIGZyb20gdGhlXHJcbiAgICogICAgICAgICAgICAgICAgIEF1dGhQb2xpY3kuSHR0cFZlcmIgb2JqZWN0IHRvIGF2b2lkIHNwZWxsaW5nIG1pc3Rha2VzXHJcbiAgICogQHBhcmFtIHJlc291cmNlIHtzdHJpbmd9IFRoZSByZXNvdXJjZSBwYXRoLiBGb3IgZXhhbXBsZSBcIi9wZXRzXCJcclxuICAgKiBAcGFyYW0gY29uZGl0aW9ucyB7T2JqZWN0fSBUaGUgY29uZGl0aW9ucyBvYmplY3QgaW4gdGhlIGZvcm1hdCBzcGVjaWZpZWQgYnkgdGhlIEFXUyBkb2NzXHJcbiAgICogQHJldHVybiB7dm9pZH1cclxuICAgKi9cclxuICBwdWJsaWMgZGVueU1ldGhvZFdpdGhDb25kaXRpb25zID0gKHZlcmI6IHN0cmluZywgcmVzb3VyY2U6IHN0cmluZywgY29uZGl0aW9uczogYW55KSA9PiB7XHJcbiAgICB0aGlzLmFkZE1ldGhvZC5jYWxsKHRoaXMsIFwiZGVueVwiLCB2ZXJiLCByZXNvdXJjZSwgY29uZGl0aW9ucyk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogR2VuZXJhdGVzIHRoZSBwb2xpY3kgZG9jdW1lbnQgYmFzZWQgb24gdGhlIGludGVybmFsIGxpc3RzIG9mIGFsbG93ZWQgYW5kIGRlbmllZFxyXG4gICAqIGNvbmRpdGlvbnMuIFRoaXMgd2lsbCBnZW5lcmF0ZSBhIHBvbGljeSB3aXRoIHR3byBtYWluIHN0YXRlbWVudHMgZm9yIHRoZSBlZmZlY3Q6XHJcbiAgICogb25lIHN0YXRlbWVudCBmb3IgQWxsb3cgYW5kIG9uZSBzdGF0ZW1lbnQgZm9yIERlbnkuXHJcbiAgICogTWV0aG9kcyB0aGF0IGluY2x1ZGVzIGNvbmRpdGlvbnMgd2lsbCBoYXZlIHRoZWlyIG93biBzdGF0ZW1lbnQgaW4gdGhlIHBvbGljeS5cclxuICAgKlxyXG4gICAqIEBtZXRob2QgYnVpbGRcclxuICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBwb2xpY3kgb2JqZWN0IHRoYXQgY2FuIGJlIHNlcmlhbGl6ZWQgdG8gSlNPTi5cclxuICAgKi9cclxuICBwdWJsaWMgYnVpbGQgPSAoKSA9PiB7XHJcbiAgICBpZiAoKCF0aGlzLmFsbG93TWV0aG9kcyB8fCB0aGlzLmFsbG93TWV0aG9kcy5sZW5ndGggPT09IDApICYmICghdGhpcy5kZW55TWV0aG9kcyB8fCB0aGlzLmRlbnlNZXRob2RzLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gc3RhdGVtZW50cyBkZWZpbmVkIGZvciB0aGUgcG9saWN5XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBvbGljeTogYW55ID0ge307XHJcbiAgICBwb2xpY3kucHJpbmNpcGFsSWQgPSB0aGlzLnByaW5jaXBhbElkO1xyXG4gICAgY29uc3QgZG9jOiBhbnkgPSB7fTtcclxuICAgIGRvYy5WZXJzaW9uID0gdGhpcy52ZXJzaW9uO1xyXG4gICAgZG9jLlN0YXRlbWVudCA9IFtdO1xyXG5cclxuICAgIGRvYy5TdGF0ZW1lbnQgPSBkb2MuU3RhdGVtZW50LmNvbmNhdCh0aGlzLmdldFN0YXRlbWVudHNGb3JFZmZlY3QuY2FsbCh0aGlzLCBcIkFsbG93XCIsIHRoaXMuYWxsb3dNZXRob2RzKSk7XHJcbiAgICBkb2MuU3RhdGVtZW50ID0gZG9jLlN0YXRlbWVudC5jb25jYXQodGhpcy5nZXRTdGF0ZW1lbnRzRm9yRWZmZWN0LmNhbGwodGhpcywgXCJEZW55XCIsIHRoaXMuZGVueU1ldGhvZHMpKTtcclxuXHJcbiAgICBwb2xpY3kucG9saWN5RG9jdW1lbnQgPSBkb2M7XHJcblxyXG4gICAgcmV0dXJuIHBvbGljeTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgbWV0aG9kIHRvIHRoZSBpbnRlcm5hbCBsaXN0cyBvZiBhbGxvd2VkIG9yIGRlbmllZCBtZXRob2RzLiBFYWNoIG9iamVjdCBpblxyXG4gICAqIHRoZSBpbnRlcm5hbCBsaXN0IGNvbnRhaW5zIGEgcmVzb3VyY2UgQVJOIGFuZCBhIGNvbmRpdGlvbiBzdGF0ZW1lbnQuIFRoZSBjb25kaXRpb25cclxuICAgKiBzdGF0ZW1lbnQgY2FuIGJlIG51bGwuXHJcbiAgICpcclxuICAgKiBAbWV0aG9kIGFkZE1ldGhvZFxyXG4gICAqIEBwYXJhbSBlZmZlY3Qge1N0cmluZ30gVGhlIGVmZmVjdCBmb3IgdGhlIHBvbGljeS4gVGhpcyBjYW4gb25seSBiZSBcIkFsbG93XCIgb3IgXCJEZW55XCIuXHJcbiAgICogQHBhcmFtIHZlcmIge1N0cmluZ30gaGUgSFRUUCB2ZXJiIGZvciB0aGUgbWV0aG9kLCB0aGlzIHNob3VsZCBpZGVhbGx5IGNvbWUgZnJvbSB0aGVcclxuICAgKiAgICAgICAgICAgICAgICAgQXV0aFBvbGljeS5IdHRwVmVyYiBvYmplY3QgdG8gYXZvaWQgc3BlbGxpbmcgbWlzdGFrZXNcclxuICAgKiBAcGFyYW0gcmVzb3VyY2Uge1N0cmluZ30gVGhlIHJlc291cmNlIHBhdGguIEZvciBleGFtcGxlIFwiL3BldHNcIlxyXG4gICAqIEBwYXJhbSBjb25kaXRpb25zIHtPYmplY3R9IFRoZSBjb25kaXRpb25zIG9iamVjdCBpbiB0aGUgZm9ybWF0IHNwZWNpZmllZCBieSB0aGUgQVdTIGRvY3MuXHJcbiAgICogQHJldHVybiB7dm9pZH1cclxuICAgKi9cclxuICBwcml2YXRlIGFkZE1ldGhvZCA9IChlZmZlY3Q6IHN0cmluZywgdmVyYjogc3RyaW5nLCByZXNvdXJjZTogc3RyaW5nLCBjb25kaXRpb25zOiBhbnkpID0+IHtcclxuICAgIGlmICh2ZXJiICE9PSBcIipcIiAmJiAhdGhpcy5IdHRwVmVyYi5oYXNPd25Qcm9wZXJ0eSh2ZXJiKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIEhUVFAgdmVyYiBcIiArIHZlcmIgKyBcIi4gQWxsb3dlZCB2ZXJicyBpbiBBdXRoUG9saWN5Lkh0dHBWZXJiXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5wYXRoUmVnZXgudGVzdChyZXNvdXJjZSkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCByZXNvdXJjZSBwYXRoOiBcIiArIHJlc291cmNlICsgXCIuIFBhdGggc2hvdWxkIG1hdGNoIFwiICsgdGhpcy5wYXRoUmVnZXgpO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBjbGVhbmVkUmVzb3VyY2UgPSByZXNvdXJjZTtcclxuICAgIGlmIChyZXNvdXJjZS5zdWJzdHJpbmcoMCwgMSkgPT09IFwiL1wiKSB7XHJcbiAgICAgIGNsZWFuZWRSZXNvdXJjZSA9IHJlc291cmNlLnN1YnN0cmluZygxLCByZXNvdXJjZS5sZW5ndGgpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzb3VyY2VBcm4gPSBcImFybjphd3M6ZXhlY3V0ZS1hcGk6XCIgKyB0aGlzLnJlZ2lvbiArIFwiOlwiICsgdGhpcy5hd3NBY2NvdW50SWQgKyBcIjpcIiArIHRoaXMucmVzdEFwaUlkICsgXCIvXCIgKyB0aGlzLnN0YWdlICsgXCIvXCIgKyB2ZXJiICsgXCIvXCIgKyBjbGVhbmVkUmVzb3VyY2U7XHJcblxyXG4gICAgaWYgKGVmZmVjdC50b0xvd2VyQ2FzZSgpID09PSBcImFsbG93XCIpIHtcclxuICAgICAgdGhpcy5hbGxvd01ldGhvZHMucHVzaCh7XHJcbiAgICAgICAgcmVzb3VyY2VBcm4sXHJcbiAgICAgICAgY29uZGl0aW9ucyxcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKGVmZmVjdC50b0xvd2VyQ2FzZSgpID09PSBcImRlbnlcIikge1xyXG4gICAgICB0aGlzLmRlbnlNZXRob2RzLnB1c2goe1xyXG4gICAgICAgIHJlc291cmNlQXJuLFxyXG4gICAgICAgIGNvbmRpdGlvbnMsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gZW1wdHkgc3RhdGVtZW50IG9iamVjdCBwcmVwb3B1bGF0ZWQgd2l0aCB0aGUgY29ycmVjdCBhY3Rpb24gYW5kIHRoZVxyXG4gICAqIGRlc2lyZWQgZWZmZWN0LlxyXG4gICAqXHJcbiAgICogQG1ldGhvZCBnZXRFbXB0eVN0YXRlbWVudFxyXG4gICAqIEBwYXJhbSBlZmZlY3Qge1N0cmluZ30gVGhlIGVmZmVjdCBvZiB0aGUgc3RhdGVtZW50LCB0aGlzIGNhbiBiZSBcIkFsbG93XCIgb3IgXCJEZW55XCJcclxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEFuIGVtcHR5IHN0YXRlbWVudCBvYmplY3Qgd2l0aCB0aGUgQWN0aW9uLCBFZmZlY3QsIGFuZCBSZXNvdXJjZVxyXG4gICAqICAgICAgICAgICAgICAgICAgcHJvcGVydGllcyBwcmVwb3B1bGF0ZWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRFbXB0eVN0YXRlbWVudCA9IChlZmZlY3Q6IHN0cmluZykgPT4ge1xyXG4gICAgZWZmZWN0ID0gZWZmZWN0LnN1YnN0cmluZygwLCAxKS50b1VwcGVyQ2FzZSgpICsgZWZmZWN0LnN1YnN0cmluZygxLCBlZmZlY3QubGVuZ3RoKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgY29uc3Qgc3RhdGVtZW50OiBhbnkgPSB7fTtcclxuICAgIHN0YXRlbWVudC5BY3Rpb24gPSBcImV4ZWN1dGUtYXBpOkludm9rZVwiO1xyXG4gICAgc3RhdGVtZW50LkVmZmVjdCA9IGVmZmVjdDtcclxuICAgIHN0YXRlbWVudC5SZXNvdXJjZSA9IFtdO1xyXG5cclxuICAgIHJldHVybiBzdGF0ZW1lbnQ7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBmdW5jdGlvbiBsb29wcyBvdmVyIGFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmluZyBhIHJlc291cmNlQXJuIGFuZFxyXG4gICAqIGNvbmRpdGlvbnMgc3RhdGVtZW50IGFuZCBnZW5lcmF0ZXMgdGhlIGFycmF5IG9mIHN0YXRlbWVudHMgZm9yIHRoZSBwb2xpY3kuXHJcbiAgICpcclxuICAgKiBAbWV0aG9kIGdldFN0YXRlbWVudHNGb3JFZmZlY3RcclxuICAgKiBAcGFyYW0gZWZmZWN0IHtTdHJpbmd9IFRoZSBkZXNpcmVkIGVmZmVjdC4gVGhpcyBjYW4gYmUgXCJBbGxvd1wiIG9yIFwiRGVueVwiXHJcbiAgICogQHBhcmFtIG1ldGhvZHMge0FycmF5fSBBbiBhcnJheSBvZiBtZXRob2Qgb2JqZWN0cyBjb250YWluaW5nIHRoZSBBUk4gb2YgdGhlIHJlc291cmNlXHJcbiAgICogICAgICAgICAgICAgICAgYW5kIHRoZSBjb25kaXRpb25zIGZvciB0aGUgcG9saWN5XHJcbiAgICogQHJldHVybiB7QXJyYXl9IGFuIGFycmF5IG9mIGZvcm1hdHRlZCBzdGF0ZW1lbnRzIGZvciB0aGUgcG9saWN5LlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0U3RhdGVtZW50c0ZvckVmZmVjdCA9IChlZmZlY3Q6IHN0cmluZywgbWV0aG9kczogQXBpTWV0aG9kW10pID0+IHtcclxuICAgIGNvbnN0IHN0YXRlbWVudHMgPSBbXTtcclxuXHJcbiAgICBpZiAobWV0aG9kcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGNvbnN0IHN0YXRlbWVudCA9IHRoaXMuZ2V0RW1wdHlTdGF0ZW1lbnQoZWZmZWN0KTtcclxuXHJcbiAgICAgIGZvciAoY29uc3QgY3VyTWV0aG9kIG9mIG1ldGhvZHMpIHtcclxuICAgICAgICBpZiAoY3VyTWV0aG9kLmNvbmRpdGlvbnMgPT09IG51bGwgfHwgY3VyTWV0aG9kLmNvbmRpdGlvbnMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBzdGF0ZW1lbnQuUmVzb3VyY2UucHVzaChjdXJNZXRob2QucmVzb3VyY2VBcm4pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBjb25kaXRpb25hbFN0YXRlbWVudCA9IHRoaXMuZ2V0RW1wdHlTdGF0ZW1lbnQoZWZmZWN0KTtcclxuICAgICAgICAgIGNvbmRpdGlvbmFsU3RhdGVtZW50LlJlc291cmNlLnB1c2goY3VyTWV0aG9kLnJlc291cmNlQXJuKTtcclxuICAgICAgICAgIGNvbmRpdGlvbmFsU3RhdGVtZW50LkNvbmRpdGlvbiA9IGN1ck1ldGhvZC5jb25kaXRpb25zO1xyXG4gICAgICAgICAgc3RhdGVtZW50cy5wdXNoKGNvbmRpdGlvbmFsU3RhdGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzdGF0ZW1lbnQuUmVzb3VyY2UgIT09IG51bGwgJiYgc3RhdGVtZW50LlJlc291cmNlLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RhdGVtZW50KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzdGF0ZW1lbnRzO1xyXG4gIH07XHJcbn1cclxuXHJcbmludGVyZmFjZSBBcGlNZXRob2Qge1xyXG4gIHJlc291cmNlQXJuOiBzdHJpbmc7XHJcbiAgY29uZGl0aW9ucz86IGFueTsgLy9BcyBwZXIgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0lBTS9sYXRlc3QvVXNlckd1aWRlL3JlZmVyZW5jZV9wb2xpY2llc19lbGVtZW50c19jb25kaXRpb24uaHRtbFxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFwaU9wdGlvbnMge1xyXG4gIHJlc3RBcGlJZD86IHN0cmluZztcclxuICByZWdpb24/OiBzdHJpbmc7XHJcbiAgc3RhZ2U/OiBzdHJpbmc7XHJcbn1cclxuIl19
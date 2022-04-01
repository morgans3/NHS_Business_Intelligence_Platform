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
        const policy = new AuthPolicy("publicendpoint", awsAccountId, apiOptions);
        policy.allowAllMethods();
        context.succeed(policy.build());
    }
    catch (ex) {
        console.log("AUTHORIZATION--AUTHORIZER--MAIN--FAILED: Public Endpoint");
        context.fail("Unauthorized");
    }
};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXBDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsVUFBVSxLQUFVLEVBQUUsT0FBWTtJQUMvQyxJQUFJO1FBQ0YsSUFBSSxVQUFVLEdBQVEsRUFBRSxDQUFDO1FBQ3pCLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLElBQUksZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QyxJQUFJLFlBQVksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsVUFBVSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0IsVUFBVSxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQyxVQUFVLENBQUMsS0FBSyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXZDLE1BQU0sTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLGdCQUFnQixFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMxRSxNQUFNLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDekIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztLQUNqQztJQUFDLE9BQU8sRUFBRSxFQUFFO1FBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQywwREFBMEQsQ0FBQyxDQUFDO1FBQ3hFLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDOUI7QUFDSCxDQUFDLENBQUM7QUFFRixNQUFhLFVBQVU7SUE2QnJCLFlBQVksU0FBaUIsRUFB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QUNsQyxJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztRQUV0QixJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRTtZQUN4QyxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztTQUN0QjthQUFNO1lBQ0wsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDO1NBQ3ZDO1FBQ0QsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7WUFDckMsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7U0FDbkI7YUFBTTtZQUNMLElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztTQUNqQztRQUNELElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFO1lBQ3BDLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1NBQ2xCO2FBQU07WUFDTCxJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7U0FDL0I7SUFDSCxDQUFDO0NBME1GO0FBblNELGdDQW1TQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGp3dCA9IHJlcXVpcmUoXCJqc29ud2VidG9rZW5cIik7XHJcblxyXG5leHBvcnRzLm1haW4gPSBmdW5jdGlvbiAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55KSB7XHJcbiAgdHJ5IHtcclxuICAgIHZhciBhcGlPcHRpb25zOiBhbnkgPSB7fTtcclxuICAgIHZhciB0bXAgPSBldmVudC5tZXRob2RBcm4uc3BsaXQoXCI6XCIpO1xyXG4gICAgdmFyIGFwaUdhdGV3YXlBcm5UbXAgPSB0bXBbNV0uc3BsaXQoXCIvXCIpO1xyXG4gICAgdmFyIGF3c0FjY291bnRJZCA9IHRtcFs0XTtcclxuICAgIGFwaU9wdGlvbnMucmVnaW9uID0gdG1wWzNdO1xyXG4gICAgYXBpT3B0aW9ucy5yZXN0QXBpSWQgPSBhcGlHYXRld2F5QXJuVG1wWzBdO1xyXG4gICAgYXBpT3B0aW9ucy5zdGFnZSA9IGFwaUdhdGV3YXlBcm5UbXBbMV07XHJcblxyXG4gICAgY29uc3QgcG9saWN5ID0gbmV3IEF1dGhQb2xpY3koXCJwdWJsaWNlbmRwb2ludFwiLCBhd3NBY2NvdW50SWQsIGFwaU9wdGlvbnMpO1xyXG4gICAgcG9saWN5LmFsbG93QWxsTWV0aG9kcygpO1xyXG4gICAgY29udGV4dC5zdWNjZWVkKHBvbGljeS5idWlsZCgpKTtcclxuICB9IGNhdGNoIChleCkge1xyXG4gICAgY29uc29sZS5sb2coXCJBVVRIT1JJWkFUSU9OLS1BVVRIT1JJWkVSLS1NQUlOLS1GQUlMRUQ6IFB1YmxpYyBFbmRwb2ludFwiKTtcclxuICAgIGNvbnRleHQuZmFpbChcIlVuYXV0aG9yaXplZFwiKTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgQXV0aFBvbGljeSB7XHJcbiAgLyoqXHJcbiAgICogQSBzZXQgb2YgZXhpc3RpbmcgSFRUUCB2ZXJicyBzdXBwb3J0ZWQgYnkgQVBJIEdhdGV3YXkuIFRoaXMgcHJvcGVydHkgaXMgaGVyZVxyXG4gICAqIG9ubHkgdG8gYXZvaWQgc3BlbGxpbmcgbWlzdGFrZXMgaW4gdGhlIHBvbGljeS5cclxuICAgKlxyXG4gICAqIEBwcm9wZXJ0eSBIdHRwVmVyYlxyXG4gICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICovXHJcbiAgcHVibGljIEh0dHBWZXJiID0ge1xyXG4gICAgR0VUOiBcIkdFVFwiLFxyXG4gICAgUE9TVDogXCJQT1NUXCIsXHJcbiAgICBQVVQ6IFwiUFVUXCIsXHJcbiAgICBQQVRDSDogXCJQQVRDSFwiLFxyXG4gICAgSEVBRDogXCJIRUFEXCIsXHJcbiAgICBERUxFVEU6IFwiREVMRVRFXCIsXHJcbiAgICBPUFRJT05TOiBcIk9QVElPTlNcIixcclxuICAgIEFMTDogXCIqXCIsXHJcbiAgfTtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBhd3NBY2NvdW50SWQ6IHN0cmluZztcclxuICBwcml2YXRlIHJlYWRvbmx5IHByaW5jaXBhbElkOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSByZWFkb25seSB2ZXJzaW9uOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBwYXRoUmVnZXg6IFJlZ0V4cDtcclxuICBwcml2YXRlIHJlYWRvbmx5IGFsbG93TWV0aG9kczogQXBpTWV0aG9kW107XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkZW55TWV0aG9kczogQXBpTWV0aG9kW107XHJcbiAgcHJpdmF0ZSByZWFkb25seSByZXN0QXBpSWQ6IHN0cmluZztcclxuICBwcml2YXRlIHJlYWRvbmx5IHJlZ2lvbjogc3RyaW5nO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgc3RhZ2U6IHN0cmluZztcclxuXHJcbiAgY29uc3RydWN0b3IocHJpbmNpcGFsOiBzdHJpbmcsIGF3c0FjY291bnRJZDogc3RyaW5nLCBhcGlPcHRpb25zPzogQXBpT3B0aW9ucykge1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgQVdTIGFjY291bnQgaWQgdGhlIHBvbGljeSB3aWxsIGJlIGdlbmVyYXRlZCBmb3IuIFRoaXMgaXMgdXNlZCB0byBjcmVhdGVcclxuICAgICAqIHRoZSBtZXRob2QgQVJOcy5cclxuICAgICAqXHJcbiAgICAgKiBAcHJvcGVydHkgYXdzQWNjb3VudElkXHJcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmF3c0FjY291bnRJZCA9IGF3c0FjY291bnRJZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBwcmluY2lwYWwgdXNlZCBmb3IgdGhlIHBvbGljeSwgdGhpcyBzaG91bGQgYmUgYSB1bmlxdWUgaWRlbnRpZmllciBmb3JcclxuICAgICAqIHRoZSBlbmQgdXNlci5cclxuICAgICAqXHJcbiAgICAgKiBAcHJvcGVydHkgcHJpbmNpcGFsSWRcclxuICAgICAqIEB0eXBlIHtTdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHRoaXMucHJpbmNpcGFsSWQgPSBwcmluY2lwYWw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcG9saWN5IHZlcnNpb24gdXNlZCBmb3IgdGhlIGV2YWx1YXRpb24uIFRoaXMgc2hvdWxkIGFsd2F5cyBiZSBcIjIwMTItMTAtMTdcIlxyXG4gICAgICpcclxuICAgICAqIEBwcm9wZXJ0eSB2ZXJzaW9uXHJcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICogQGRlZmF1bHQgXCIyMDEyLTEwLTE3XCJcclxuICAgICAqL1xyXG4gICAgdGhpcy52ZXJzaW9uID0gXCIyMDEyLTEwLTE3XCI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gdmFsaWRhdGUgcmVzb3VyY2UgcGF0aHMgZm9yIHRoZSBwb2xpY3lcclxuICAgICAqXHJcbiAgICAgKiBAcHJvcGVydHkgcGF0aFJlZ2V4XHJcbiAgICAgKiBAdHlwZSB7UmVnRXhwfVxyXG4gICAgICogQGRlZmF1bHQgJ15cXC9bLy5hLXpBLVowLTktXFwqXSskJ1xyXG4gICAgICovXHJcbiAgICB0aGlzLnBhdGhSZWdleCA9IG5ldyBSZWdFeHAoXCJeWy8uYS16QS1aMC05LSpdKyRcIik7XHJcblxyXG4gICAgLy8gdGhlc2UgYXJlIHRoZSBpbnRlcm5hbCBsaXN0cyBvZiBhbGxvd2VkIGFuZCBkZW5pZWQgbWV0aG9kcy4gVGhlc2UgYXJlIGxpc3RzXHJcbiAgICAvLyBvZiBvYmplY3RzIGFuZCBlYWNoIG9iamVjdCBoYXMgMiBwcm9wZXJ0aWVzOiBBIHJlc291cmNlIEFSTiBhbmQgYSBudWxsYWJsZVxyXG4gICAgLy8gY29uZGl0aW9ucyBzdGF0ZW1lbnQuXHJcbiAgICAvLyB0aGUgYnVpbGQgbWV0aG9kIHByb2Nlc3NlcyB0aGVzZSBsaXN0cyBhbmQgZ2VuZXJhdGVzIHRoZSBhcHByb3JpYXRlXHJcbiAgICAvLyBzdGF0ZW1lbnRzIGZvciB0aGUgZmluYWwgcG9saWN5XHJcbiAgICB0aGlzLmFsbG93TWV0aG9kcyA9IFtdO1xyXG4gICAgdGhpcy5kZW55TWV0aG9kcyA9IFtdO1xyXG5cclxuICAgIGlmICghYXBpT3B0aW9ucyB8fCAhYXBpT3B0aW9ucy5yZXN0QXBpSWQpIHtcclxuICAgICAgdGhpcy5yZXN0QXBpSWQgPSBcIipcIjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMucmVzdEFwaUlkID0gYXBpT3B0aW9ucy5yZXN0QXBpSWQ7XHJcbiAgICB9XHJcbiAgICBpZiAoIWFwaU9wdGlvbnMgfHwgIWFwaU9wdGlvbnMucmVnaW9uKSB7XHJcbiAgICAgIHRoaXMucmVnaW9uID0gXCIqXCI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnJlZ2lvbiA9IGFwaU9wdGlvbnMucmVnaW9uO1xyXG4gICAgfVxyXG4gICAgaWYgKCFhcGlPcHRpb25zIHx8ICFhcGlPcHRpb25zLnN0YWdlKSB7XHJcbiAgICAgIHRoaXMuc3RhZ2UgPSBcIipcIjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuc3RhZ2UgPSBhcGlPcHRpb25zLnN0YWdlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBhbGxvdyBcIipcIiBzdGF0ZW1lbnQgdG8gdGhlIHBvbGljeS5cclxuICAgKlxyXG4gICAqIEBtZXRob2QgYWxsb3dBbGxNZXRob2RzXHJcbiAgICovXHJcbiAgcHVibGljIGFsbG93QWxsTWV0aG9kcyA9ICgpID0+IHtcclxuICAgIHRoaXMuYWRkTWV0aG9kLmNhbGwodGhpcywgXCJhbGxvd1wiLCBcIipcIiwgXCIqXCIsIG51bGwpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBkZW55IFwiKlwiIHN0YXRlbWVudCB0byB0aGUgcG9saWN5LlxyXG4gICAqXHJcbiAgICogQG1ldGhvZCBkZW55QWxsTWV0aG9kc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBkZW55QWxsTWV0aG9kcyA9ICgpID0+IHtcclxuICAgIHRoaXMuYWRkTWV0aG9kLmNhbGwodGhpcywgXCJkZW55XCIsIFwiKlwiLCBcIipcIiwgbnVsbCk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBBUEkgR2F0ZXdheSBtZXRob2QgKEh0dHAgdmVyYiArIFJlc291cmNlIHBhdGgpIHRvIHRoZSBsaXN0IG9mIGFsbG93ZWRcclxuICAgKiBtZXRob2RzIGZvciB0aGUgcG9saWN5XHJcbiAgICpcclxuICAgKiBAbWV0aG9kIGFsbG93TWV0aG9kXHJcbiAgICogQHBhcmFtIHZlcmIge1N0cmluZ30gVGhlIEhUVFAgdmVyYiBmb3IgdGhlIG1ldGhvZCwgdGhpcyBzaG91bGQgaWRlYWxseSBjb21lIGZyb20gdGhlXHJcbiAgICogICAgICAgICAgICAgICAgIEF1dGhQb2xpY3kuSHR0cFZlcmIgb2JqZWN0IHRvIGF2b2lkIHNwZWxsaW5nIG1pc3Rha2VzXHJcbiAgICogQHBhcmFtIHJlc291cmNlIHtzdHJpbmd9IFRoZSByZXNvdXJjZSBwYXRoLiBGb3IgZXhhbXBsZSBcIi9wZXRzXCJcclxuICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhbGxvd01ldGhvZCA9ICh2ZXJiOiBzdHJpbmcsIHJlc291cmNlOiBzdHJpbmcpID0+IHtcclxuICAgIHRoaXMuYWRkTWV0aG9kLmNhbGwodGhpcywgXCJhbGxvd1wiLCB2ZXJiLCByZXNvdXJjZSwgbnVsbCk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBBUEkgR2F0ZXdheSBtZXRob2QgKEh0dHAgdmVyYiArIFJlc291cmNlIHBhdGgpIHRvIHRoZSBsaXN0IG9mIGRlbmllZFxyXG4gICAqIG1ldGhvZHMgZm9yIHRoZSBwb2xpY3lcclxuICAgKlxyXG4gICAqIEBtZXRob2QgZGVueU1ldGhvZFxyXG4gICAqIEBwYXJhbSB2ZXJiIHtTdHJpbmd9IFRoZSBIVFRQIHZlcmIgZm9yIHRoZSBtZXRob2QsIHRoaXMgc2hvdWxkIGlkZWFsbHkgY29tZSBmcm9tIHRoZVxyXG4gICAqICAgICAgICAgICAgICAgICBBdXRoUG9saWN5Lkh0dHBWZXJiIG9iamVjdCB0byBhdm9pZCBzcGVsbGluZyBtaXN0YWtlc1xyXG4gICAqIEBwYXJhbSByZXNvdXJjZSB7c3RyaW5nfSBUaGUgcmVzb3VyY2UgcGF0aC4gRm9yIGV4YW1wbGUgXCIvcGV0c1wiXHJcbiAgICogQHJldHVybiB7dm9pZH1cclxuICAgKi9cclxuICBwdWJsaWMgZGVueU1ldGhvZCA9ICh2ZXJiOiBzdHJpbmcsIHJlc291cmNlOiBzdHJpbmcpID0+IHtcclxuICAgIHRoaXMuYWRkTWV0aG9kLmNhbGwodGhpcywgXCJkZW55XCIsIHZlcmIsIHJlc291cmNlLCBudWxsKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGFuIEFQSSBHYXRld2F5IG1ldGhvZCAoSHR0cCB2ZXJiICsgUmVzb3VyY2UgcGF0aCkgdG8gdGhlIGxpc3Qgb2YgYWxsb3dlZFxyXG4gICAqIG1ldGhvZHMgYW5kIGluY2x1ZGVzIGEgY29uZGl0aW9uIGZvciB0aGUgcG9saWN5IHN0YXRlbWVudC4gTW9yZSBvbiBBV1MgcG9saWN5XHJcbiAgICogY29uZGl0aW9ucyBoZXJlOiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vSUFNL2xhdGVzdC9Vc2VyR3VpZGUvcmVmZXJlbmNlX3BvbGljaWVzX2VsZW1lbnRzX2NvbmRpdGlvbi5odG1sXHJcbiAgICpcclxuICAgKiBAbWV0aG9kIGFsbG93TWV0aG9kV2l0aENvbmRpdGlvbnNcclxuICAgKiBAcGFyYW0gdmVyYiB7U3RyaW5nfSBUaGUgSFRUUCB2ZXJiIGZvciB0aGUgbWV0aG9kLCB0aGlzIHNob3VsZCBpZGVhbGx5IGNvbWUgZnJvbSB0aGVcclxuICAgKiAgICAgICAgICAgICAgICAgQXV0aFBvbGljeS5IdHRwVmVyYiBvYmplY3QgdG8gYXZvaWQgc3BlbGxpbmcgbWlzdGFrZXNcclxuICAgKiBAcGFyYW0gcmVzb3VyY2Uge3N0cmluZ30gVGhlIHJlc291cmNlIHBhdGguIEZvciBleGFtcGxlIFwiL3BldHNcIlxyXG4gICAqIEBwYXJhbSBjb25kaXRpb25zIHtPYmplY3R9IFRoZSBjb25kaXRpb25zIG9iamVjdCBpbiB0aGUgZm9ybWF0IHNwZWNpZmllZCBieSB0aGUgQVdTIGRvY3NcclxuICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhbGxvd01ldGhvZFdpdGhDb25kaXRpb25zID0gKHZlcmI6IHN0cmluZywgcmVzb3VyY2U6IHN0cmluZywgY29uZGl0aW9uczogYW55KSA9PiB7XHJcbiAgICB0aGlzLmFkZE1ldGhvZC5jYWxsKHRoaXMsIFwiYWxsb3dcIiwgdmVyYiwgcmVzb3VyY2UsIGNvbmRpdGlvbnMpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gQVBJIEdhdGV3YXkgbWV0aG9kIChIdHRwIHZlcmIgKyBSZXNvdXJjZSBwYXRoKSB0byB0aGUgbGlzdCBvZiBkZW5pZWRcclxuICAgKiBtZXRob2RzIGFuZCBpbmNsdWRlcyBhIGNvbmRpdGlvbiBmb3IgdGhlIHBvbGljeSBzdGF0ZW1lbnQuIE1vcmUgb24gQVdTIHBvbGljeVxyXG4gICAqIGNvbmRpdGlvbnMgaGVyZTogaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0lBTS9sYXRlc3QvVXNlckd1aWRlL3JlZmVyZW5jZV9wb2xpY2llc19lbGVtZW50c19jb25kaXRpb24uaHRtbFxyXG4gICAqXHJcbiAgICogQG1ldGhvZCBkZW55TWV0aG9kV2l0aENvbmRpdGlvbnNcclxuICAgKiBAcGFyYW0gdmVyYiB7U3RyaW5nfSBUaGUgSFRUUCB2ZXJiIGZvciB0aGUgbWV0aG9kLCB0aGlzIHNob3VsZCBpZGVhbGx5IGNvbWUgZnJvbSB0aGVcclxuICAgKiAgICAgICAgICAgICAgICAgQXV0aFBvbGljeS5IdHRwVmVyYiBvYmplY3QgdG8gYXZvaWQgc3BlbGxpbmcgbWlzdGFrZXNcclxuICAgKiBAcGFyYW0gcmVzb3VyY2Uge3N0cmluZ30gVGhlIHJlc291cmNlIHBhdGguIEZvciBleGFtcGxlIFwiL3BldHNcIlxyXG4gICAqIEBwYXJhbSBjb25kaXRpb25zIHtPYmplY3R9IFRoZSBjb25kaXRpb25zIG9iamVjdCBpbiB0aGUgZm9ybWF0IHNwZWNpZmllZCBieSB0aGUgQVdTIGRvY3NcclxuICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAqL1xyXG4gIHB1YmxpYyBkZW55TWV0aG9kV2l0aENvbmRpdGlvbnMgPSAodmVyYjogc3RyaW5nLCByZXNvdXJjZTogc3RyaW5nLCBjb25kaXRpb25zOiBhbnkpID0+IHtcclxuICAgIHRoaXMuYWRkTWV0aG9kLmNhbGwodGhpcywgXCJkZW55XCIsIHZlcmIsIHJlc291cmNlLCBjb25kaXRpb25zKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBHZW5lcmF0ZXMgdGhlIHBvbGljeSBkb2N1bWVudCBiYXNlZCBvbiB0aGUgaW50ZXJuYWwgbGlzdHMgb2YgYWxsb3dlZCBhbmQgZGVuaWVkXHJcbiAgICogY29uZGl0aW9ucy4gVGhpcyB3aWxsIGdlbmVyYXRlIGEgcG9saWN5IHdpdGggdHdvIG1haW4gc3RhdGVtZW50cyBmb3IgdGhlIGVmZmVjdDpcclxuICAgKiBvbmUgc3RhdGVtZW50IGZvciBBbGxvdyBhbmQgb25lIHN0YXRlbWVudCBmb3IgRGVueS5cclxuICAgKiBNZXRob2RzIHRoYXQgaW5jbHVkZXMgY29uZGl0aW9ucyB3aWxsIGhhdmUgdGhlaXIgb3duIHN0YXRlbWVudCBpbiB0aGUgcG9saWN5LlxyXG4gICAqXHJcbiAgICogQG1ldGhvZCBidWlsZFxyXG4gICAqIEByZXR1cm4ge09iamVjdH0gVGhlIHBvbGljeSBvYmplY3QgdGhhdCBjYW4gYmUgc2VyaWFsaXplZCB0byBKU09OLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBidWlsZCA9ICgpID0+IHtcclxuICAgIGlmICgoIXRoaXMuYWxsb3dNZXRob2RzIHx8IHRoaXMuYWxsb3dNZXRob2RzLmxlbmd0aCA9PT0gMCkgJiYgKCF0aGlzLmRlbnlNZXRob2RzIHx8IHRoaXMuZGVueU1ldGhvZHMubGVuZ3RoID09PSAwKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBzdGF0ZW1lbnRzIGRlZmluZWQgZm9yIHRoZSBwb2xpY3lcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcG9saWN5OiBhbnkgPSB7fTtcclxuICAgIHBvbGljeS5wcmluY2lwYWxJZCA9IHRoaXMucHJpbmNpcGFsSWQ7XHJcbiAgICBjb25zdCBkb2M6IGFueSA9IHt9O1xyXG4gICAgZG9jLlZlcnNpb24gPSB0aGlzLnZlcnNpb247XHJcbiAgICBkb2MuU3RhdGVtZW50ID0gW107XHJcblxyXG4gICAgZG9jLlN0YXRlbWVudCA9IGRvYy5TdGF0ZW1lbnQuY29uY2F0KHRoaXMuZ2V0U3RhdGVtZW50c0ZvckVmZmVjdC5jYWxsKHRoaXMsIFwiQWxsb3dcIiwgdGhpcy5hbGxvd01ldGhvZHMpKTtcclxuICAgIGRvYy5TdGF0ZW1lbnQgPSBkb2MuU3RhdGVtZW50LmNvbmNhdCh0aGlzLmdldFN0YXRlbWVudHNGb3JFZmZlY3QuY2FsbCh0aGlzLCBcIkRlbnlcIiwgdGhpcy5kZW55TWV0aG9kcykpO1xyXG5cclxuICAgIHBvbGljeS5wb2xpY3lEb2N1bWVudCA9IGRvYztcclxuXHJcbiAgICByZXR1cm4gcG9saWN5O1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBtZXRob2QgdG8gdGhlIGludGVybmFsIGxpc3RzIG9mIGFsbG93ZWQgb3IgZGVuaWVkIG1ldGhvZHMuIEVhY2ggb2JqZWN0IGluXHJcbiAgICogdGhlIGludGVybmFsIGxpc3QgY29udGFpbnMgYSByZXNvdXJjZSBBUk4gYW5kIGEgY29uZGl0aW9uIHN0YXRlbWVudC4gVGhlIGNvbmRpdGlvblxyXG4gICAqIHN0YXRlbWVudCBjYW4gYmUgbnVsbC5cclxuICAgKlxyXG4gICAqIEBtZXRob2QgYWRkTWV0aG9kXHJcbiAgICogQHBhcmFtIGVmZmVjdCB7U3RyaW5nfSBUaGUgZWZmZWN0IGZvciB0aGUgcG9saWN5LiBUaGlzIGNhbiBvbmx5IGJlIFwiQWxsb3dcIiBvciBcIkRlbnlcIi5cclxuICAgKiBAcGFyYW0gdmVyYiB7U3RyaW5nfSBoZSBIVFRQIHZlcmIgZm9yIHRoZSBtZXRob2QsIHRoaXMgc2hvdWxkIGlkZWFsbHkgY29tZSBmcm9tIHRoZVxyXG4gICAqICAgICAgICAgICAgICAgICBBdXRoUG9saWN5Lkh0dHBWZXJiIG9iamVjdCB0byBhdm9pZCBzcGVsbGluZyBtaXN0YWtlc1xyXG4gICAqIEBwYXJhbSByZXNvdXJjZSB7U3RyaW5nfSBUaGUgcmVzb3VyY2UgcGF0aC4gRm9yIGV4YW1wbGUgXCIvcGV0c1wiXHJcbiAgICogQHBhcmFtIGNvbmRpdGlvbnMge09iamVjdH0gVGhlIGNvbmRpdGlvbnMgb2JqZWN0IGluIHRoZSBmb3JtYXQgc3BlY2lmaWVkIGJ5IHRoZSBBV1MgZG9jcy5cclxuICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAqL1xyXG4gIHByaXZhdGUgYWRkTWV0aG9kID0gKGVmZmVjdDogc3RyaW5nLCB2ZXJiOiBzdHJpbmcsIHJlc291cmNlOiBzdHJpbmcsIGNvbmRpdGlvbnM6IGFueSkgPT4ge1xyXG4gICAgaWYgKHZlcmIgIT09IFwiKlwiICYmICF0aGlzLkh0dHBWZXJiLmhhc093blByb3BlcnR5KHZlcmIpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgSFRUUCB2ZXJiIFwiICsgdmVyYiArIFwiLiBBbGxvd2VkIHZlcmJzIGluIEF1dGhQb2xpY3kuSHR0cFZlcmJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLnBhdGhSZWdleC50ZXN0KHJlc291cmNlKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHJlc291cmNlIHBhdGg6IFwiICsgcmVzb3VyY2UgKyBcIi4gUGF0aCBzaG91bGQgbWF0Y2ggXCIgKyB0aGlzLnBhdGhSZWdleCk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNsZWFuZWRSZXNvdXJjZSA9IHJlc291cmNlO1xyXG4gICAgaWYgKHJlc291cmNlLnN1YnN0cmluZygwLCAxKSA9PT0gXCIvXCIpIHtcclxuICAgICAgY2xlYW5lZFJlc291cmNlID0gcmVzb3VyY2Uuc3Vic3RyaW5nKDEsIHJlc291cmNlLmxlbmd0aCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNvdXJjZUFybiA9IFwiYXJuOmF3czpleGVjdXRlLWFwaTpcIiArIHRoaXMucmVnaW9uICsgXCI6XCIgKyB0aGlzLmF3c0FjY291bnRJZCArIFwiOlwiICsgdGhpcy5yZXN0QXBpSWQgKyBcIi9cIiArIHRoaXMuc3RhZ2UgKyBcIi9cIiArIHZlcmIgKyBcIi9cIiArIGNsZWFuZWRSZXNvdXJjZTtcclxuXHJcbiAgICBpZiAoZWZmZWN0LnRvTG93ZXJDYXNlKCkgPT09IFwiYWxsb3dcIikge1xyXG4gICAgICB0aGlzLmFsbG93TWV0aG9kcy5wdXNoKHtcclxuICAgICAgICByZXNvdXJjZUFybixcclxuICAgICAgICBjb25kaXRpb25zLFxyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAoZWZmZWN0LnRvTG93ZXJDYXNlKCkgPT09IFwiZGVueVwiKSB7XHJcbiAgICAgIHRoaXMuZGVueU1ldGhvZHMucHVzaCh7XHJcbiAgICAgICAgcmVzb3VyY2VBcm4sXHJcbiAgICAgICAgY29uZGl0aW9ucyxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBlbXB0eSBzdGF0ZW1lbnQgb2JqZWN0IHByZXBvcHVsYXRlZCB3aXRoIHRoZSBjb3JyZWN0IGFjdGlvbiBhbmQgdGhlXHJcbiAgICogZGVzaXJlZCBlZmZlY3QuXHJcbiAgICpcclxuICAgKiBAbWV0aG9kIGdldEVtcHR5U3RhdGVtZW50XHJcbiAgICogQHBhcmFtIGVmZmVjdCB7U3RyaW5nfSBUaGUgZWZmZWN0IG9mIHRoZSBzdGF0ZW1lbnQsIHRoaXMgY2FuIGJlIFwiQWxsb3dcIiBvciBcIkRlbnlcIlxyXG4gICAqIEByZXR1cm4ge09iamVjdH0gQW4gZW1wdHkgc3RhdGVtZW50IG9iamVjdCB3aXRoIHRoZSBBY3Rpb24sIEVmZmVjdCwgYW5kIFJlc291cmNlXHJcbiAgICogICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzIHByZXBvcHVsYXRlZC5cclxuICAgKi9cclxuICBwcml2YXRlIGdldEVtcHR5U3RhdGVtZW50ID0gKGVmZmVjdDogc3RyaW5nKSA9PiB7XHJcbiAgICBlZmZlY3QgPSBlZmZlY3Quc3Vic3RyaW5nKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyBlZmZlY3Quc3Vic3RyaW5nKDEsIGVmZmVjdC5sZW5ndGgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBjb25zdCBzdGF0ZW1lbnQ6IGFueSA9IHt9O1xyXG4gICAgc3RhdGVtZW50LkFjdGlvbiA9IFwiZXhlY3V0ZS1hcGk6SW52b2tlXCI7XHJcbiAgICBzdGF0ZW1lbnQuRWZmZWN0ID0gZWZmZWN0O1xyXG4gICAgc3RhdGVtZW50LlJlc291cmNlID0gW107XHJcblxyXG4gICAgcmV0dXJuIHN0YXRlbWVudDtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBUaGlzIGZ1bmN0aW9uIGxvb3BzIG92ZXIgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjb250YWluaW5nIGEgcmVzb3VyY2VBcm4gYW5kXHJcbiAgICogY29uZGl0aW9ucyBzdGF0ZW1lbnQgYW5kIGdlbmVyYXRlcyB0aGUgYXJyYXkgb2Ygc3RhdGVtZW50cyBmb3IgdGhlIHBvbGljeS5cclxuICAgKlxyXG4gICAqIEBtZXRob2QgZ2V0U3RhdGVtZW50c0ZvckVmZmVjdFxyXG4gICAqIEBwYXJhbSBlZmZlY3Qge1N0cmluZ30gVGhlIGRlc2lyZWQgZWZmZWN0LiBUaGlzIGNhbiBiZSBcIkFsbG93XCIgb3IgXCJEZW55XCJcclxuICAgKiBAcGFyYW0gbWV0aG9kcyB7QXJyYXl9IEFuIGFycmF5IG9mIG1ldGhvZCBvYmplY3RzIGNvbnRhaW5pbmcgdGhlIEFSTiBvZiB0aGUgcmVzb3VyY2VcclxuICAgKiAgICAgICAgICAgICAgICBhbmQgdGhlIGNvbmRpdGlvbnMgZm9yIHRoZSBwb2xpY3lcclxuICAgKiBAcmV0dXJuIHtBcnJheX0gYW4gYXJyYXkgb2YgZm9ybWF0dGVkIHN0YXRlbWVudHMgZm9yIHRoZSBwb2xpY3kuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRTdGF0ZW1lbnRzRm9yRWZmZWN0ID0gKGVmZmVjdDogc3RyaW5nLCBtZXRob2RzOiBBcGlNZXRob2RbXSkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGVtZW50cyA9IFtdO1xyXG5cclxuICAgIGlmIChtZXRob2RzLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3Qgc3RhdGVtZW50ID0gdGhpcy5nZXRFbXB0eVN0YXRlbWVudChlZmZlY3QpO1xyXG5cclxuICAgICAgZm9yIChjb25zdCBjdXJNZXRob2Qgb2YgbWV0aG9kcykge1xyXG4gICAgICAgIGlmIChjdXJNZXRob2QuY29uZGl0aW9ucyA9PT0gbnVsbCB8fCBjdXJNZXRob2QuY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIHN0YXRlbWVudC5SZXNvdXJjZS5wdXNoKGN1ck1ldGhvZC5yZXNvdXJjZUFybik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IGNvbmRpdGlvbmFsU3RhdGVtZW50ID0gdGhpcy5nZXRFbXB0eVN0YXRlbWVudChlZmZlY3QpO1xyXG4gICAgICAgICAgY29uZGl0aW9uYWxTdGF0ZW1lbnQuUmVzb3VyY2UucHVzaChjdXJNZXRob2QucmVzb3VyY2VBcm4pO1xyXG4gICAgICAgICAgY29uZGl0aW9uYWxTdGF0ZW1lbnQuQ29uZGl0aW9uID0gY3VyTWV0aG9kLmNvbmRpdGlvbnM7XHJcbiAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goY29uZGl0aW9uYWxTdGF0ZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHN0YXRlbWVudC5SZXNvdXJjZSAhPT0gbnVsbCAmJiBzdGF0ZW1lbnQuUmVzb3VyY2UubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHN0YXRlbWVudHMucHVzaChzdGF0ZW1lbnQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN0YXRlbWVudHM7XHJcbiAgfTtcclxufVxyXG5cclxuaW50ZXJmYWNlIEFwaU1ldGhvZCB7XHJcbiAgcmVzb3VyY2VBcm46IHN0cmluZztcclxuICBjb25kaXRpb25zPzogYW55OyAvL0FzIHBlciBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vSUFNL2xhdGVzdC9Vc2VyR3VpZGUvcmVmZXJlbmNlX3BvbGljaWVzX2VsZW1lbnRzX2NvbmRpdGlvbi5odG1sXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQXBpT3B0aW9ucyB7XHJcbiAgcmVzdEFwaUlkPzogc3RyaW5nO1xyXG4gIHJlZ2lvbj86IHN0cmluZztcclxuICBzdGFnZT86IHN0cmluZztcclxufVxyXG4iXX0=
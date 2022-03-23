# Documentation on Authentication and Authorisation

## Secrets

The project ensures adherence to best practice for security by generating passwords and secrets at build time, then deploying these to your AWS Secrets Manager service to act as a storage vault. By using this vault, we can ensure maximum security and keep all private information out of the open-source repositories.

The following secrets are required for the platform to operate.

### Required Secrets

#### JWT Secret

The Json Web Tokens (JWT) are key to the operation of the interactions between the applications and the API's (which in-turn interact with the data stores).

Further information on JWTs can be found here: https://jwt.io/

The signature of our JWTs is stored in the vault and verified at each transaction to ensure that data can't be accessed by fraudulent parties. Secret's should be rotated routinely and this can be done by updating the value in secrets manager and re-running the deploment pipelines.

### Optional Secrets

#### Dockerhub Credentials

Standard images for library components are pulled from Dockerhub as part of the deployment process. By not providing credentials you will be limited to the unauthenticated limitations. By signing up for a free account https://hub.docker.com/ you will be able to increase your allowance and improve the success rate of deployments.

## Platform Authentication

The platform relies on a valid set of credentials being entered on the login page, which are passed to the api-authentication microservice deployed as standard in the initial deployment. Once a user has authenticated on the platform they are able to navigate and request role-based access to restricted areas or apps.

Users without an account can also navigate to a "New User" form via the login page.

Accounts and role based access can be managed by users with System Administration capabilities or roles. This group of Administrators can be configured on initial setup of the platform.

`As part of the initial deployment you will be provided with a set of admin credentials to login and setup the platform, these will also available in AWS Secrets Manager.`

TBC - Adding Custom Auth Extensions (Example: Active Directory)

## Platform Authorisation

After authentication, the user's capabiltiies and roles are added to their JWT passport in order to manage role-based access throughout the platform. Examples of this are:

- Access to applications
- Admin levels of access
- Access to patient level data

Modifying user's level of access can be managed in the Admin section of the BI Platform and user's can request access within the applications themselves or as part of their "New User" form.

## AWS Authentication

In addition to the authentication required to use the platform, there is also authentication and accounts required to utilise the AWS services. This codebase will generate the required roles and access in order to create the resources and complete the tests. Once the tests are completed successfully, any obsolete accounts will be removed.

# Post Deployment Solution Testing

## System Tests (Cypress)

### Rationale and Objectives

Deployment and routine testing of the systems we deploy is essential for a timely and efficient response to errors and ensures minimal downtime. This is crucial to running a clinical system and ensures compliance with best practice (https://aws.amazon.com/blogs/apn/the-6-pillars-of-the-aws-well-architected-framework/).

There are different types of test and different levels of testing. Most tests can fall into a category of either Unit testing or Integration testing: i.e. can a thing work and can things work together.

Whilst the built-in testing library performs a nice role in CDK testing, its most suitable use-case for us is to perform Unit testing. Coding a basic spec.ts file for each component that runs a "can create" test will ensure that the application will build and compile.

However more functional tests can be created for both Unit testing and Integration by using the Cypress library (https://docs.cypress.io/api/table-of-contents). By using this library, we have the added benefit of being able to easily abstract our test files from the codebase itself. This allows us to do more than test during a development sprint or during a deployment pipeline.

By removing the dependency on the codebase for the tests to run, we can carry out Canary-style testing on our live systems (production and development), routinely to ensure all systems are running as expected. This application is designed to provide those routine tests.

### Tests and Structure

All test files are contained in the cypress folder. For information on the usecase for the different folders in this section please refer to the cypress guidance.

Any `global settings` for the application are kept in the `lib/_config.js` file in this codebase.

The main elements we are interested when creating and managing the test files are in the `integration`, `fixtures` and `support` folders.

#### Fixtures

The json files in the fixtures folder contain demo data for use during the tests.

#### Support

The files in the support folder include the `commands.js` file. In here are some sections of repeatable code that we use frequently, like the login command. Using custom commands created in this folder will ensure that we avoid coding errors or duplication of work. Please familiarise yourself with the custom commands prior to creating new tests.

#### Integration

This folder is the core files that cypress uses for testing. Any spec.ts files you create in this folder or any of its sub-folders will be used in the testing runs. Please ensure that you use a sensible folder structure when creating new files.

### Instructions for running locally

- use `npm run test-deployment` to run the cypress testing locally

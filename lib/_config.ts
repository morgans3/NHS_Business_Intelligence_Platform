import { BuildEnvironmentVariableType } from "aws-cdk-lib/aws-codebuild";
import { InstanceClass, InstanceSize, InstanceType } from "aws-cdk-lib/aws-ec2";
import { containerSettings, minAPI, addAPI } from "./types/buildEnv";
import { ApiProps, iSettings } from "./types/interfaces";
const SECRET = BuildEnvironmentVariableType.SECRETS_MANAGER;

export const _AWSREGION = process.env.CDK_DEFAULT_REGION || "eu-west-2";
export const _ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;

// For local configuration that is not saved to Github, please create a file called _local_config.json in this folder and add your settings there.
const localSettings = require("./_local_config.json") as iSettings;

export const _SETTINGS: iSettings = localSettings || {
  manageDNS: false, // Change to true if you want AWS to handle Global DNS records, set to false if handled by a third party (e.g. nhs.uk domains = NHS Digital)
  containerIPs: ["10.1.0.0/19"], // Replace if you have a unique IP range, for example from HSCN to ensure it's unique across the network
  existingVPC: false, // Set to true if you have an existing VPC, set to false if you want to create a new VPC
  // existingVPCID: "vpc-0c9f9f9f9f9f9f9f9", // Set to the VPC ID if you have an existing VPC
  // existingSubnetIDs: [
  //   { ID: "subnet-0a9f9f9f9f9f9f9f9", AZ: "eu-west-2a" },
  //   { ID: "subnet-0b9f9f9f9f9f9f9f9", AZ: "eu-west-2b" },
  // ], // Set to the subnet IDs if you have an existing VPC and subnets to deploy into
  // ADD IF YOU WISH TO USE A DOCKERHUB ACCOUNT FOR IMPROVED IMAGE PULLS (See authentication/README.md)
  //   dockerhub: {
  //     username: "USERNAME",
  //     password: "PASSWORD",
  //   },
  existingRDS: false, // Set to true if you have an existing RDS, set to false if you want to create a new RDS
  newRDSConfig: {
    username: "Admin",
    instanceType: "t3.small",
    deletionProtection: false,
  },
  github: {
    oauthToken: "TOKENHERE",
  },
  serversAlwaysOn: false, // Set to true if you want to keep the servers always on, set to false if you want to turn them off outside of working hours
  ECSConfig: {
    minCapacity: 1,
    maxCapacity: 1,
    desiredCapacity: 1,
  },
  domainName: "example.com",
};

// ACCESS LIST (ISO 3166)
// This list will filter the access to the platform and external facing resources to IP addresses originating in specific countries.
// Additional country codes can be found here: https://www.iso.org/obp/ui/#search and are added as comma-separated list, i.e. [ "GB", "CA" ]
export const _AccessListCountries = ["GB"];

// APPLICATION LIST AND DEFAULTS
export const _MYDOMAIN = _SETTINGS.domainName || "example.com";
export const _PLATFORMAPP = {
  repo: "NHS_Business_Intelligence_Platform_App",
  name: "BI_Platform",
  owner: "morgans3",
  branch: "main",
};
export const _RequiredAppList: ApiProps[] = [
  {
    apiname: "BI_Platform_Api",
    application: {
      repo: "NHS_Business_Intelligence_Platform_Api",
      name: "BI_Platform_Api",
      owner: "morgans3",
      branch: "main",
    },
    domainName: _MYDOMAIN,
    siteSubDomain: "api",
    variables: addAPI(containerSettings, "api-server"),
    buildArgs: minAPI,
    port: 8079,
    minCapacity: 0, //1,
    maxCapacity: 0, //5,
    desired: 0, //3,
    priority: 1,
  },
  {
    apiname: "BI_Platform_CF-Api",
    application: {
      repo: "NHS_Business_Intelligence_Platform_CF-Api",
      name: "BI_Platform_CF-Api",
      owner: "morgans3",
      branch: "main",
    },
    domainName: _MYDOMAIN,
    siteSubDomain: "crossfilter",
    variables: addAPI(containerSettings, "cf-api-server"),
    buildArgs: minAPI,
    leadInTime: 120,
    port: 8080,
    minCapacity: 0, //1,
    maxCapacity: 0, //1,
    desired: 0, //1,
    cpu: 1024,
    memory: 2048,
    priority: 2,
  },
  {
    apiname: "BI_Platform_Otp",
    application: {
      repo: "NHS_Business_Intelligence_Platform_Otp",
      name: "BI_Platform_Otp",
      owner: "morgans3",
      branch: "main",
    },
    domainName: _MYDOMAIN,
    siteSubDomain: "isochrone",
    variables: addAPI(containerSettings, "otp-server"),
    buildArgs: [],
    leadInTime: 120,
    port: 80,
    minCapacity: 0, //1,
    maxCapacity: 0, //1,
    desired: 0, //1,
    cpu: 1024,
    memory: 2048,
    priority: 3,
  },
];

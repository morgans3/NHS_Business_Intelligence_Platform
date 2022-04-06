import { InstanceClass, InstanceSize, InstanceType } from "aws-cdk-lib/aws-ec2";
import { ApiProps, iSettings } from "./types/interfaces";

export const _AWSREGION = process.env.CDK_DEFAULT_REGION || "eu-west-2";
export const _ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;

export const _SETTINGS: iSettings = {
  manageDNS: false, // Change to true if you want AWS to handle Global DNS records, set to false if handled by a third party (e.g. nhs.uk domains = NHS Digital)
  containerIPs: ["10.1.0.0/19"], // Replace if you have a unique IP range, for example from HSCN to ensure it's unique across the network
  // ADD IF YOU WISH TO USE A DOCKERHUB ACCOUNT FOR IMPROVED IMAGE PULLS (See authentication/README.md)
  //   dockerhub: {
  //     username: "USERNAME",
  //     password: "PASSWORD",
  //   },
  rds_config: {
    username: "Admin",
    instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL),
    deletionProtection: false,
  },
  github: {
    oAuthToken: "TOKENHERE",
  },
};

// ACCESS LIST (ISO 3166)
// This list will filter the access to the platform and external facing resources to IP addresses originating in specific countries.
// Additional country codes can be found here: https://www.iso.org/obp/ui/#search and are added as comma-separated list, i.e. [ "GB", "CA" ]
export const _AccessListCountries = ["GB"];

// APPLICATION LIST AND DEFAULTS
export const _MYDOMAIN = "example.com";
export const _PLATFORMAPP = {
  repo: "https://github.com/morgans3/NHS_Business_Intelligence_Platform_App",
  name: "BI_Platform",
  owner: "morgans3",
  branch: "main",
};
export const _RequiredAppList: ApiProps[] = [
  {
    apiname: "BI_Platform_Api",
    application: {
      repo: "https://github.com/morgans3/NHS_Business_Intelligence_Platform_Api",
      name: "BI_Platform_Api",
      owner: "morgans3",
      branch: "main",
    },
    domainName: _MYDOMAIN,
    siteSubDomain: "api",
    buildArgs: [],
  },
  {
    apiname: "BI_Platform_CF-Api",
    application: {
      repo: "https://github.com/morgans3/NHS_Business_Intelligence_Platform_CF-Api",
      name: "BI_Platform_CF-Api",
      owner: "morgans3",
      branch: "main",
    },
    domainName: _MYDOMAIN,
    siteSubDomain: "crossfilter",
    buildArgs: [],
  },
  {
    apiname: "BI_Platform_Otp",
    application: {
      repo: "https://github.com/morgans3/NHS_Business_Intelligence_Platform_Otp",
      name: "BI_Platform_Otp",
      owner: "morgans3",
      branch: "main",
    },
    domainName: _MYDOMAIN,
    siteSubDomain: "isochrone",
    buildArgs: [],
  },
];

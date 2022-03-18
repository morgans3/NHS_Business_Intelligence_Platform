import { iSettings } from "./types/interfaces";

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
};

// ACCESS LIST (ISO 3166)
// This list will filter the access to the platform and external facing resources to IP addresses originating in specific countries.
// Additional country codes can be found here: https://www.iso.org/obp/ui/#search and are added as comma-separated list, i.e. [ "GB", "CA" ]
export const _AccessListCountries = ["GB"];

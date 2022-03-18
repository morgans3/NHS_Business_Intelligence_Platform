import { iSettings } from "./types/interfaces";

export const _AWSREGION = process.env.CDK_DEFAULT_REGION || "eu-west-2";
export const _ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;

export const _SETTINGS: iSettings = {
  // ADD IF YOU WISH TO USE A DOCKERHUB ACCOUNT FOR IMPROVED IMAGE PULLS (See authentication/README.md)
  //   dockerhub: {
  //     username: "USERNAME",
  //     password: "PASSWORD",
  //   },
};

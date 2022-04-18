import { BuildEnvironmentVariableType } from "aws-cdk-lib/aws-codebuild";

export const containerSettings = {
  ["AWSPROFILE"]: { value: "Dev", type: BuildEnvironmentVariableType.PLAINTEXT },
  ["AWSREGION"]: { value: "eu-west-2", type: BuildEnvironmentVariableType.PLAINTEXT },
  ["PGDATABASE"]: { value: "RDS_DB_ENDPOINT", type: BuildEnvironmentVariableType.PARAMETER_STORE },
  ["PGPORT"]: { value: "5432", type: BuildEnvironmentVariableType.PLAINTEXT },
  ["dockerhub_username"]: { value: "dockerhub:username", type: BuildEnvironmentVariableType.SECRETS_MANAGER },
  ["dockerhub_password"]: { value: "dockerhub:password", type: BuildEnvironmentVariableType.SECRETS_MANAGER },
  ["JWT_SECRET"]: { value: "jwt:secret", type: BuildEnvironmentVariableType.SECRETS_MANAGER },
  ["JWT_SECRETKEY"]: { value: "jwt:secretkey", type: BuildEnvironmentVariableType.SECRETS_MANAGER },
  ["POSTGRES_UN"]: { value: "postgres:username", type: BuildEnvironmentVariableType.SECRETS_MANAGER },
  ["POSTGRES_PW"]: { value: "postgres:password", type: BuildEnvironmentVariableType.SECRETS_MANAGER },
  ["AWS_SECRETID"]: { value: "awsdev:secretid", type: BuildEnvironmentVariableType.SECRETS_MANAGER },
  ["AWS_SECRETKEY"]: { value: "awsdev:secretkey", type: BuildEnvironmentVariableType.SECRETS_MANAGER },
};

export const minAPI = ["AWSPROFILE", "AWSREGION", "API_NAME", "PGDATABASE", "PGPORT", "JWT_SECRET", "JWT_SECRETKEY", "POSTGRES_UN", "POSTGRES_PW", "AWS_SECRETID", "AWS_SECRETKEY"];
export const minApp = ["AWSPROFILE", "AWSREGION"];

export function addAPI(obj: any, apiname: string, others?: { key: string; value: string; type: BuildEnvironmentVariableType }[]) {
  const newobj = Object.assign({}, obj);
  newobj.API_NAME = { value: apiname, type: BuildEnvironmentVariableType.PLAINTEXT };
  if (others) {
    others.forEach((pair) => {
      newobj[pair.key] = { value: pair.value, type: pair.type };
    });
  }
  return newobj;
}

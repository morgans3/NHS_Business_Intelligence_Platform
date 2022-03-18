import { _SETTINGS } from "../lib/_config";
import { checkSecretExists, generateSecrets, generatePassword } from "./_functions";

if (_SETTINGS.dockerhub) {
  checkSecretExists("dockerhub", (res: any) => {
    if (res && res === false) {
      generateSecrets("dockerhub", "username", "password", _SETTINGS.dockerhub.username, _SETTINGS.dockerhub.password, (result: any) => {
        console.log(result);
      });
    } else {
      console.log("Dockerhub secret exists.");
    }
  });
}

checkSecretExists("jwt", (res: any) => {
  if (res && res === false) {
    const jwtsecret = generatePassword(20, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$");
    const jwtsecretkey = generatePassword(20, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$");
    generateSecrets("jwt", "secret", "secretkey", jwtsecret, jwtsecretkey, (result: any) => {
      console.log(result);
    });
  } else {
    console.log("JWT secret exists.");
  }
});

checkSecretExists("postgres", (res: any) => {
  if (res && res === false) {
    const password = generatePassword(20, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$");
    generateSecrets("postgres", "POSTGRES_UN", "POSTGRES_PW", _SETTINGS.rds_config.username, password, (result: any) => {
      console.log(result);
    });
  } else {
    console.log("PostgreSQL secret exists.");
  }
});

// github

checkSecretExists("github", (res: any) => {
  if (res && res === false) {
    generateSecrets("github", "oauthToken", "", _SETTINGS.github.oAuthToken, "", (result: any) => {
      console.log(result);
    });
  } else {
    console.log("GitHub secret exists.");
  }
});

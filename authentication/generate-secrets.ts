import { _SETTINGS } from "../lib/_config";
import { checkSecretExists, generateSecrets, generatePassword } from "./_functions";

if (_SETTINGS.dockerhub) {
  checkSecretExists("dockerhub", (res: any) => {
    if (res === false) {
      const secretObject = { username: _SETTINGS.dockerhub.username, password: _SETTINGS.dockerhub.password };
      generateSecrets("dockerhub", secretObject, (result: any) => {
        console.log(result);
      });
    } else {
      console.log("Dockerhub secret exists.");
    }
  });
}

checkSecretExists("jwt", (res: any) => {
  if (res === false) {
    const jwtsecret = generatePassword(20, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$");
    const jwtsecretkey = generatePassword(20, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$");
    const secretObject = { jwtsecret: jwtsecret, jwtsecretkey: jwtsecretkey };
    generateSecrets("jwt", secretObject, (result: any) => {
      console.log(result);
    });
  } else {
    console.log("JWT secret exists.");
  }
});

if (_SETTINGS.newRDSConfig) {
  checkSecretExists("postgres", (res: any) => {
    if (res === false) {
      const password = generatePassword(20, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$");
      const secretObject = { POSTGRES_UN: _SETTINGS.newRDSConfig!.username, POSTGRES_PW: password };
      generateSecrets("postgres", secretObject, (result: any) => {
        console.log(result);
      });
    } else {
      console.log("PostgreSQL secret exists.");
    }
  });
}

checkSecretExists("github", (res: any) => {
  if (res === false) {
    generateSecrets("github", _SETTINGS.github, (result: any) => {
      console.log(result);
    });
  } else {
    console.log("GitHub secret exists.");
  }
});

if (_SETTINGS.otherSecrets) {
  _SETTINGS.otherSecrets.forEach((secret: any) => {
    const name = Object.keys(secret)[0];
    checkSecretExists(name, (res: any) => {
      if (res === false) {
        generateSecrets(name, secret[name], (result: any) => {
          console.log(result);
        });
      } else {
        console.log(`${name} secret exists.`);
      }
    });
  });
}

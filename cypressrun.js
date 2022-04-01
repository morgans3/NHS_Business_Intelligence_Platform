const cy2 = require("cy2");
const testServerURL = process.env.TEST_SERVER_URL || "http://localhost:1234/";

cy2.run(testServerURL, "cy2").then((res) => {
  console.log(res);
});

/* eslint-disable license-header/header */
import { createDPopHeader } from "./src";
import IsomorphicJoseUtility from "./src/jose/IsomorphicJoseUtility";

const audience = "https://example.app";
const method = "get";

async function test(): Promise<void> {
  try {
    const joseUtility = new IsomorphicJoseUtility();
    const jwk = await joseUtility.generateJWK("RSA", 2048, {
      alg: "RSA",
      use: "sig"
    });
    const result = await createDPopHeader({ jwk, audience, method });
    console.log(result);
  } catch (e) {
    console.error(e.message);
  }
}
test();

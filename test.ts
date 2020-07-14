/* eslint-disable license-header/header */
import { createFetchHeaders, requestToken } from "./src";
import IsomorphicJoseUtility from "./src/jose/IsomorphicJoseUtility";
import { getDPopHeaderCreator } from "./src/createFetchHeaders";

const method = "get";
const url = "https://michielbdejong.solid.community:8443/";
const issuer = "https://solid.community:8443";
const clientId = "coolApp";
const clientSecret = "user:pass";

async function test(): Promise<void> {
  try {
    const joseUtility = new IsomorphicJoseUtility();
    const jwk = await joseUtility.generateJWK("RSA", 2048, {
      alg: "RSA",
      use: "sig"
    });
    const dpopHeaderCreator = getDPopHeaderCreator({ jwk });
    const authToken = await requestToken({
      dpopHeaderCreator,
      issuer,
      clientId,
      clientSecret
    });
    const headers = await createFetchHeaders({
      dpopHeaderCreator,
      authToken,
      url,
      method
    });
    console.log(headers);
    // const result = await fetch(url, { headers });
  } catch (e) {
    console.error(e.message);
  }
}
test();

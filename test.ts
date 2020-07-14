/* eslint-disable license-header/header */
import { createDPopHeader } from "./src";
import NodeStorage from "./src/localStorage/NodeStorage";

const storage = new NodeStorage();
const audience = "https://example.app";
const method = "get";

async function test() {
  try {
    const result = await createDPopHeader({ storage, audience, method });
    console.log(result);
  } catch (e) {
    console.error(e.message);
  }
}
test();

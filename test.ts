/**
 * This project is a continuation of Inrupt's awesome solid-auth-fetcher project,
 * see https://www.npmjs.com/package/@inrupt/solid-auth-fetcher.
 * Copyright 2020 The Solid Project.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import "reflect-metadata";
import IsomorphicJoseUtility from "./src/jose/IsomorphicJoseUtility";
import IssuerConfigFetcher, {
  IIssuerConfigFetcher
} from "./src/login/oidc/IssuerConfigFetcher";
import TokenRequester from "./src/login/oidc/TokenRequester";
import StorageUtility, {
  IStorageUtility
} from "./src/localStorage/StorageUtility";
import fetch from "isomorphic-fetch";
import URL from "url-parse";
import DpopHeaderCreator, {
  IDpopHeaderCreator
} from "./src/dpop/DpopHeaderCreator";
import UuidGenerator from "./src/util/UuidGenerator";
import { IDpopClientKeyManager } from "./src/dpop/DpopClientKeyManager";
import { JSONWebKey } from "jose";
import ClientRegistrar from "./src/login/oidc/ClientRegistrar";
import IJoseUtility from "./src/jose/IJoseUtility";
import Fetcher, { IFetcher } from "./src/util/Fetcher";
import NodeStorage from "./src/localStorage/NodeStorage";
import IStorage from "./src/localStorage/IStorage";
import ILoginOptions from "./src/login/ILoginOptions";
import IClient from "./src/login/oidc/IClient";

const method = "get";
const url = "https://localhost:8443/";
const issuer = "https://localhost:8443";

let joseUtility: IJoseUtility;
let storage: IStorage;
let storageUtility: IStorageUtility;
let fetcher: IFetcher;
let jwk: JSONWebKey;
let dpopHeaderCreator: IDpopHeaderCreator;
let issuerConfigFetcher: IIssuerConfigFetcher;
let loginOptions: ILoginOptions;

async function bootstrap(): Promise<void> {
  storage = new NodeStorage();
  storageUtility = new StorageUtility(storage);

  fetcher = new Fetcher();
  issuerConfigFetcher = new IssuerConfigFetcher(fetcher, storageUtility);
  joseUtility = new IsomorphicJoseUtility();
  jwk = await joseUtility.generateJWK("RSA", 2048, {
    alg: "RSA",
    use: "sig"
  });
  dpopHeaderCreator = new DpopHeaderCreator(
    new IsomorphicJoseUtility(),
    ({
      getClientKey: (): JSONWebKey => {
        return jwk;
      }
    } as unknown) as IDpopClientKeyManager,
    new UuidGenerator()
  );
  loginOptions = {
    localUserId: "alice"
  };
}

async function createFetchHeaders(params: {
  authToken: string;
  url: string;
  method: string;
}): Promise<{ authorization: string; dpop: string }> {
  const dpopHeader = await dpopHeaderCreator.createHeaderToken(
    new URL(params.url),
    params.method
  );
  return {
    authorization: `DPop ${params.authToken}`,
    dpop: dpopHeader
  };
}

async function requestToken(): Promise<string> {
  const requester = new TokenRequester(
    storageUtility,
    issuerConfigFetcher,
    fetcher,
    dpopHeaderCreator,
    new IsomorphicJoseUtility()
  );
  await requester.request("alice", {
    // eslint-disable-next-line @typescript-eslint/camelcase
    grant_type: "refresh_token",
    // eslint-disable-next-line @typescript-eslint/camelcase
    refresh_token: "thisIsARefreshToken"
  });
  return "";
}

async function registerClient(): Promise<void> {
  const clientRegistrar = new ClientRegistrar(fetcher);
  const issuerConfig = await issuerConfigFetcher.fetchConfig(new URL(issuer));
  const client: IClient = await clientRegistrar.getClient(
    loginOptions,
    issuerConfig
  );
  console.log(client);
  await storageUtility.setForUser("alice", "issuer", issuer);
  if (client.clientId) {
    await storageUtility.setForUser("alice", "clientId", client.clientId);
  }
  if (client.clientSecret) {
    await storageUtility.setForUser(
      "alice",
      "clientSecret",
      client.clientSecret
    );
  }
}

async function test(): Promise<void> {
  try {
    await bootstrap();
    await registerClient();
    const authToken = await requestToken();
    // const headers = await createFetchHeaders({
    //   authToken,
    //   url,
    //   method
    // });
    // console.log(headers);
    // // const result = await fetch(url, { headers });
  } catch (e) {
    console.error(e.message);
  }
}
test();

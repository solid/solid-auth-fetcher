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
import { IStorageUtility } from "./src/localStorage/StorageUtility";
import fetch from "isomorphic-fetch";
import URL from "url-parse";
import DpopHeaderCreator, {
  IDpopHeaderCreator
} from "./src/dpop/DpopHeaderCreator";
import UuidGenerator from "./src/util/UuidGenerator";
import { IDpopClientKeyManager } from "./src/dpop/DpopClientKeyManager";
import { JSONWebKey, JWK } from "jose";
import ClientRegistrar from "./src/login/oidc/ClientRegistrar";
import IJoseUtility from "./src/jose/IJoseUtility";
import { IFetcher } from "./src/util/Fetcher";

const method = "get";
const url = "https://michielbdejong.solid.community:8443/";
const issuer = "https://solid.community:8443";
const clientId = "coolApp";
const clientSecret = "user:pass";

let joseUtility: IJoseUtility;
let storageUtility: IStorageUtility;
let fetcher: IFetcher;
let jwk: any;
let dpopHeaderCreator: IDpopHeaderCreator;
let issuerConfigFetcher: IIssuerConfigFetcher;

async function bootstrap(): Promise<void> {
  storageUtility = ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getForUser: (userId: string, key: string, dummy?: boolean): string => {
      if (key === "issuer") {
        return issuer;
      }
      if (key === "clientId") {
        return clientId;
      }
      if (key === "clientSecret") {
        return clientSecret;
      }
      return "";
    },
    safeGet: (key: string, options: any): string | null => {
      console.log("safeGet", key, options);
      return null;
    },
    set: (key: string, value: string): void => {
      console.log("set", key, value);
    }
  } as unknown) as IStorageUtility;

  fetcher = {
    fetch: (url: URL, options: any): any => {
      console.log("fetching", url.toString());
      return fetch(url.toString(), options);
    }
  };
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

async function requestToken(params: {
  issuer: string;
  clientId: string;
  clientSecret: string;
}): Promise<string> {
  const requester = new TokenRequester(
    storageUtility,
    issuerConfigFetcher,
    fetcher,
    dpopHeaderCreator,
    new IsomorphicJoseUtility()
  );
  await requester.request("", {
    // eslint-disable-next-line @typescript-eslint/camelcase
    grant_type: "refresh_token",
    // eslint-disable-next-line @typescript-eslint/camelcase
    refresh_token: "thisIsARefreshToken"
  });
  return "";
}

async function registerClient(): Promise<void> {
  const clientRegistrar = new ClientRegistrar(fetcher);
  // const issuerConfig = issuerConfigFetcher.fetchConfig();
  // clientRegistrar.getClient({}, issuerConfig);
}

async function test(): Promise<void> {
  try {
    await bootstrap();
    await registerClient();
    const authToken = await requestToken({
      issuer,
      clientId,
      clientSecret
    });
    const headers = await createFetchHeaders({
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

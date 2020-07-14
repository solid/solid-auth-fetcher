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

import IsomorphicJoseUtility from "./jose/IsomorphicJoseUtility";
import IssuerConfigFetcher from "./login/oidc/IssuerConfigFetcher";
import { IDpopHeaderCreator } from "./dpop/DpopHeaderCreator";
import TokenRequester from "./login/oidc/TokenRequester";
import { IStorageUtility } from "./localStorage/StorageUtility";
import fetch from "isomorphic-fetch";
import URL from "url-parse";

export async function requestToken(params: {
  dpopHeaderCreator: IDpopHeaderCreator;
  issuer: string;
  clientId: string;
  clientSecret: string;
}): Promise<string> {
  const storageUtility = ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getForUser: (userId: string, key: string, dummy?: boolean): string => {
      if (key === "issuer") {
        return params.issuer;
      }
      if (key === "clientId") {
        return params.clientId;
      }
      if (key === "clientSecret") {
        return params.clientSecret;
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
  // const fetchConfig = async (issuer: URL): Promise<IIssuerConfig> => {
  //   const wellKnownUrl = new URL(issuer.toString());
  //   wellKnownUrl.set("pathname", "/.well-known/openid-configuration");
  //   console.log("fetching", wellKnownUrl.toString());
  //   const issuerConfigRequestBody = await fetch(wellKnownUrl.toString());
  //   const values = await issuerConfigRequestBody.json();
  //   console.log(values, Object.keys(values));
  //   return {
  //     grantTypesSupported: values.grant_types_supported
  //   } as IIssuerConfig;
  // };

  const fetcher = {
    fetch: (url: URL, options: any): any => {
      console.log("fetching", url.toString());
      return fetch(url.toString(), options);
    }
  };
  const requester = new TokenRequester(
    storageUtility,
    new IssuerConfigFetcher(fetcher, storageUtility),
    fetcher,
    params.dpopHeaderCreator,
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

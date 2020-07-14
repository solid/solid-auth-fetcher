/* eslint-disable license-header/header */
import DpopHeaderCreator from "./dpop/DpopHeaderCreator";
import IsomorphicJoseUtility from "./jose/IsomorphicJoseUtility";
import UuidGenerator from "./util/UuidGenerator";
import { IDpopClientKeyManager } from "./dpop/DpopClientKeyManager";
import URL from "url-parse";
import { JSONWebKey } from "jose";

export async function createDPopHeader(params: {
  jwk: JSONWebKey;
  audience: string;
  method: string;
}): Promise<string> {
  const joseUtility = new IsomorphicJoseUtility();
  //   const storageUtility = new StorageUtility(params.storage);
  const dpopClientKeyManager = ({
    getClientKey: (): JSONWebKey => {
      return params.jwk;
    }
  } as unknown) as IDpopClientKeyManager;
  const uuidGenerator = new UuidGenerator();
  const creator = new DpopHeaderCreator(
    joseUtility,
    dpopClientKeyManager,
    uuidGenerator
  );
  return creator.createHeaderToken(new URL(params.audience), params.method);
}

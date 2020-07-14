/* eslint-disable license-header/header */
import DpopHeaderCreator from "./dpop/DpopHeaderCreator";
import IsomorphicJoseUtility from "./jose/IsomorphicJoseUtility";
import UuidGenerator from "./util/UuidGenerator";
import DpopClientKeyManager from "./dpop/DpopClientKeyManager";
import StorageUtility from "./localStorage/StorageUtility";
import IStorage from "./localStorage/IStorage";
import URL from "url-parse";

export async function createDPopHeader(params: {
  storage: IStorage;
  audience: string;
  method: string;
}): Promise<any> {
  const joseUtility = new IsomorphicJoseUtility();
  const storageUtility = new StorageUtility(params.storage);
  const dpopClientKeyManager = new DpopClientKeyManager(
    storageUtility,
    joseUtility
  );
  const uuidGenerator = new UuidGenerator();
  const creator = new DpopHeaderCreator(
    joseUtility,
    dpopClientKeyManager,
    uuidGenerator
  );
  return creator.createHeaderToken(new URL(params.audience), params.method);
}

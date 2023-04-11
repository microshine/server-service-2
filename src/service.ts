import * as x509 from "@peculiar/x509";
import { CryptoKeyStorage, Crypto } from "webcrypto-core";

type CryptoProvider = Crypto & { keyStorage: CryptoKeyStorage; };

export interface IPagination<T> {
  page: number;
  pageSize: number;
  total: number;
  data: T[];
}

export interface IPaginationParams {
  page: number;
  pageSize: number;
}

export interface IKey {
  id: string;
  name: string;
  algorithm: string;
  publicKey: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  certificate?: string;
}

export interface ISignHashParams {
  hash: string;
  algorithm: string;
}

export interface ISignService {
  getListOfKeys(params: IPaginationParams): Promise<IPagination<IKey>>;
  getKeyById(id: string): Promise<IKey>;
  createKey(name: string, algorithm: string): Promise<IKey>;
  deleteKey(id: string): Promise<void>;
  createRequest(id: string): Promise<string>;
  assignCertificate(id: string, certificate: string): Promise<void>;
  signHash(id: string, params: ISignHashParams): Promise<string>;
}

export interface ISignRepository {
  list(params: IPaginationParams): Promise<IPagination<IKey>>;
  add(key: IKey): Promise<IKey>;
  delete(id: string): Promise<void>;
  update(key: IKey): Promise<IKey>;
  find(id: string): Promise<IKey | null>;
}

export class SignService implements ISignService {
  repository: ISignRepository;
  provider: CryptoProvider;

  constructor(repository: ISignRepository, provider: CryptoProvider) {
    this.repository = repository;
    this.provider = provider;
  }

  async getListOfKeys(params: IPaginationParams): Promise<IPagination<IKey>> {
    return this.repository.list(params);
  }

  async getKeyById(id: string): Promise<IKey> {
    const key = await this.repository.find(id);
    if (!key) {
      throw new Error("Key not found");
    }
    return key;
  }

  async createKey(name: string, algorithm: string): Promise<IKey> {
    const keys = await this.provider.subtle.generateKey({
      name: "ECDSA",
      namedCurve: "P-256",
    }, false, ["sign", "verify"]);
    const index = await this.provider.keyStorage.setItem(keys.privateKey);

    // export public key
    const publicKey = await this.provider.subtle.exportKey("spki", keys.publicKey);

    // create Key for storage
    const key: IKey = {
      id: index,
      name,
      algorithm,
      publicKey: Buffer.from(publicKey).toString("base64"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.repository.add(key);
  }

  async deleteKey(id: string): Promise<void> {
    const key = await this.getKeyById(id);
    await this.provider.keyStorage.removeItem(key.id);

    return this.repository.delete(id);
  }

  async createRequest(id: string): Promise<string> {
    const key = await this.getKeyById(id);

    // import public key from storage
    const alg = {
      name: "ECDSA",
      namedCurve: "P-256",
      hash: "SHA-256",
    };
    const publicKey = await this.provider.subtle.importKey("spki", Buffer.from(key.publicKey, "base64"), alg, true, ["verify"]);

    const privateKey = await this.provider.keyStorage.getItem(key.id);

    const request = await x509.Pkcs10CertificateRequestGenerator.create({
      name: "CN=Test",
      keys: {
        publicKey,
        privateKey,
      },
      signingAlgorithm: alg,
    }, this.provider);

    return request.toString("base64");
  }

  async assignCertificate(id: string, certificate: string): Promise<void> {
    const key = await this.getKeyById(id);
    key.certificate = certificate;
    key.updatedAt = new Date().toISOString();

    await this.repository.update(key);
  }

  async signHash(id: string, params: ISignHashParams): Promise<string> {
    const key = await this.getKeyById(id);

    // import private key from storage
    const alg = {
      name: "ECDSA",
      namedCurve: "P-256",
      hash: "SHA-256",
    };
    const privateKey = await this.provider.keyStorage.getItem(key.id);

    const signature = await this.provider.subtle.sign(alg, privateKey, Buffer.from(params.hash, "base64"));

    return Buffer.from(signature).toString("base64");
  }

}
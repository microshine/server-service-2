// создать web-сервер на tsed

import "@tsed/swagger"; // import swagger Ts.ED module
import { Configuration, Controller, Inject, Injectable, ProviderScope, ProviderType } from "@tsed/di";
import { $log, Get, PathParams, QueryParams } from "@tsed/common";
import { PlatformExpress } from "@tsed/platform-express";
import * as schema from "@tsed/schema";
import "@tsed/ajv";
import { IKey, IPagination, IPaginationParams, ISignHashParams, ISignService, SignService } from "./service";
import { crypto } from "./provider_crypto";
import { SignRepository } from "./repo_memory";

abstract class Pagination<T> implements IPagination<T> {
  @schema.Required()
  page!: number;
  @schema.Required()
  pageSize!: number;
  @schema.Required()
  total!: number;
  abstract data: T[];
}

class Key implements IKey {
  @schema.Required()
  id!: string;
  @schema.Required()
  name!: string;
  algorithm!: string;
  publicKey!: string;
  createdAt!: string;
  updatedAt!: string;
  deletedAt?: string;
  certificate?: string;
}

class KeyPagination extends Pagination<Key> {
  @schema.Required()
  @schema.ArrayOf(Key)
  override data!: Key[];
}

class PaginationParams implements IPaginationParams {
  @schema.Description("Page number (starts from 1)")
  @schema.Optional()
  @schema.Default(1)
  page: number = 1;

  @schema.Description("Page size (default 10)")
  @schema.Optional()
  @schema.Default(10)
  pageSize: number = 10;
}

@Injectable({
  type: ProviderType.SERVICE,
  scope: ProviderScope.SINGLETON,
})
class TsedSignService implements ISignService {

  internal = new SignService(new SignRepository(), crypto);

  async getListOfKeys(params: IPaginationParams): Promise<IPagination<IKey>> {
    return this.internal.getListOfKeys(params);
  }
  async getKeyById(id: string): Promise<IKey> {
    return this.internal.getKeyById(id);
  }
  async createKey(name: string, algorithm: string): Promise<IKey> {
    return this.internal.createKey(name, algorithm);
  }
  async deleteKey(id: string): Promise<void> {
    return this.internal.deleteKey(id);
  }
  async createRequest(id: string): Promise<string> {
    return this.internal.createRequest(id);
  }
  async assignCertificate(id: string, certificate: string): Promise<void> {
    return this.internal.assignCertificate(id, certificate);
  }
  async signHash(id: string, params: ISignHashParams): Promise<string> {
    return this.internal.signHash(id, params);
  }

}

@Controller("/")
class SignController {

  constructor(private service: TsedSignService) { }

  // implement
  // app.get("/keys", signController.getListOfKeys.bind(signController));
  // app.get("/keys/:id", signController.getKeyById.bind(signController));
  // app.post("/keys", signController.createKey.bind(signController));
  // app.delete("/keys/:id", signController.deleteKey.bind(signController));
  // app.post("/keys/:id/request", signController.createRequest.bind(signController));
  // app.post("/keys/:id/certificate", signController.assignCertificate.bind(signController));
  // app.post("/keys/:id/sign", signController.signHash.bind(signController));

  @Get("/keys")
  @schema.Returns(200, KeyPagination)
  getListOfKeys(@QueryParams() params: PaginationParams): Promise<KeyPagination> {
    return this.service.getListOfKeys(params);
  }

}

@Configuration({
  mount: {
    "/": [
      SignController // support manual import
    ],
  },
  swagger: [
    {
      path: "/api",
      specVersion: "3.0.3",
    }
  ]
})
export class Server { }

async function bootstrap() {
  try {
    $log.debug("Start server...");
    const platform = await PlatformExpress.bootstrap(Server, {
      // extra settings
    });

    await platform.listen();
    $log.debug("Server initialized");
  } catch (er) {
    $log.error(er);
  }
}

bootstrap();

import { NestFactory } from "@nestjs/core";
import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, Module } from "@nestjs/common";
import { IPagination, IPaginationParams, IKey, SignService } from "./service";
import { SignRepository } from "./repo_memory";
import { crypto } from "./provider_crypto";
import { ApiProperty, DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

// Models
class Pagination<T> implements IPagination<T> {
  @ApiProperty()
  page!: number;
  @ApiProperty()
  pageSize!: number;
  @ApiProperty()
  total!: number;
  @ApiProperty()
  data!: T[];
}

class PaginationParams implements IPaginationParams {
  @ApiProperty()
  page!: number;
  @ApiProperty()
  pageSize!: number;
}

class Key implements IKey {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  algorithm!: string;
  @ApiProperty()
  publicKey!: string;
  createdAt!: string;
  @ApiProperty()
  updatedAt!: string;
  @ApiProperty()
  deletedAt?: string;
  @ApiProperty()
  certificate?: string;
}

class KeyCreateParams {
  @ApiProperty()
  name!: string;
  @ApiProperty()
  algorithm!: string;
}

class AssignCertParams {
  @ApiProperty()
  certificate!: string;
}

class SignHashParams {
  @ApiProperty()
  hash!: string;
  @ApiProperty()
  algorithm!: string;
}

@Controller("keys")
export class SignController {
  private signService: SignService;

  constructor() {
    this.signService = new SignService(new SignRepository(), crypto);
  }

  // @Get()
  // async getListOfKeys(@Param() params: PaginationParams): Promise<Pagination<Key>> {
  //   return this.signService.getListOfKeys(params);
  // };

  // @Get(":id")
  // async getKeyById(@Param("id") id: string): Promise<Key> {
  //   return this.signService.getKeyById(id);
  // };

  // @Post()
  // async createKey(@Body() body: KeyCreateParams): Promise<Key> {
  //   return this.signService.createKey(body.name, body.algorithm);
  // };

  // @Delete(":id")
  // @HttpCode(HttpStatus.NO_CONTENT)  // 204
  // async deleteKey(@Param("id") id: string): Promise<void> {
  //   return this.signService.deleteKey(id);
  // };
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)  // 204
  async deleteKey(@Param() params: string): Promise<void> {
    // return this.signService.deleteKey(id);
  };

  // @Post(":id/request")
  // async createRequest(@Param("id") id: string): Promise<string> {
  //   return this.signService.createRequest(id);
  // };

  // @Post(":id/certificate")
  // async assignCertificate(@Param("id") id: string, @Body() body: AssignCertParams): Promise<void> {
  //   return this.signService.assignCertificate(id, body.certificate);
  // };

  // @Post(":id/sign")
  // async signHash(@Param("id") id: string, @Body() body: SignHashParams): Promise<string> {
  //   return this.signService.signHash(id, body);
  // };

}

@Module({
  controllers: [
    SignController,
  ],
})
export class SignModule { }

async function bootstrap() {
  const app = await NestFactory.create(SignModule);

  const config = new DocumentBuilder()
    .setTitle("Signing service")
    .setDescription("Signing service API")
    .setVersion("1.0")
    .addTag("signing")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(3000);
}

bootstrap();

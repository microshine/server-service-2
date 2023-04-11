import { Request, Response, NextFunction } from "express";
import * as express from "express";
import { SignService } from "./service";
import { SignRepository } from "./repo_memory";
import { crypto } from "./provider_crypto";
class SignController {
  constructor(private signService: SignService) { }

  async getListOfKeys(req: Request, res: Response) {
    const { page, pageSize } = req.query;
    const result = await this.signService.getListOfKeys({
      page: Number(page),
      pageSize: Number(pageSize),
    });
    res.json(result);
  }

  async getKeyById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.signService.getKeyById(id);
    res.json(result);
  }

  async createKey(req: Request, res: Response) {
    const { name, algorithm } = req.body;
    const result = await this.signService.createKey(name, algorithm);
    res.json(result);
  }

  async deleteKey(req: Request, res: Response) {
    const { id } = req.params;
    await this.signService.deleteKey(id);
    res.status(204).send();
  }

  async createRequest(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.signService.createRequest(id);
    res.json(result);
  }

  async assignCertificate(req: Request, res: Response) {
    const { id } = req.params;
    const { certificate } = req.body;
    await this.signService.assignCertificate(id, certificate);
    res.status(204).send();
  }

  async signHash(req: Request, res: Response) {
    const { id } = req.params;
    const { hash, algorithm } = req.body;
    const result = await this.signService.signHash(id, { hash, algorithm });
    res.json(result);
  }

}

const app = express();
const signService = new SignService(new SignRepository(), crypto);
const signController = new SignController(signService);

// Note: Some type changes after @tsed importing breaks the Express types.
// This is why we use @ts-ignore for now.

// middleware to handle errors
// @ts-ignore
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// middleware to log requests
// @ts-ignore
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// @ts-ignore
app.use(express.json());
// @ts-ignore
app.get("/keys", signController.getListOfKeys.bind(signController));
// @ts-ignore
app.get("/keys/:id", signController.getKeyById.bind(signController));
// @ts-ignore
app.post("/keys", signController.createKey.bind(signController));
// @ts-ignore
app.delete("/keys/:id", signController.deleteKey.bind(signController));
// @ts-ignore
app.post("/keys/:id/request", signController.createRequest.bind(signController));
// @ts-ignore
app.post("/keys/:id/certificate", signController.assignCertificate.bind(signController));
// @ts-ignore
app.post("/keys/:id/sign", signController.signHash.bind(signController));

app.listen(3000, () => {
  console.log("Server started");
});

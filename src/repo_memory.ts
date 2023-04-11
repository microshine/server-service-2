import { IPagination, IPaginationParams, ISignRepository, IKey } from "./service";
import * as crypto from "crypto";

interface RepoItem {
  id: string;
};

export class MemoryRepository<T extends RepoItem> {

  private items: T[] = [];

  async list(params: IPaginationParams): Promise<IPagination<T>> {
    const { page, pageSize } = params;
    const total = this.items.length;
    const data = this.items.slice((page - 1) * pageSize, page * pageSize);

    return { page, pageSize, total, data };
  }

  async add(item: T): Promise<T> {
    // item.id is empty, set uuid
    if (!item.id) {
      item.id = crypto.webcrypto.randomUUID();
    }

    this.items.push(item);

    return item;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id);
  }

  async update(item: T): Promise<T> {
    this.items = this.items.map((i) => (i.id === item.id ? item : i));
    return item;
  }

  async find(id: string): Promise<T | null> {
    return this.items.find((item) => item.id === id) || null;
  }

}

export class SignRepository extends MemoryRepository<IKey> implements ISignRepository { }

import { Inject, Injectable } from "@nestjs/common";
import { Database } from "../database";

@Injectable()
export class PublicDatasetService {
  constructor(@Inject(Database) private readonly db: Database) {}

  listPublished() {
    return this.db.publicDataset.findMany({
      where: { published: true },
      orderBy: [{ category: "asc" }, { title: "asc" }],
      select: {
        slug: true,
        title: true,
        summary: true,
        category: true,
        version: true,
        format: true,
        license: true,
        licenseUrl: true,
        sourceName: true,
        sourceUrl: true,
        recordCount: true,
        updatedAt: true,
      },
    });
  }
}

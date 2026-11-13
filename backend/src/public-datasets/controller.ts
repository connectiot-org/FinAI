import { Controller, Get, Inject, Query } from "@nestjs/common";
import { z } from "zod";
import { parse } from "../validation";
import { PublicDatasetService } from "./service";

const empty = z.strictObject({});

@Controller("api/v1/public/datasets")
export class PublicDatasetController {
  constructor(
    @Inject(PublicDatasetService) private readonly service: PublicDatasetService,
  ) {}

  @Get()
  async list(@Query() query: unknown) {
    parse(empty, query);
    return { datasets: await this.service.listPublished() };
  }
}

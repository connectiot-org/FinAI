import { prisma } from "../db/client";
import { Role } from "@prisma/client";

export class UserService {
  async getByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findOrCreateUser(email: string, name?: string, role: Role = Role.USER) {
    const normalized = email.toLowerCase();
    return prisma.user.upsert({
      where: { email: normalized },
      update: { name: name || undefined },
      create: {
        email: normalized,
        name,
        role,
      },
    });
  }
}

export const userService = new UserService();

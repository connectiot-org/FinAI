import { prisma } from "../db/client";
import { Role } from "@prisma/client";

export class UserService {
  async getByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async createUser(email: string, name?: string, passwordHash?: string) {
    return prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: Role.USER,
      },
    });
  }
}

export const userService = new UserService();

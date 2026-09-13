import { prisma } from "../db/client";
import { ApiError } from "../api/errors";
import { MessagePart } from "../domain/conversation";

export interface CreateConversationInput {
  userId: string;
  title?: string;
}

export interface AppendMessageInput {
  conversationId: string;
  userId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  parts: MessagePart[];
  aiRequestId?: string;
}

export class ConversationService {
  async listConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        deletedAt: null,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    if (conversation.userId !== userId) {
      throw ApiError.forbidden("Access denied to conversation");
    }

    return conversation;
  }

  async createConversation(input: CreateConversationInput) {
    return prisma.conversation.create({
      data: {
        userId: input.userId,
        title: input.title || "New Financial Thread",
      },
    });
  }

  async renameConversation(conversationId: string, userId: string, newTitle: string) {
    // Assert ownership
    await this.getConversation(conversationId, userId);

    return prisma.conversation.update({
      where: { id: conversationId },
      data: { title: newTitle.trim().slice(0, 200) },
    });
  }

  async softDeleteConversation(conversationId: string, userId: string) {
    // Assert ownership
    await this.getConversation(conversationId, userId);

    return prisma.conversation.update({
      where: { id: conversationId },
      data: { deletedAt: new Date() },
    });
  }

  async appendMessage(input: AppendMessageInput) {
    // Assert ownership
    await this.getConversation(input.conversationId, input.userId);

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: input.conversationId,
          role: input.role,
          parts: input.parts as unknown as object,
          aiRequestId: input.aiRequestId,
        },
      }),
      prisma.conversation.update({
        where: { id: input.conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }
}

export const conversationService = new ConversationService();

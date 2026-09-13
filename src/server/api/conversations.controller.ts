import { z } from "zod";
import { conversationService } from "../services/conversation-service";
import { apiSuccess, apiError } from "./envelope";
import { createRequestContext } from "./request-context";
import { NextRequest } from "next/server";

const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
});

const renameConversationSchema = z.object({
  title: z.string().min(1).max(200),
});

export class ConversationsController {
  static async list(req: NextRequest, userId: string) {
    const { requestId } = createRequestContext(req);
    try {
      const list = await conversationService.listConversations(userId);
      return apiSuccess(list, requestId);
    } catch (err) {
      return apiError(err, requestId);
    }
  }

  static async create(req: NextRequest, userId: string) {
    const { requestId } = createRequestContext(req);
    try {
      const body = await req.json().catch(() => ({}));
      const parsed = createConversationSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(new Error("Invalid conversation payload"), requestId);
      }
      const conversation = await conversationService.createConversation({
        userId,
        title: parsed.data.title,
      });
      return apiSuccess(conversation, requestId, 201);
    } catch (err) {
      return apiError(err, requestId);
    }
  }

  static async get(req: NextRequest, userId: string, conversationId: string) {
    const { requestId } = createRequestContext(req);
    try {
      const conversation = await conversationService.getConversation(conversationId, userId);
      return apiSuccess(conversation, requestId);
    } catch (err) {
      return apiError(err, requestId);
    }
  }

  static async rename(req: NextRequest, userId: string, conversationId: string) {
    const { requestId } = createRequestContext(req);
    try {
      const body = await req.json();
      const parsed = renameConversationSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(new Error("Title must be between 1 and 200 characters"), requestId);
      }
      const updated = await conversationService.renameConversation(
        conversationId,
        userId,
        parsed.data.title
      );
      return apiSuccess(updated, requestId);
    } catch (err) {
      return apiError(err, requestId);
    }
  }

  static async delete(req: NextRequest, userId: string, conversationId: string) {
    const { requestId } = createRequestContext(req);
    try {
      await conversationService.softDeleteConversation(conversationId, userId);
      return apiSuccess({ deleted: true }, requestId);
    } catch (err) {
      return apiError(err, requestId);
    }
  }
}

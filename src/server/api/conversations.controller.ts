import { z } from "zod";
import { conversationService } from "../services/conversation-service";
import { auditService } from "../services/audit-service";
import { apiSuccess, apiError } from "./envelope";
import { ApiError } from "./errors";
import { createRequestContext } from "./request-context";
import { NextRequest } from "next/server";

const createConversationSchema = z.object({
  title: z.string().trim().max(200).optional(),
});

const renameConversationSchema = z.object({
  title: z.string().trim().min(1).max(200),
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
      // Unparseable JSON must be a 400, not a silently-created default thread.
      const body = await req.json().catch(() => null);
      if (body === null || typeof body !== "object") {
        return apiError(
          ApiError.validation("Request body must be a valid JSON object"),
          requestId
        );
      }
      const parsed = createConversationSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(
          ApiError.validation("Invalid conversation payload", parsed.error.flatten()),
          requestId
        );
      }
      const conversation = await conversationService.createConversation({
        userId,
        title: parsed.data.title,
      });
      void auditService.log({
        actorId: userId,
        action: "CONVERSATION_CREATED",
        targetType: "conversation",
        targetId: conversation.id,
        requestId,
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
      const body = await req.json().catch(() => null);
      if (body === null || typeof body !== "object") {
        return apiError(
          ApiError.validation("Request body must be a valid JSON object"),
          requestId
        );
      }
      const parsed = renameConversationSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(
          ApiError.validation("Title must be between 1 and 200 characters (after trimming)"),
          requestId
        );
      }
      const updated = await conversationService.renameConversation(
        conversationId,
        userId,
        parsed.data.title
      );
      void auditService.log({
        actorId: userId,
        action: "CONVERSATION_RENAMED",
        targetType: "conversation",
        targetId: conversationId,
        requestId,
      });
      return apiSuccess(updated, requestId);
    } catch (err) {
      return apiError(err, requestId);
    }
  }

  static async delete(req: NextRequest, userId: string, conversationId: string) {
    const { requestId } = createRequestContext(req);
    try {
      await conversationService.softDeleteConversation(conversationId, userId);
      void auditService.log({
        actorId: userId,
        action: "CONVERSATION_DELETED",
        targetType: "conversation",
        targetId: conversationId,
        requestId,
      });
      return apiSuccess({ deleted: true }, requestId);
    } catch (err) {
      return apiError(err, requestId);
    }
  }
}

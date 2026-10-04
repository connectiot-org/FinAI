import { NextRequest } from "next/server";
import { ConversationsController } from "@/server/api/conversations.controller";
import { requireUser } from "@/server/api/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;
  return ConversationsController.list(req, user.id);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (response) return response;
  return ConversationsController.create(req, user.id);
}

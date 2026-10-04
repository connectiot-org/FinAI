import { NextRequest } from "next/server";
import { ConversationsController } from "@/server/api/conversations.controller";
import { requireUser } from "@/server/api/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, response } = await requireUser(req);
  if (response) return response;
  return ConversationsController.get(req, user.id, id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, response } = await requireUser(req);
  if (response) return response;
  return ConversationsController.rename(req, user.id, id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, response } = await requireUser(req);
  if (response) return response;
  return ConversationsController.delete(req, user.id, id);
}

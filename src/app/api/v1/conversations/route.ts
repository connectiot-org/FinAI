import { NextRequest } from "next/server";
import { ConversationsController } from "@/server/api/conversations.controller";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  return ConversationsController.list(req, user.id);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  return ConversationsController.create(req, user.id);
}

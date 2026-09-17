import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";

// In-memory server cache for environments without a live PostgreSQL database
const serverDatasetRegistry = new Map<string, any>();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id || session.user.email : "anonymous";
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");

  if (threadId) {
    const dataset = serverDatasetRegistry.get(`ds-${threadId}`);
    return NextResponse.json({ data: dataset || null });
  }

  const all = Array.from(serverDatasetRegistry.values()).filter(
    (ds) => !ds.userId || ds.userId === userId
  );

  return NextResponse.json({
    data: all,
    count: all.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id || session.user.email : "anonymous";
    const body = await req.json();

    if (!body || !body.filename) {
      return NextResponse.json(
        { error: "Dataset filename and metadata are required" },
        { status: 400 }
      );
    }

    const id = body.id || `ds-${body.threadId || Date.now()}`;
    const record = {
      ...body,
      id,
      userId,
      uploadedAt: new Date().toISOString(),
    };

    serverDatasetRegistry.set(id, record);

    return NextResponse.json({
      success: true,
      data: {
        id,
        filename: body.filename,
        rowCount: body.rowCount,
        columnsCount: body.columns?.length || 0,
        companies: body.companies || [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to persist dataset" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  const id = searchParams.get("id");

  const targetId = id || (threadId ? `ds-${threadId}` : null);
  if (targetId) {
    serverDatasetRegistry.delete(targetId);
  }

  return NextResponse.json({ success: true });
}

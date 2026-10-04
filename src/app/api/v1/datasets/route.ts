import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { rateLimit, clientIpFrom } from "@/server/infra/rate-limiter";
import { z } from "zod";

/**
 * Server-side dataset registry.
 *
 * This is a best-effort, in-process registry for environments without a live
 * database. It is intentionally bounded (max entries + per-entry payload cap +
 * TTL) so it cannot be used for memory exhaustion. It is NOT durable: entries
 * are lost on cold start and are not shared between instances. Durable
 * storage requires DATABASE_URL (see Prisma schema).
 */

const MAX_REGISTRY_ENTRIES = 500;
const MAX_TEXT_LENGTH = 100_000; // ~100KB per dataset payload
const ENTRY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface StoredDataset {
  id: string;
  threadId: string;
  userId: string;
  filename: string;
  rowCount: number;
  columns: string[];
  companies: string[];
  yearMin?: number;
  yearMax?: number;
  textContent: string;
  uploadedAt: number;
}

const registry = new Map<string, StoredDataset>();

function evictExpired(now = Date.now()) {
  for (const [key, entry] of registry) {
    if (now - entry.uploadedAt > ENTRY_TTL_MS) {
      registry.delete(key);
    }
  }
}

function canRead(entry: StoredDataset, ownerId: string): boolean {
  return entry.userId === ownerId;
}

/** Effective dataset owner identity. Authenticated users own by user id;
 * anonymous visitors are scoped per client IP so that different visitors
 * cannot read/overwrite/delete each other's datasets (previously ALL guests
 * shared the single "guest" identity). Visitors behind the same NAT/IP still
 * share a bucket — documented limitation of the in-memory registry. */
function datasetOwnerId(userId: string, isGuest: boolean, headers: Headers): string {
  return isGuest ? `guest:${clientIpFrom(headers)}` : userId;
}

const postSchema = z.object({
  id: z.string().max(120).optional(),
  threadId: z.string().max(120),
  userId: z.string().max(200).optional(), // informational only — server identity wins
  filename: z.string().min(1).max(255),
  rowCount: z.number().int().min(0).max(10_000_000).optional(),
  columns: z.array(z.string().max(255)).max(500).optional(),
  companies: z.array(z.string().max(200)).max(5000).optional(),
  yearMin: z.number().int().optional(),
  yearMax: z.number().int().optional(),
  textContent: z.string().max(MAX_TEXT_LENGTH).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const ownerId = datasetOwnerId(user.id, user.isGuest, req.headers);
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");

  evictExpired();

  if (threadId) {
    // Ownership check: a dataset can only be read by the identity that wrote it.
    const entry = registry.get(`ds-${threadId}`);
    if (!entry || !canRead(entry, ownerId)) {
      return NextResponse.json({ data: null });
    }
    return NextResponse.json({ data: entry });
  }

  const all = Array.from(registry.values()).filter((ds) =>
    canRead(ds, ownerId)
  );
  return NextResponse.json({ data: all, count: all.length });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  const rl = rateLimit(
    `datasets:${user.isGuest ? `ip:${clientIpFrom(req.headers)}` : user.id}`,
    30,
    60_000
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many dataset uploads. Try again shortly." } },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid dataset payload" } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const id = data.id && data.id.startsWith("ds-") ? data.id : `ds-${data.threadId}`;

    evictExpired();
    if (registry.size >= MAX_REGISTRY_ENTRIES && !registry.has(id)) {
      return NextResponse.json(
        { error: { code: "REGISTRY_FULL", message: "Dataset registry is at capacity" } },
        { status: 507 }
      );
    }

    // The server-side identity is authoritative — client-supplied userId is ignored.
    const record: StoredDataset = {
      id,
      threadId: data.threadId,
      userId: datasetOwnerId(user.id, user.isGuest, req.headers),
      filename: data.filename,
      rowCount: data.rowCount ?? 0,
      columns: (data.columns ?? []).slice(0, 500),
      companies: (data.companies ?? []).slice(0, 5000),
      yearMin: data.yearMin,
      yearMax: data.yearMax,
      textContent: (data.textContent ?? "").slice(0, MAX_TEXT_LENGTH),
      uploadedAt: Date.now(),
    };

    registry.set(id, record);

    return NextResponse.json({
      success: true,
      data: {
        id,
        filename: record.filename,
        rowCount: record.rowCount,
        columnsCount: record.columns.length,
        companies: record.companies,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to persist dataset" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  const ownerId = datasetOwnerId(user.id, user.isGuest, req.headers);
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  const id = searchParams.get("id");

  const targetId = id || (threadId ? `ds-${threadId}` : null);
  if (targetId) {
    // Ownership check: only the writer may delete.
    const entry = registry.get(targetId);
    if (!entry || !canRead(entry, ownerId)) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Dataset not found" } },
        { status: 404 }
      );
    }
    registry.delete(targetId);
  }

  return NextResponse.json({ success: true });
}

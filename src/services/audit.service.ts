import { desc, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { auditLog } from '../db/schema.js';

export interface AuditEntry {
  id?: number;
  guildId: string;
  actorId: string;
  action: string;
  targetId?: string | null;
  metadataJson?: Record<string, unknown> | null;
  createdAt?: number;
}

export class AuditService {
  constructor(private readonly db: Db) {}

  async record(entry: AuditEntry): Promise<void> {
    this.db
      .insert(auditLog)
      .values({
        guildId: entry.guildId,
        actorId: entry.actorId,
        action: entry.action,
        targetId: entry.targetId ?? null,
        metadataJson: entry.metadataJson ?? null,
        createdAt: entry.createdAt ?? Date.now(),
      })
      .run();
  }

  async list(guildId: string, limit = 20): Promise<AuditEntry[]> {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    return this.db
      .select()
      .from(auditLog)
      .where(eq(auditLog.guildId, guildId))
      .orderBy(desc(auditLog.createdAt))
      .limit(safeLimit);
  }
}

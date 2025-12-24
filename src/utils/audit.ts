import { nanoid } from 'nanoid';
import { db } from '../db';
import type { AuditAction } from '../types';

export const logAudit = async (
  entityType: string,
  entityId: string,
  action: AuditAction,
  summary: string
) => {
  await db.auditLog.add({
    id: nanoid(),
    timestamp: new Date().toISOString(),
    entityType,
    entityId,
    action,
    summary
  });
};

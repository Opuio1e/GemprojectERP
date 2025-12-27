import { nanoid } from 'nanoid';
import { insertRow } from '../db';
import type { AuditAction, AuditLog } from '../types';

export const logAudit = async (
  entityType: string,
  entityId: string,
  action: AuditAction,
  summary: string
) => {
  const entry: AuditLog = {
    id: nanoid(),
    timestamp: new Date().toISOString(),
    entityType,
    entityId,
    action,
    summary
  };
  await insertRow('audit_log', entry);
};

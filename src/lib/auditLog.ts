import { prisma } from "@/lib/prisma";

export async function createAuditLog(params: {
    entityType: string;
    entityId: string;
    action: string;
    performedBy: string;
    previousState?: string;
    newState?: string;
    ipAddress?: string;
}) {
    return prisma.auditLog.create({
        data: {
            entity_type: params.entityType,
            entity_id: params.entityId,
            action: params.action,
            performed_by: params.performedBy,
            previous_state: params.previousState || null,
            new_state: params.newState || null,
            ip_address: params.ipAddress || null,
        },
    });
}

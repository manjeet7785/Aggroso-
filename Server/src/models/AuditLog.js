import mongoose from 'mongoose'
const auditLogSchema = new mongoose.Schema({ action: String, artifact: String, rawResponse: mongoose.Schema.Types.Mixed, releaseVersionId: mongoose.Schema.Types.ObjectId, createdAt: { type: Date, default: Date.now } })
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)

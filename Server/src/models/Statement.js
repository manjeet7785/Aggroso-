import mongoose from 'mongoose'

const citationSchema = new mongoose.Schema({ type: { type: String, enum: ['item', 'qa'], required: true }, id: { type: String, required: true } }, { _id: false })
const statementSchema = new mongoose.Schema({
  sid: { type: String, unique: true, required: true }, text: { type: String, required: true }, kind: { type: String, enum: ['claim', 'risk', 'limitation'], required: true },
  citations: [citationSchema], dependsOn: [String], status: { type: String, enum: ['proposed', 'approved', 'rejected', 'stale', 'unverified'], default: 'proposed' },
  humanEdited: { type: Boolean, default: false }, staleReason: String, inputFingerprint: String, promptVersion: String, model: String,
  releaseVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReleaseVersion', required: true },
}, { timestamps: true })
export const Statement = mongoose.models.Statement || mongoose.model('Statement', statementSchema)

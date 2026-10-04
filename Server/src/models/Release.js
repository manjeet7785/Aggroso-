import mongoose from 'mongoose'

const itemSchema = new mongoose.Schema({
  itemId: { type: String, required: true }, text: { type: String, required: true }, userGroups: [String], severity: String,
  evidenceRefs: [String], aiImpact: { type: String, enum: ['high', 'medium', 'low', null], default: null },
  humanImpact: { type: String, enum: ['high', 'medium', 'low', null], default: null },
}, { _id: false })

const evidenceSchema = new mongoose.Schema({
  evidenceId: { type: String, required: true }, kind: String, description: String,
  status: { type: String, enum: ['passed', 'failed', 'not_run'], required: true }, itemRefs: [String],
}, { _id: false })

const releaseSchema = new mongoose.Schema({ title: { type: String, required: true, trim: true }, ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, createdAt: { type: Date, default: Date.now } })
const versionSchema = new mongoose.Schema({
  releaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Release', required: true }, versionNumber: { type: Number, required: true },
  parentVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReleaseVersion', default: null }, status: { type: String, enum: ['draft', 'in_review', 'final'], default: 'draft' },
  package: { features: [itemSchema], bugFixes: [itemSchema], changedBehaviour: [itemSchema], knownLimitations: [itemSchema], qaSummary: String, migrationNotes: String, affectedUserGroups: [String] },
  evidence: [evidenceSchema], sectionHashes: { type: mongoose.Schema.Types.Mixed, default: {} }, frozenAt: Date,
}, { timestamps: true })
versionSchema.index({ releaseId: 1, versionNumber: 1 }, { unique: true })

export const Release = mongoose.models.Release || mongoose.model('Release', releaseSchema)
export const ReleaseVersion = mongoose.models.ReleaseVersion || mongoose.model('ReleaseVersion', versionSchema)

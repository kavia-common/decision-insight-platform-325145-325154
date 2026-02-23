const { z } = require('zod');

const uuid = z.string().uuid();

const authSignupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(64).optional(),
  displayName: z.string().min(1).max(128).optional(),
  password: z.string().min(8).max(256),
});

const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(256),
});

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

const decisionsListQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1).max(200).optional(),
  status: z.enum(['open', 'closed', 'archived']).optional(),
});

const decisionCreateSchema = z.object({
  title: z.string().min(1).max(500),
  context: z.string().max(10_000).optional(),
  decisionDate: z.string().optional(), // ISO date string; DB casts
  status: z.enum(['open', 'closed', 'archived']).optional(),
  options: z.array(z.any()).optional(),
  criteria: z.array(z.any()).optional(),
  expectedOutcome: z.string().max(10_000).optional(),
  selectedOption: z.any().optional(),
  confidence: z.number().min(0).max(100).optional(),
  riskLevel: z.string().max(50).optional(),
  importance: z.number().int().min(1).max(5).optional(),
  timeHorizon: z.string().max(50).optional(),
  notes: z.string().max(20_000).optional(),
});

const decisionUpdateSchema = decisionCreateSchema.partial();

const outcomeCreateSchema = z.object({
  outcomeDate: z.string().optional(),
  status: z.enum(['observed', 'final', 'revised']).optional(),
  summary: z.string().max(10_000).optional(),
  metrics: z.record(z.any()).optional(),
  satisfaction: z.number().min(0).max(100).optional(),
  lessonsLearned: z.string().max(20_000).optional(),
});

const outcomeUpdateSchema = outcomeCreateSchema.partial();

const similaritySearchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

module.exports = {
  uuid,
  authSignupSchema,
  authLoginSchema,
  decisionsListQuerySchema,
  decisionCreateSchema,
  decisionUpdateSchema,
  outcomeCreateSchema,
  outcomeUpdateSchema,
  similaritySearchSchema,
  auditQuerySchema,
};

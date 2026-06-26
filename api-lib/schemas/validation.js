import { z } from 'zod';

// Chat message schema
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty')
});

// Chat request schema
export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, 'At least one message is required'),
  agent: z.enum([
    'auto',
    'product_intelligence',
    'recommendation',
    'compatibility_agent',
    'sales_coach',
    'market_intelligence',
    'news_agent',
    'forecast_agent',
    'solution_designer',
    'quotation_agent',
    'inventory_agent',
    'enterprise_agent',
    'troubleshoot_agent',
    'learning_agent',
    'dealer_agent',
    'sales_practice'
  ]).optional().default('auto'),
  stream: z.boolean().optional().default(true),
  language: z.enum(['en', 'mr', 'hi']).optional()
});

// Product image query parameters schema
export const productImageQuerySchema = z.object({
  model: z.string({
    required_error: 'model query param required'
  }).trim().min(1, 'model query param required'),
  redirect: z.union([z.string(), z.boolean()]).optional().transform((val) => {
    if (typeof val === 'boolean') return val;
    return val === '1' || val === 'true';
  })
});

// Market query parameters schema
export const marketQuerySchema = z.object({
  category: z.string().optional(),
  lang: z.enum(['en', 'mr', 'hi']).optional().default('en')
});

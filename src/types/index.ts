export interface ProductSpecs {
  processor?: string;
  gpu?: string;
  ram?: string;
  storage?: string;
  display?: string;
  os?: string;
  connectivity?: string;
  ports?: string;
  power?: string;
  weight?: string;
  battery?: string;
  [key: string]: string | undefined;
}

export interface ProductPricing {
  mrp: number;
  street_price_approx: number;
}

export interface CatalogueData {
  in_stock: boolean;
  warranty_years: number;
  categories: string[];
}

export interface Compatibility {
  compatible_accessories: string[];
}

export interface ProductKnowledge {
  target_persona: string[];
  use_cases: string[];
  selling_points: string[];
  common_objections?: string[];
  objection_responses?: Record<string, string>;
}

export interface ProductMetadata {
  last_updated: string;
  data_source: string;
}

export interface Product {
  id: string;
  brand: string;
  model: string;
  category: 'laptop' | 'desktop' | 'printer' | 'server' | 'storage' | 'networking' | string;
  subcategory?: string;
  specs: ProductSpecs;
  pricing: ProductPricing;
  street_price_approx?: number; // legacy fallback support
  catalogue_data: CatalogueData;
  compatibility: Compatibility;
  knowledge: ProductKnowledge;
  metadata: ProductMetadata;
  embedding?: number[] | string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  time?: string;
  agentIcon?: string;
  confidence?: number;
  isStreaming?: boolean;
}

export interface Session {
  id: string;
  agentId: string;
  agentName: string;
  messages: ChatMessage[];
  preview: string;
  updatedAt: string;
}

export interface Playbook {
  id: string;
  category: string;
  subcategory?: string;
  keywords: string[];
  title: string;
  discovery_questions: string[];
  qualification_checklist: string[];
  pitch_formats: Record<string, string>;
  objection_handling: Record<string, string>;
  cross_sell: string[];
  upsell?: string;
  closing_techniques: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string[];
  date: string;
  ai_summary: string;
  key_highlights: string[];
  business_impact: string;
  technical_impact: string;
  related_products: string[];
  source: string;
  confidence: string;
  title_mr?: string;
  title_hi?: string;
  ai_summary_mr?: string;
  ai_summary_hi?: string;
  key_highlights_mr?: string[];
  key_highlights_hi?: string[];
  business_impact_mr?: string;
  business_impact_hi?: string;
  technical_impact_mr?: string;
  technical_impact_hi?: string;
}

export interface SolutionTemplate {
  id: string;
  use_case: string;
  use_case_mr?: string;
  use_case_hi?: string;
  keywords: string[];
  budget_range: {
    min: number;
    max: number;
  };
  description: string;
  description_mr?: string;
  description_hi?: string;
  components: Array<{
    item: string;
    qty: number;
    category: string;
    specs_required?: string;
  }>;
}

export interface MarketCategory {
  name: string;
  demand_index: Array<{ month: string; value: number }>;
  price_trend: { current_avg: number; directional_trend: 'up' | 'down' | 'stable' };
  brands: Array<{ name: string; share: number }>;
  top_products: string[];
  seasonal_pattern: string;
  seasonal_pattern_mr?: string;
  seasonal_pattern_hi?: string;
  forecast: {
    outlook: string;
    description: string;
    description_mr?: string;
    description_hi?: string;
    disclaimer?: string;
    disclaimer_mr?: string;
    disclaimer_hi?: string;
  };
}

export interface MarketData {
  categories: MarketCategory[];
  market_summary: {
    overall_trends: string;
    overall_trends_mr?: string;
    overall_trends_hi?: string;
    last_updated: string;
  };
}

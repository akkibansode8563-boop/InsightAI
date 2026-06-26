import dbAdapter from '../db/DatabaseAdapter.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean' | 'array';
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

// Tool schema definitions for Gemini/Groq function calling
export const TOOL_SCHEMAS: ToolDefinition[] = [
  {
    name: 'checkInventory',
    description: 'Check stock availability and warranty info for a given product model name.',
    parameters: {
      type: 'object',
      properties: {
        modelName: {
          type: 'string',
          description: 'The exact or partial model name of the IT hardware product.'
        }
      },
      required: ['modelName']
    }
  },
  {
    name: 'calculateDealerMargin',
    description: 'Calculate product margin, net profit, and ROI for dealer pricing proposals.',
    parameters: {
      type: 'object',
      properties: {
        mrp: {
          type: 'number',
          description: 'The manufacturer suggested retail price (MRP) in INR.'
        },
        dealerCost: {
          type: 'number',
          description: 'The purchase cost / wholesale cost to the dealer in INR.'
        },
        quantity: {
          type: 'number',
          description: 'Optional quantity of units in the deal.'
        }
      },
      required: ['mrp', 'dealerCost']
    }
  },
  {
    name: 'getMarketTrends',
    description: 'Fetch seasonal patterns, average prices, and brand shares for a hardware category.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Hardware category name (e.g. laptop, server, printer, networking, storage, ups).',
          enum: ['laptop', 'desktop', 'printer', 'server', 'networking', 'storage', 'ups']
        }
      },
      required: ['category']
    }
  }
];

// Local tool execution handlers
export const TOOL_HANDLERS = {
  checkInventory: async (args: { modelName: string }) => {
    try {
      const match = await dbAdapter.searchProducts(args.modelName);
      if (match.length === 0) {
        return { error: `Product model "${args.modelName}" not found in our catalog.` };
      }
      const prod = match[0];
      return {
        model: prod.model,
        brand: prod.brand,
        inStock: prod.catalogue_data?.in_stock ? 'Yes' : 'No',
        warrantyYears: prod.catalogue_data?.warranty_years || 1,
        mrp: prod.pricing?.mrp,
        streetPriceApprox: prod.pricing?.street_price_approx
      };
    } catch (err: any) {
      return { error: `Failed to check inventory: ${err.message}` };
    }
  },

  calculateDealerMargin: async (args: { mrp: number; dealerCost: number; quantity?: number }) => {
    const qty = args.quantity || 1;
    const grossProfit = args.mrp - args.dealerCost;
    const marginPercent = (grossProfit / args.mrp) * 100;
    const totalMRP = args.mrp * qty;
    const totalCost = args.dealerCost * qty;
    const totalProfit = grossProfit * qty;
    const gstRate = 18;
    const gstAmount = Math.round(totalMRP * (gstRate / 100));
    
    return {
      unitMRP: args.mrp,
      unitDealerCost: args.dealerCost,
      marginPercent: Math.round(marginPercent * 100) / 100,
      totalMRP,
      totalCost,
      totalProfit,
      gstRate,
      gstAmount,
      grandTotalWithGST: totalMRP + gstAmount
    };
  },

  getMarketTrends: async (args: { category: string }) => {
    try {
      const mktData = await dbAdapter.getMarketData(args.category, 'en');
      if (!mktData || !mktData.categories || mktData.categories.length === 0) {
        return { error: `No market trends data available for category "${args.category}".` };
      }
      const catData = mktData.categories[0];
      return {
        categoryName: catData.name,
        currentAveragePrice: catData.price_trend?.current_avg,
        priceDirection: catData.price_trend?.directional_trend,
        topBrands: catData.brands?.slice(0, 3).map((b: any) => `${b.name} (${b.share}%)`),
        seasonalPatternSummary: catData.seasonal_pattern,
        forecastOutlook: catData.forecast?.outlook
      };
    } catch (err: any) {
      return { error: `Failed to fetch market trends: ${err.message}` };
    }
  }
};

/**
 * Executes a function call from the LLM and returns the structured result
 */
export async function executeTool(name: string, args: any): Promise<any> {
  const handler = (TOOL_HANDLERS as Record<string, Function>)[name];
  if (!handler) {
    return { error: `Function "${name}" is not registered on this system.` };
  }
  console.log(`Executing tool: ${name} with args:`, args);
  return handler(args);
}

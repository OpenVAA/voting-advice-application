import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { LLMProvider } from '../src/llm-providers/llmProvider';

describe('OpenAI LLMProvider', () => {
  const providerConfig = {
    provider: 'openai' as const,
    apiKey: 'your-api-key'
  };

  if (!providerConfig.apiKey) {
    console.warn('OPENAI_API_KEY not found, skipping OpenAI tests.');
    return;
  }

  const llmProvider = new LLMProvider({ ...providerConfig, modelConfig: { primary: 'gpt-4o-mini' } });

  it('should generate an object with generateObject', async () => {
    const result = await llmProvider.generateObject({
      modelConfig: {
        primary: 'gpt-4o-mini'
      },
      schema: z.object({
        recipe: z.object({
          name: z.string(),
          ingredients: z.array(z.string()),
          steps: z.array(z.string())
        })
      }),
      messages: [{ role: 'user', content: 'Generate a lasagna recipe.' }]
    });

    expect(result.object.recipe).toBeDefined();
    expect(result.object.recipe.name).toContain('Lasagna');
    expect(result.object.recipe.ingredients.length).toBeGreaterThan(0);
    expect(result.object.recipe.steps.length).toBeGreaterThan(0);
    expect(result.costs.total).toBeGreaterThan(0);
  }, 30000);

  it('should stream text with streamText', async () => {
    const result = llmProvider.streamText({
      modelConfig: {
        primary: 'gpt-4o-mini'
      },
      messages: [{ role: 'user', content: 'Invent a new holiday and describe its traditions.' }]
    });

    let fullText = '';
    for await (const textPart of result.textStream) {
      fullText += textPart;
    }

    expect(fullText.length).toBeGreaterThan(50);

    const usage = await result.usage;
    expect(usage.totalTokens).toBeGreaterThan(0);

    const costs = await result.costs;
    expect(costs.total).toBeGreaterThan(0);
  }, 30000);
});

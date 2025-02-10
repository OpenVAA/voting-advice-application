import { Condenser } from '../src/Condenser';
import { OpenAIProvider } from '@openvaa/llm';
import { config } from 'dotenv';
import path from 'path';

// Load .env from project root
config({ path: path.resolve(__dirname, '../../../../.env') });

describe('Condenser', () => {
  let condenser: Condenser;

  beforeAll(() => {
    console.log('Environment variables:', process.env);
    const apiKey = process.env.OPENAI_API_KEY; // Note: OPEN_AI_API_KEY not OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    const provider = new OpenAIProvider({ apiKey });
    condenser = new Condenser(provider);
  });

  it('should process comments', async () => {
    const comments = [
      'The implementation of universal basic income would significantly impact our economy.',
      'It would provide a safety net for all citizens.',
      'Critics argue it might reduce work incentives.'
    ];

    const result = await condenser.processComments(comments, 'Universal Basic Income', comments.length);
    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBe(true);
  }, 30000);
});

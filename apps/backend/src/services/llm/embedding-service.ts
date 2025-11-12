import { openaiClient } from './openai-client.js';
import { LLMError } from '../../middleware/error-handler.js';

export class EmbeddingService {
  async generate(text: string): Promise<number[]> {
    try {
      return await openaiClient.createEmbedding(text);
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new LLMError('Failed to generate embedding', error);
    }
  }

  formatBugText(title: string, description: string): string {
    return `${title}\n\n${description}`;
  }
}

export const embeddingService = new EmbeddingService();


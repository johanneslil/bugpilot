import OpenAI from 'openai';
import { LLMError } from '../../middleware/error-handler.js';

class OpenAIClient {
  private client: OpenAI;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly maxRequestsPerSecond = 5;
  private readonly minTimeBetweenRequests = 1000 / this.maxRequestsPerSecond;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minTimeBetweenRequests) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minTimeBetweenRequests - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        const isRetryable = error instanceof Error && 
          (error.message.includes('429') || error.message.includes('500'));
        
        if (!isRetryable || attempt === maxRetries - 1) {
          throw new LLMError('OpenAI API request failed', error);
        }
        
        const backoffTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
    throw new LLMError('Max retries exceeded');
  }

  async createChatCompletion(
    params: OpenAI.Chat.ChatCompletionCreateParams
  ): Promise<OpenAI.Chat.ChatCompletion> {
    await this.rateLimit();
    return this.retryWithBackoff(() => 
      this.client.chat.completions.create({ ...params, stream: false })
    );
  }

  async createEmbedding(text: string): Promise<number[]> {
    await this.rateLimit();
    const response = await this.retryWithBackoff(() =>
      this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      })
    );
    return response.data[0].embedding;
  }
}

export const openaiClient = new OpenAIClient();


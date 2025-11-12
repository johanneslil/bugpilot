import { z } from 'zod';
import { openaiClient } from './openai-client.js';
import { LLMError } from '../../middleware/error-handler.js';
import { severityEnum, areaEnum } from 'shared';

const classificationResponseSchema = z.object({
  severity: severityEnum,
  area: areaEnum,
  reasoning: z.string(),
});

type ClassificationResponse = z.infer<typeof classificationResponseSchema>;

export class ClassificationService {
  async classify(params: {
    title: string;
    description: string;
  }): Promise<ClassificationResponse> {
    const prompt = `You are a bug triage assistant. Classify this bug report.

Title: ${params.title}
Description: ${params.description}

Output JSON with:
- severity: S0 (critical - system down, data loss), S1 (high - major feature broken), S2 (medium - minor feature issue), or S3 (low - cosmetic, enhancement)
- area: FRONTEND (UI/UX issues), BACKEND (API/server issues), INFRA (deployment, scaling, performance), or DATA (database, data integrity)
- reasoning: one sentence explanation for your classification

Respond ONLY with valid JSON.`;

    try {
      const response = await openaiClient.createChatCompletion({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      const parsed = JSON.parse(content);
      return classificationResponseSchema.parse(parsed);
    } catch (error) {
      console.error('Classification failed:', error);
      throw new LLMError('Failed to classify bug', error);
    }
  }
}

export const classificationService = new ClassificationService();


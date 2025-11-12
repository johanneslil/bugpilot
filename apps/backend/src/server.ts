import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createContext } from './context.js';
import { appRouter } from './routers/index.js';
import { convertToModelMessages, UIMessage } from 'ai';
import { bugTriageAgent } from './services/llm/bug-triage-agent.js';

export async function createServer() {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    maxParamLength: 5000,
  });

  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ path, error }: { path?: string; error: Error }) {
        console.error(`Error in tRPC handler on path '${path}':`, error);
      },
    },
  });

  server.post('/api/chat/agent', async (request, reply) => {
    try {
      const { messages }: { messages: UIMessage[] } = request.body as any;

      const result = await bugTriageAgent.stream({
        messages: convertToModelMessages(messages),
      });

      // Get the stream response from AI SDK
      const response = result.toUIMessageStreamResponse();

      // Use ONLY raw API - don't mix with reply.status()/reply.header()
      const headers: Record<string, string> = {};
      
      // Copy headers from AI SDK response
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      // Set CORS headers
      headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || 'http://localhost:5173';
      headers['Access-Control-Allow-Credentials'] = 'true';

      // Write headers using raw API
      reply.raw.writeHead(response.status, headers);

      // Stream the body directly
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body from AI SDK');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Write bytes exactly as received from AI SDK
        reply.raw.write(value);
      }

      reply.raw.end();
    } catch (error) {
      console.error('Agent streaming error:', error);
      if (!reply.sent) {
        reply.status(500).send({ error: 'Failed to stream agent response' });
      }
    }
  });

  server.get('/health', async () => {
    return { status: 'ok' };
  });

  return server;
}


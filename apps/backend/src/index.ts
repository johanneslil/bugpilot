import dotenv from 'dotenv';
import { createServer } from './server.js';

dotenv.config({ path: '../../.env' });

async function main() {
  const server = await createServer();
  
  const port = Number(process.env.PORT) || 3000;
  const host = '0.0.0.0';

  try {
    await server.listen({ port, host });
    console.log(`🚀 Server listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received, closing server gracefully...`);
    await server.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

main();


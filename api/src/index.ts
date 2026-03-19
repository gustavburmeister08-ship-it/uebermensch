import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { directiveRoute } from './routes/directive';
import { auditRoute } from './routes/audit';

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: true, // restrict in production
});

fastify.register(directiveRoute, { prefix: '/api' });
fastify.register(auditRoute, { prefix: '/api' });

fastify.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Uebermensch API running on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

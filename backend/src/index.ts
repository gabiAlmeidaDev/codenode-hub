import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { leadRoutes } from "./routes/leads.js";
import { taskRoutes } from "./routes/tasks.js";

async function bootstrap() {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });

  app.register(healthRoutes);
  app.register(leadRoutes);
  app.register(taskRoutes);

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  console.log(`Backend up on http://localhost:${env.PORT}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../supabase.js";

export async function taskRoutes(app: FastifyInstance) {
  app.post("/api/leads/:id/tasks", async (req: FastifyRequest, reply: FastifyReply) => {
    const id = (req.params as any).id as string;
    const body = z.object({ title: z.string().min(1), tag: z.string().nullable().optional() }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    const { title, tag } = body.data;
    const { error } = await supabaseAdmin
      .from("hub_task")
      .insert({ lead_id: id, title, done: false, tag: tag ?? null });

    if (error) return reply.code(500).send({ error: error.message });
    return { ok: true };
  });

  app.post("/api/tasks/:taskId/toggle", async (req: FastifyRequest, reply: FastifyReply) => {
    const taskId = (req.params as any).taskId as string;
    const body = z.object({ done: z.boolean() }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    const { error } = await supabaseAdmin.from("hub_task").update({ done: body.data.done }).eq("id", taskId);
    if (error) return reply.code(500).send({ error: error.message });
    return { ok: true };
  });
}

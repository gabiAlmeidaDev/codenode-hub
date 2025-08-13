import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../supabase.js";

const Stage = z.enum(["prospect","qualificado","proposta","producao","testes","entregue"]);
const Service = z.enum(["landing","agente","combo"]);

const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  service: Service.optional(),
  stage: Stage.optional(),
  amount: z.number().int().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function leadRoutes(app: FastifyInstance) {
  app.get("/api/leads", async (_req: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = await supabaseAdmin
      .from("hub_lead")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) return reply.code(500).send({ error: error.message });
    return data;
  });

  app.patch("/api/leads/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const id = (req.params as any).id as string;
    const parsed = updateLeadSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { error } = await supabaseAdmin.from("hub_lead").update(parsed.data).eq("id", id);
    if (error) return reply.code(500).send({ error: error.message });
    return { ok: true };
  });

  app.post("/api/leads/:id/stage", async (req: FastifyRequest, reply: FastifyReply) => {
    const id = (req.params as any).id as string;
    const body = z.object({ from: Stage, to: Stage, note: z.string().optional() }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    const { from, to, note } = body.data;

    const { error: upErr } = await supabaseAdmin.from("hub_lead").update({ stage: to }).eq("id", id);
    if (upErr) return reply.code(500).send({ error: upErr.message });

    const { error: logErr } = await supabaseAdmin
      .from("hub_stage_history")
      .insert({ lead_id: id, from_stage: from, to_stage: to, note: note ?? "API move" });
    if (logErr) return reply.code(500).send({ error: logErr.message });

    return { ok: true };
  });
}

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../supabase.js";

const financeEntrySchema = z.object({
  lead_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  amount: z.number().int(), // centavos
  due_date: z.string().datetime(),
  paid_at: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function financeRoutes(app: FastifyInstance) {
  // Listar lançamentos
  app.get("/api/finance", async (_req: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = await supabaseAdmin
      .from("hub_finance_entry")
      .select("*, lead:hub_lead(name)")
      .order("due_date", { ascending: true })
      .limit(1000);

    if (error) return reply.code(500).send({ error: error.message });
    return data;
  });

  // Criar lançamento
  app.post("/api/finance", async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = financeEntrySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { data, error } = await supabaseAdmin
      .from("hub_finance_entry")
      .insert(parsed.data)
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return data;
  });

  // Atualizar lançamento
  app.patch("/api/finance/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const id = (req.params as any).id as string;
    const parsed = financeEntrySchema.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const { data, error } = await supabaseAdmin
      .from("hub_finance_entry")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return data;
  });

  // Excluir lançamento
  app.delete("/api/finance/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const id = (req.params as any).id as string;
    const { error } = await supabaseAdmin.from("hub_finance_entry").delete().eq("id", id);
    if (error) return reply.code(500).send({ error: error.message });
    return { ok: true };
  });
}
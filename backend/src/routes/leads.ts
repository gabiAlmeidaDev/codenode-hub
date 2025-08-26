// src/routes/leads.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../supabase.js";

// Enums e tipos
const Stage = z.enum(["prospect","qualificado","proposta","producao","testes","entregue"]);
const Service = z.enum(["landing", "agente", "combo"]);

// Schema para lead
const LeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  service: Service.default("landing"),
  stage: Stage.default("prospect"),
  column_id: z.string().uuid().nullable().optional(), // Adicionado suporte a column_id
  amount: z.number().int().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Schema para atualização parcial
const PartialLeadSchema = LeadSchema.partial();

// Schema para mudança de stage
const MoveStageSchema = z.object({
  from: Stage,
  to: Stage,
  note: z.string().optional(),
});

export async function leadRoutes(fastify: FastifyInstance) {
  // GET /api/leads
  fastify.get("/api/leads", async (_req: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = await supabaseAdmin
      .from("hub_lead")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return reply.status(500).send({ error: "Failed to fetch leads" });
    }

    return reply.send(data);
  });

  // POST /api/leads
  fastify.post("/api/leads", async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = PartialLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid lead data", details: parsed.error.flatten() });
    }

    const { data, error } = await supabaseAdmin
      .from("hub_lead")
      .insert({
        ...parsed.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return reply.status(500).send({ error: "Failed to create lead" });
    }

    return reply.status(201).send(data);
  });

  // PUT /api/leads/:id
  fastify.put("/api/leads/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const parsed = PartialLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid lead data", details: parsed.error.flatten() });
    }

    const { data, error } = await supabaseAdmin
      .from("hub_lead")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(error);
      return reply.status(500).send({ error: "Failed to update lead" });
    }

    if (!data) {
      return reply.status(404).send({ error: "Lead not found" });
    }

    return reply.send(data);
  });

  // DELETE /api/leads/:id
  fastify.delete("/api/leads/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    const { error } = await supabaseAdmin
      .from("hub_lead")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return reply.status(500).send({ error: "Failed to delete lead" });
    }

    return reply.status(204).send();
  });

  // POST /api/leads/:id/stage
  fastify.post("/api/leads/:id/stage", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = z.object({ from: Stage, to: Stage, note: z.string().optional() }).safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid stage data", details: body.error.flatten() });
    }

    const { from, to, note } = body.data;

    // Atualizar o lead
    const { error: upErr } = await supabaseAdmin
      .from("hub_lead")
      .update({ stage: to, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (upErr) {
      console.error(upErr);
      return reply.status(500).send({ error: "Failed to update lead stage" });
    }

    // Registrar histórico
    const { error: histErr } = await supabaseAdmin
      .from("hub_stage_history")
      .insert({ lead_id: id, from_stage: from, to_stage: to, note: note ?? "API move" });

    if (histErr) {
      console.error(histErr);
    }

    return reply.send({ message: "Stage updated" });
  });

  // POST /api/leads/:id/column
  fastify.post("/api/leads/:id/column", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = z.object({ 
      from: z.string().uuid().nullable(), 
      to: z.string().uuid().nullable(),
      note: z.string().optional() 
    }).safeParse(req.body);
    
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid column data", details: body.error.flatten() });
    }

    const { from, to, note } = body.data;

    // Atualizar o lead
    const { error: upErr } = await supabaseAdmin
      .from("hub_lead")
      .update({ column_id: to, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (upErr) {
      console.error(upErr);
      return reply.status(500).send({ error: "Failed to update lead column" });
    }

    // Registrar histórico (opcional - pode ser adicionado uma tabela de histórico de colunas)
    // Por enquanto, vamos manter apenas o histórico de stage

    return reply.send({ message: "Column updated" });
  });
}

// Função para reordenar leads em um stage
export async function reorderLeadsInStage(stage: string, ids: string[]) {
  const updates = ids.map((id, index) => 
    supabaseAdmin
      .from("hub_lead")
      .update({ order_index: index, updated_at: new Date().toISOString() })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r: any) => r.error);
  
  if (errors.length > 0) {
    console.error("Errors reordering leads:", errors);
    throw new Error("Failed to reorder leads");
  }
}

// Função para reordenar leads em uma coluna
export async function reorderLeadsInColumn(columnId: string, ids: string[]) {
  const updates = ids.map((id, index) => 
    supabaseAdmin
      .from("hub_lead")
      .update({ order_index: index, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("column_id", columnId)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r: any) => r.error);
  
  if (errors.length > 0) {
    console.error("Errors reordering leads:", errors);
    throw new Error("Failed to reorder leads");
  }
}

// Função para mover lead entre colunas
export async function moveLeadColumn(leadId: string, from: string | null, to: string | null) {
  const { error: upErr } = await supabaseAdmin
    .from("hub_lead")
    .update({ column_id: to, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (upErr) {
    console.error(upErr);
    throw new Error("Failed to move lead column");
  }
}
// src/routes/columns.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { supabaseAdmin } from "../supabase.js";

// Schema Zod para validação
import { z } from "zod";

const ColumnSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  order_index: z.number().int().nonnegative().optional(),
});

const UpdateColumnSchema = ColumnSchema.partial();

export default async function columnsRoutes(fastify: FastifyInstance) {
  // Obter todas as colunas
  fastify.get("/api/columns", async (_req: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = await supabaseAdmin
      .from("hub_column")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Erro ao buscar colunas:", error);
      return reply.status(500).send({ error: "Erro ao buscar colunas" });
    }

    return reply.send(data);
  });

  // Criar nova coluna
  fastify.post("/api/columns", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = ColumnSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Dados inválidos", details: body.error.flatten() });
    }

    const { data, error } = await supabaseAdmin
      .from("hub_column")
      .insert({
        name: body.data.name,
        color: body.data.color || "#6366f1",
        order_index: body.data.order_index || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar coluna:", error);
      return reply.status(500).send({ error: "Erro ao criar coluna" });
    }

    return reply.status(201).send(data);
  });

  // Atualizar coluna
  fastify.put("/api/columns/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = UpdateColumnSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Dados inválidos", details: body.error.flatten() });
    }

    const { data, error } = await supabaseAdmin
      .from("hub_column")
      .update({
        ...body.data,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar coluna:", error);
      return reply.status(500).send({ error: "Erro ao atualizar coluna" });
    }

    if (!data) {
      return reply.status(404).send({ error: "Coluna não encontrada" });
    }

    return reply.send(data);
  });

  // Deletar coluna
  fastify.delete("/api/columns/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    // Verificar se existem leads associados a esta coluna
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from("hub_lead")
      .select("id")
      .eq("column_id", id)
      .limit(1);

    if (leadsError) {
      console.error("Erro ao verificar leads associados:", leadsError);
      return reply.status(500).send({ error: "Erro ao verificar leads associados" });
    }

    if (leads && leads.length > 0) {
      return reply.status(400).send({ 
        error: "Não é possível deletar coluna com leads associados",
        details: "Mova os leads para outra coluna antes de deletar"
      });
    }

    // Deletar a coluna
    const { error } = await supabaseAdmin
      .from("hub_column")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar coluna:", error);
      return reply.status(500).send({ error: "Erro ao deletar coluna" });
    }

    return reply.status(204).send();
  });

  // Reordenar colunas
  fastify.put("/api/columns/reorder", async (req: FastifyRequest, reply: FastifyReply) => {
    const { columns } = req.body as { columns: { id: string; order_index: number }[] };

    if (!Array.isArray(columns)) {
      return reply.status(400).send({ error: "Formato inválido. Esperado array de colunas com id e order_index" });
    }

    // Atualizar a ordem de todas as colunas
    const updates = columns.map(({ id, order_index }) => 
      supabaseAdmin
        .from("hub_column")
        .update({ order_index, updated_at: new Date().toISOString() })
        .eq("id", id)
    );

    const results = await Promise.all(updates);
    
    // Verificar se houve algum erro
    const errors = results.filter((result: any) => result.error);
    if (errors.length > 0) {
      console.error("Erros ao reordenar colunas:", errors);
      return reply.status(500).send({ error: "Erro ao reordenar colunas" });
    }

    return reply.send({ message: "Colunas reordenadas com sucesso" });
  });
}
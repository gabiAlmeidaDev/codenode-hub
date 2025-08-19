import React from "react";
import { useEffect, useMemo, useState } from "react";
import { fetchFinanceEntries, createFinanceEntry, updateFinanceEntry, deleteFinanceEntry } from "@/api/finance";
import type { HubFinanceEntry } from "@/lib/types";
import { formatBRL, shortDate } from "@/utils";
import Skeleton from "@/components/common/skeleton";

export default function FinancePage() {
  const [entries, setEntries] = useState<(HubFinanceEntry & { lead: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [notes, setNotes] = useState("");
  const [leadId, setLeadId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      setLoading(true);
      const data = await fetchFinanceEntries();
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    let projected = 0;
    let received = 0;
    let toPay = 0;
    
    entries.forEach(entry => {
      const due = new Date(entry.due_date);
      const isThisMonth = due.getMonth() === thisMonth && due.getFullYear() === thisYear;
      
      if (entry.amount > 0) {
        // Receita
        projected += entry.amount;
        if (entry.paid_at && isThisMonth) {
          received += entry.amount;
        }
      } else {
        // Despesa
        if (isThisMonth) {
          toPay += Math.abs(entry.amount);
        }
      }
    });
    
    return { projected, received, toPay };
  }, [entries]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const entryData = {
      title,
      amount: Math.round(parseFloat(amount) * 100), // Converte para centavos
      due_date: new Date(dueDate).toISOString(),
      paid_at: paidAt ? new Date(paidAt).toISOString() : null,
      notes: notes || null,
      lead_id: leadId || null
    };
    
    try {
      if (editingId) {
        await updateFinanceEntry(editingId, entryData);
      } else {
        await createFinanceEntry(entryData);
      }
      
      // Reset form
      setTitle("");
      setAmount("");
      setDueDate("");
      setPaidAt("");
      setNotes("");
      setLeadId("");
      setEditingId(null);
      setShowForm(false);
      
      // Reload entries
      loadEntries();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar lançamento");
    }
  }

  function handleEdit(entry: HubFinanceEntry) {
    setTitle(entry.title);
    setAmount((entry.amount / 100).toString());
    setDueDate(entry.due_date.split("T")[0]);
    setPaidAt(entry.paid_at ? entry.paid_at.split("T")[0] : "");
    setNotes(entry.notes || "");
    setLeadId(entry.lead_id || "");
    setEditingId(entry.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    
    try {
      await deleteFinanceEntry(id);
      loadEntries();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir lançamento");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-xl font-semibold">Financeiro</div>
        <div className="grid md:grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Financeiro</div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "Novo Lançamento"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-sm text-[hsl(215,12%,70%)]">Saldo previsto</div>
          <div className="text-2xl font-semibold">
            {formatBRL(stats.projected / 100)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[hsl(215,12%,70%)]">Recebido no mês</div>
          <div className="text-2xl font-semibold">
            {formatBRL(stats.received / 100)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[hsl(215,12%,70%)]">A pagar no mês</div>
          <div className="text-2xl font-semibold">
            {formatBRL(stats.toPay / 100)}
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Título</label>
                <input
                  type="text"
                  className="w-full bg-transparent border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-transparent border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Data de Vencimento</label>
                <input
                  type="date"
                  className="w-full bg-transparent border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Data de Pagamento (opcional)</label>
                <input
                  type="date"
                  className="w-full bg-transparent border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Notas (opcional)</label>
                <textarea
                  className="w-full bg-transparent border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Atualizar" : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[hsl(215,12%,65%)]">
            <tr className="border-b border-[hsl(220,12%,18%)]">
              <th className="text-left p-3">Título</th>
              <th className="text-left p-3">Lead</th>
              <th className="text-left p-3">Valor</th>
              <th className="text-left p-3">Vencimento</th>
              <th className="text-left p-3">Pago</th>
              <th className="text-left p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td className="p-6 text-[hsl(215,12%,65%)] text-center" colSpan={6}>
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-[hsl(220,12%,18%)]">
                  <td className="p-3">{entry.title}</td>
                  <td className="p-3">{entry.lead?.name || "-"}</td>
                  <td className="p-3">{formatBRL(entry.amount / 100)}</td>
                  <td className="p-3">{shortDate(entry.due_date)}</td>
                  <td className="p-3">
                    {entry.paid_at ? shortDate(entry.paid_at) : "Não"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button 
                        className="btn"
                        onClick={() => handleEdit(entry)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn"
                        onClick={() => handleDelete(entry.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
  
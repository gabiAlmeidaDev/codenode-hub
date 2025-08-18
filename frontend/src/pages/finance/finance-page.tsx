export default function FinancePage() {
    return (
      <div className="space-y-4">
        <div className="text-xl font-semibold">Financeiro (v0)</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="card p-4">Saldo previsto</div>
          <div className="card p-4">Recebido no mês</div>
          <div className="card p-4">A pagar no mês</div>
        </div>
        <div className="card p-4">Tabela de lançamentos (entradas/saídas)</div>
      </div>
    );
  }
  
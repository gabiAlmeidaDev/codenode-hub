import { useToast } from "@/components/common/toast";

export default function CopyText({ text, children }: { text: string; children: React.ReactNode }) {
  const { show } = useToast();
  return (
    <button
      className="underline decoration-dotted underline-offset-4 hover:opacity-80"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
          show({ type: "success", title: "Copiado!", description: text });
        } catch {
          show({ type: "error", title: "Falhou ao copiar" });
        }
      }}
      title="Copiar"
    >
      {children}
    </button>
  );
}

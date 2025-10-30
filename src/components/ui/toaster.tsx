import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 shadow-lg w-72"
        >
          <p className="font-semibold">{t.title}</p>
          <p className="text-sm text-gray-700">{t.description}</p>
        </div>
      ))}
    </div>
  );
}

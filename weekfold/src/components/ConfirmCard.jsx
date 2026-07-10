export default function ConfirmCard({
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-line w-full max-w-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display italic text-xl font-semibold text-ink">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/60">{description}</p>
          </div>
          <button onClick={onCancel} className="text-ink/40 hover:text-ink text-xl leading-none">
            ✕
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-ink/60 px-4 py-2 rounded-lg hover:bg-paper transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`text-sm font-medium rounded-lg px-4 py-2 transition ${
              danger ? 'bg-coral text-white hover:bg-coral/90' : 'bg-indigo text-white hover:bg-indigo/90'
            } disabled:opacity-40`}
          >
            {loading ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  error,
  id,
  type = 'text',
  ...inputProps
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-stockflow-ink" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="min-h-11 w-full rounded-lg border border-stockflow-gray bg-white px-3 py-2 text-stockflow-ink outline-none transition placeholder:text-stockflow-ink/40 focus:border-stockflow-slate focus:ring-2 focus:ring-stockflow-slate/20"
        id={id}
        type={type}
      />
      {error && (
        <p className="text-sm text-red-700" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField

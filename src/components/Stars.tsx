export function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span aria-label={`Dificultad ${value} de ${max}`} className="tracking-widest text-brass">
      {"★".repeat(value)}
      <span className="text-muted/40">{"★".repeat(max - value)}</span>
    </span>
  );
}

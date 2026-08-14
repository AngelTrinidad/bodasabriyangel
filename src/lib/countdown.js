/**
 * Tiempo restante hasta `target`. Nunca devuelve negativos:
 * si ya pasó, todo en 0 y llego: true.
 */
export function timeLeft(target, now) {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0, llego: true };
  const segundos = Math.floor(ms / 1000);
  return {
    dias: Math.floor(segundos / 86400),
    horas: Math.floor(segundos / 3600) % 24,
    minutos: Math.floor(segundos / 60) % 60,
    segundos: segundos % 60,
    llego: false,
  };
}

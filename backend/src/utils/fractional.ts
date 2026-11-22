/**
 * Utilidad de Posicionamiento Fraccionario (Fractional Indexing)
 * Permite reordenar tarjetas y columnas con complejidad O(1) de actualización
 */
export const calculatePosition = (
  prevPos: number | null | undefined,
  nextPos: number | null | undefined
): number => {
  const GAP = 1000;

  if (prevPos == null && nextPos == null) {
    return GAP;
  }
  if (prevPos == null && nextPos != null) {
    return nextPos / 2;
  }
  if (prevPos != null && nextPos == null) {
    return prevPos + GAP;
  }
  if (prevPos != null && nextPos != null) {
    return (prevPos + nextPos) / 2;
  }
  return GAP;
};

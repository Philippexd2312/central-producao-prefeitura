export function createProtocol(sequence?: number) {
  const year = new Date().getFullYear();
  const suffix = String(sequence ?? Math.floor(Math.random() * 99999)).padStart(5, '0');
  return `COM-${year}-${suffix}`;
}

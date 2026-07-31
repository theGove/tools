/** Looks up an element by id. */
export function tag(id: string): HTMLElement | null {
  return document.getElementById(id);
}

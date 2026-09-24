// Somente apresentação: mantém as cores existentes sem acoplar o banco ao snapshot editorial.
const styles: Record<string, { art: string; color: string }> = {
  "luminaria-de-mesa": { art: "lamp", color: "pink" },
  mousepad: { art: "mat", color: "peach" },
  "fita-led": { art: "led", color: "lilac" },
  "bonequinho-decorativo": { art: "bunny", color: "cream" },
  "suporte-de-fone": { art: "headphone", color: "pink" },
};
export function productPresentation(slug: string) {
  return styles[slug] ?? { art: "", color: "pink" };
}

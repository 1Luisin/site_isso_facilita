import "server-only";
import assets from "./public-assets.json";
export function socialImage(candidate: string) {
  return assets.includes(candidate) ? candidate : "/social/isso-facilita.jpg";
}

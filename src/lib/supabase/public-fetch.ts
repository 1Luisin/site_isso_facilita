import "server-only";

// Read-only transport; caching belongs exclusively to the catalog cache function.
export function createPublicFetch(origin: string): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== origin || !url.pathname.startsWith("/rest/v1/")) {
      throw new Error("Catálogo Supabase: somente leitura da Data API configurada é permitida.");
    }
    try {
      return await fetch(request, {
        // Avoid a second, independently-lived fetch cache underneath public-catalog.
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]),
      });
    } catch {
      throw new Error("Catálogo Supabase: falha de rede/timeout durante leitura pública.");
    }
  };
}

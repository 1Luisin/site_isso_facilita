import "server-only";
import { get } from "node:https";

// Node-only transport: metadata route prerendering in Next 16 treats uncached
// global fetch as runtime I/O. This build-only reader has no Next Data Cache,
// redirects, sessions or browser code. The SDK still handles PostgREST queries.
export function createBuildFetch(origin: string): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== origin || !url.pathname.startsWith("/rest/v1/")) {
      throw new Error("Catálogo Supabase: somente leitura da Data API configurada é permitida.");
    }
    return new Promise<Response>((resolve, reject) => {
      const fail = () => reject(new Error("Catálogo Supabase: falha de rede/timeout durante leitura pública."));
      const connection = get(url, {
        headers: Object.fromEntries(request.headers.entries()),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]),
      }, response => {
        const status = response.statusCode ?? 500;
        // Never forward the API key to a redirect destination.
        if (status >= 300 && status < 400) {
          response.resume();
          reject(new Error("Catálogo Supabase: redirecionamento inesperado da Data API."));
          return;
        }
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("error", fail);
        response.on("end", () => {
          const headers = new Headers();
          for (const [name, value] of Object.entries(response.headers)) {
            if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
          }
          resolve(new Response(status === 204 ? null : Buffer.concat(chunks), { status, headers }));
        });
      });
      connection.on("error", fail);
    });
  };
}

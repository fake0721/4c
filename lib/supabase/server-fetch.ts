import type { IncomingHttpHeaders } from "node:http";
import https from "node:https";

function isSupabaseRequest(url: string) {
  const hostname = new URL(url).hostname;
  return hostname === "supabase.com" || hostname.endsWith(".supabase.co");
}

function appendHeaders(target: Headers, source: IncomingHttpHeaders) {
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      value.forEach((item) => target.append(key, item));
    } else if (typeof value === "string") {
      target.set(key, value);
    }
  }
}

async function fetchWithHttps(request: Request) {
  const url = new URL(request.url);
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : Buffer.from(await request.arrayBuffer());

  return new Promise<Response>((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port ? Number(url.port) : undefined,
        path: `${url.pathname}${url.search}`,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        timeout: 20000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const headers = new Headers();
          appendHeaders(headers, res.headers);
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode ?? 0,
              statusText: res.statusMessage,
              headers,
            }),
          );
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error("Supabase HTTPS request timed out."));
    });
    req.on("error", reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

export async function supabaseServerFetch(input: RequestInfo | URL, init?: RequestInit) {
  const request = new Request(input, init);

  try {
    return await fetch(request.clone());
  } catch (error) {
    if (!isSupabaseRequest(request.url)) {
      throw error;
    }

    return fetchWithHttps(request);
  }
}

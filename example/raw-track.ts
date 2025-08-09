import { fetch } from "undici";

const RAW_URL =
  process.env.RAW_URL ||
  "https://api.music.yandex.ru/playlists/ar.dcd89e75-5716-4605-9d69-9f6695979529?utm_source=web&utm_medium=copy_link";

(async () => {
  try {
    const uid = process.env.YM_UID ?? "";
    const token = process.env.YM_ACCESS_TOKEN ?? "";

    if (!uid || !token) {
      throw new Error("Missing YM_UID or YM_ACCESS_TOKEN env vars");
    }

    // Normalize API paths:
    // - /track/:id  -> /tracks/:id (API expects plural)
    // - /playlists/:uuid -> /playlist/:uuid (new web API uses singular per gist)
    // Also ensure richTracks=true for playlist endpoint
    const url = new URL(RAW_URL);
    if (url.pathname.startsWith("/track/")) {
      url.pathname = url.pathname.replace("/track/", "/tracks/");
    }
    if (url.pathname.startsWith("/playlists/")) {
      url.pathname = url.pathname.replace("/playlists/", "/playlist/");
    }
    if (
      url.pathname.startsWith("/playlist/") &&
      url.searchParams.get("richTracks") === null
    ) {
      url.searchParams.set("richTracks", "true");
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        YM_UID: String(uid),
        YM_ACCESS_TOKEN: String(token),
        Authorization: `OAuth ${token}`
      }
    });

    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    let parsed: unknown = undefined;
    if (contentType.includes("application/json")) {
      try {
        parsed = JSON.parse(text);
      } catch {}
    }

    console.log(
      JSON.stringify(
        {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          contentType,
          finalUrl: url.toString(),
          bodyPreview: text.slice(0, 500),
          jsonKeys:
            parsed && typeof parsed === "object"
              ? Object.keys(parsed as Record<string, unknown>)
              : undefined
        },
        null,
        2
      )
    );
  } catch (e: any) {
    console.error("Request failed:", e?.message ?? String(e));
    process.exit(1);
  }
})();

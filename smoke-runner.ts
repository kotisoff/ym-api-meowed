import { spawn } from "child_process";
import fs from "fs";
import path from "path";

type TestEntry = {
  label: string;
  file: string; // relative to project root
};

const projectRoot = path.resolve(__dirname, ".");

const tests: TestEntry[] = [
  { label: "smoke:token", file: "example/token.ts" },
  { label: "smoke:artist", file: "example/artist.ts" },
  { label: "smoke:album", file: "example/album.ts" },
  { label: "smoke:feed", file: "example/feed.ts" },
  { label: "smoke:genres", file: "example/genres.ts" },
  { label: "smoke:playlist", file: "example/playlist.ts" },
  { label: "smoke:playlist-share", file: "example/playlist-share.ts" },
  { label: "smoke:track", file: "example/track.ts" },
  { label: "smoke:tracks", file: "example/tracks.ts" },
  { label: "smoke:track-wrapped", file: "example/track-wrapped.ts" },
  { label: "smoke:get-track", file: "example/track-share.ts" },
  // Optional/legacy entries below — will be reported as not found if missing

  { label: "raw:track", file: "tests/raw-track.ts" },
  { label: "smoke:xml", file: "tests/smoke-xml-parse.ts" },
];

async function runOne(test: TestEntry): Promise<{ label: string; ok: boolean; reason?: string }>
{
  const absFile = path.resolve(projectRoot, test.file);
  if (!fs.existsSync(absFile)) {
    return { label: test.label, ok: false, reason: "no file" };
  }

  return new Promise((resolve) => {
    const child = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      [
        "dotenv",
        "-e",
        ".env",
        "--",
        "tsx",
        absFile
      ],
      {
        cwd: projectRoot,
        stdio: "inherit"
      }
    );

    child.on("exit", (code) => {
      resolve({ label: test.label, ok: code === 0 });
    });
    child.on("error", (err) => {
      resolve({ label: test.label, ok: false, reason: err.message });
    });
  });
}

async function runAll() {
  const results: Array<{ label: string; ok: boolean; reason?: string }> = [];
  for (const t of tests) {
    const result = await runOne(t);
    results.push(result);
    const status = result.ok ? "Completed" : "Not completed";
    const extra = result.ok ? "" : result.reason ? ` (${result.reason})` : "";
    // eslint-disable-next-line no-console
    console.log(`${t.label}: ${status}${extra}`);
  }

  const failed = results.filter((r) => !r.ok);
  // eslint-disable-next-line no-console
  console.log("\nSummary:");
  for (const r of results) {
    const status = r.ok ? "Completed" : "Not completed";
    const extra = r.ok ? "" : r.reason ? ` (${r.reason})` : "";
    // eslint-disable-next-line no-console
    console.log(`- ${r.label}: ${status}${extra}`);
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

runAll().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("smoke-runner error:", e);
  process.exit(1);
});


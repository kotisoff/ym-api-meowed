import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";

const projectRoot = path.resolve(__dirname, ".");
const isVerbose = process.argv.includes("--verbose");

type TestEntry = { label: string; file: string };

// Рекурсивное сканирование директории
function scanDir(dir: string): TestEntry[] {
  const absDir = path.resolve(projectRoot, dir);
  if (!fs.existsSync(absDir)) return [];

  const entries: TestEntry[] = [];

  const items = fs.readdirSync(absDir, { withFileTypes: true });
  for (const item of items) {
    const absPath = path.join(absDir, item.name);
    if (item.isDirectory()) {
      entries.push(...scanDir(path.relative(projectRoot, absPath)));
    } else if (item.isFile() && item.name.endsWith(".ts")) {
      const label = path.relative(projectRoot, absPath);
      entries.push({ label, file: absPath });
    }
  }

  return entries;
}

// Сканируем example и tests
const tests: TestEntry[] = [...scanDir("example"), ...scanDir("tests")];

async function runOne(
  test: TestEntry
): Promise<{ label: string; ok: boolean; ms: number }> {
  if (!fs.existsSync(test.file)) {
    console.log(
      `${chalk.dim("→")} ${chalk.bold(test.label)} ${chalk.yellow("⚠ missing file")}`
    );
    return { label: test.label, ok: false, ms: 0 };
  }

  const start = performance.now();
  return new Promise((resolve) => {
    const child = spawn(
      "pnpm",
      ["exec", "dotenv", "-e", ".env", "--", "tsx", test.file],
      {
        cwd: projectRoot,
        stdio: isVerbose ? "inherit" : ["ignore", "pipe", "pipe"]
      }
    );

    let output = "";
    if (!isVerbose) {
      if (child.stdout)
        child.stdout.on("data", (d) => (output += d.toString()));
      if (child.stderr) {
        child.stderr.on("data", (d) => {
          const line = d.toString();
          if (!line.includes("npm warn")) output += line;
        });
      }
    }

    child.on("exit", (code) => {
      const ms = Math.round(performance.now() - start);
      const ok = code === 0;
      const symbol = ok ? chalk.green("✔") : chalk.red("✖");
      console.log(
        `${chalk.dim("→")} ${chalk.bold(test.label)} ${symbol} ${chalk.gray(`[${ms}ms]`)}`
      );

      if (!ok && !isVerbose && output.trim()) {
        console.log(
          chalk.gray(output.trim().split("\n").slice(-10).join("\n"))
        );
      }

      resolve({ label: test.label, ok, ms });
    });
  });
}

(async () => {
  console.log(chalk.cyan("\nRunning smoke tests...\n"));
  const results = [];
  for (const test of tests) results.push(await runOne(test));

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;
  const total = results.length;

  console.log(chalk.cyan("\n═ Summary ═══════════════════════════"));
  for (const r of results)
    console.log(
      `${r.ok ? chalk.green("✔") : chalk.red("✖")} ${r.label} ${chalk.gray(`[${r.ms}ms]`)}`
    );
  console.log(
    `\n${chalk.bold("Total:")} ${total}, ${chalk.green(`completed: ${okCount}`)}, ${chalk.red(
      `failed: ${failCount}`
    )}\n`
  );

  process.exit(failCount > 0 ? 1 : 0);
})();

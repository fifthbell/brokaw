import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { bundle } from "@remotion/bundler";

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = await mkdtemp(join(tmpdir(), "brokaw-packed-remotion-"));
const packageDirectory = join(workspace, "package");
const consumerDirectory = join(workspace, "consumer");

try {
  await mkdir(packageDirectory);
  await mkdir(consumerDirectory);
  const { stdout } = await execFileAsync(
    "npm",
    [
      "pack",
      "--json",
      "--ignore-scripts",
      "--pack-destination",
      packageDirectory,
    ],
    { cwd: root },
  );
  const [{ filename }] = JSON.parse(stdout);
  const archive = join(packageDirectory, filename);

  await writeFile(
    join(consumerDirectory, "package.json"),
    JSON.stringify({ name: "brokaw-remotion-consumer", private: true }),
  );
  await execFileAsync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      "--no-save",
      archive,
    ],
    { cwd: consumerDirectory },
  );

  const consumerRequire = createRequire(join(consumerDirectory, "index.cjs"));
  const manifestPath = consumerRequire.resolve(
    "@fifthbell/brokaw/cronkite-manifest.json",
  );
  const installedManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const packageRoot = dirname(dirname(manifestPath));
  const installedRenderer = await import(
    pathToFileURL(join(packageRoot, "dist", "renderer.js")).href
  );
  const fontFiles = installedRenderer.fontFiles();
  const fontKeys = fontFiles.map((file) => file.key);
  if (fontFiles.length === 0 || new Set(fontKeys).size !== fontKeys.length) {
    throw new Error("packed font file set is empty or contains duplicate keys");
  }
  const stylesheets = fontFiles.filter(
    (file) => file.key === "content/fonts/fonts.css",
  );
  if (
    stylesheets.length !== 1 ||
    stylesheets[0].contentType !== "text/css; charset=utf-8" ||
    stylesheets[0].body.length === 0
  ) {
    throw new Error("packed font file set must contain one nonempty stylesheet");
  }

  const release = installedRenderer.liveProgramReleaseFiles({
    programId: "fifthbell",
    apiBaseUrl: "https://api.example.test/program/fifthbell",
  });
  if (release.at(-1)?.key !== "html/program.html") {
    throw new Error("packed live-program release does not end at its pointer");
  }

  const video = installedManifest.renderables?.["short-video"];
  if (video?.engine !== "remotion" || typeof video.entry !== "string") {
    throw new Error("packed manifest has no Remotion short-video entry");
  }

  const entryPoint = join(packageRoot, video.entry);
  await bundle({
    entryPoint,
    outDir: join(workspace, "bundle"),
    onProgress: () => undefined,
  });
  console.log(`Bundled packed ${installedManifest.package} short-video entry.`);
} finally {
  await rm(workspace, { recursive: true, force: true });
}

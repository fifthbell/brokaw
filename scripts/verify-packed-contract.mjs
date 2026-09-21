import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = await mkdtemp(join(tmpdir(), "brokaw-packed-contract-"));
const packageDirectory = join(workspace, "package");
const consumerDirectory = join(workspace, "consumer");

const assertPackedFile = async (packageRoot, relativePath, owner) => {
  const resolvedPath = resolve(packageRoot, relativePath);
  if (!resolvedPath.startsWith(`${resolve(packageRoot)}${sep}`)) {
    throw new Error(`${owner} path escapes the packed package: ${relativePath}`);
  }
  if (!(await stat(resolvedPath)).isFile()) {
    throw new Error(`${owner} path is not a regular packed file: ${relativePath}`);
  }
};

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
    JSON.stringify({ name: "brokaw-contract-consumer", private: true }),
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
  const installedPackage = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8"),
  );
  if (
    installedManifest.package !== installedPackage.name ||
    installedManifest.version !== installedPackage.version
  ) {
    throw new Error("packed manifest identity does not match the package");
  }

  const rendering = installedManifest.templateRendering;
  if (
    rendering?.contract !== "cronkite.templates" ||
    rendering.contractVersion !== 1
  ) {
    throw new Error("packed manifest has no declarative template contract");
  }
  for (const [name, definition] of Object.entries(rendering.partials ?? {})) {
    await assertPackedFile(packageRoot, definition.entry, `partial ${name}`);
  }
  for (const [name, definition] of Object.entries(rendering.renderables ?? {})) {
    await assertPackedFile(
      packageRoot,
      definition.template.entry,
      `renderable ${name} template`,
    );
    await assertPackedFile(
      packageRoot,
      definition.inputSchema,
      `renderable ${name} schema`,
    );
  }
  for (const [key, definition] of Object.entries(rendering.staticAssets ?? {})) {
    await assertPackedFile(packageRoot, definition.source, `static asset ${key}`);
  }

  const installedRenderer = await import(
    pathToFileURL(join(packageRoot, "dist", "renderer.js")).href
  );
  const fontFiles = installedRenderer.fontFiles();
  const fontKeys = fontFiles.map((file) => file.key);
  if (fontFiles.length === 0 || new Set(fontKeys).size !== fontFiles.length) {
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

  console.log(
    `Validated packed ${installedManifest.package}@${installedManifest.version} declarative contract.`,
  );
} finally {
  await rm(workspace, { recursive: true, force: true });
}

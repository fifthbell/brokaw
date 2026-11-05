import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { verifyPackedContract } from "./verify-packed-contract.mjs";

const execFileAsync = promisify(execFile);
const script = fileURLToPath(
  new URL("./verify-packed-contract.mjs", import.meta.url),
);
const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

// The script shells out to `npm pack` and `npm install`. A shim earlier on PATH
// answers both offline: pack tars a fictional package directory, install
// extracts that tarball into the consumer. Everything after install is the
// real script logic under test.
const npmShim = `#!/usr/bin/env node
const { execFileSync } = require("node:child_process");
const { mkdirSync } = require("node:fs");
const { join } = require("node:path");
const [command, ...args] = process.argv.slice(2);
if (command === "pack") {
  const destination = args[args.indexOf("--pack-destination") + 1];
  execFileSync("tar", ["-czf", join(destination, "fixture.tgz"), "-C", process.env.FIXTURE_PACKAGES, "package"]);
  process.stdout.write(JSON.stringify([{ filename: "fixture.tgz" }]));
} else if (command === "install") {
  const target = join(process.cwd(), "node_modules", "@fifthbell", "brokaw");
  mkdirSync(target, { recursive: true });
  execFileSync("tar", ["-xzf", args.at(-1), "-C", target, "--strip-components=1"]);
} else {
  process.exit(2);
}
`;

type Overrides = {
  manifestVersion?: string;
  partialEntry?: string;
  mediathekVariants?: number;
  duplicateFontKey?: boolean;
  releaseLastKey?: string;
  shell?: string;
};

const mediathekShell =
  '<html><div data-media-page></div><script>window.location.pathname.match(/^\\/mediathek\\/([^/]+)$/)</script></html>';

async function writeFixturePackage(root: string, overrides: Overrides) {
  const pkg = join(root, "package");
  await mkdir(join(pkg, "dist"), { recursive: true });
  await mkdir(join(pkg, "templates"), { recursive: true });
  await writeFile(join(pkg, "templates", "partial.hbs"), "partial");
  await writeFile(join(pkg, "templates", "page.hbs"), "page");
  await writeFile(join(pkg, "templates", "page.schema.json"), "{}");
  await writeFile(join(pkg, "templates", "asset.css"), "body{}");
  await writeFile(
    join(pkg, "package.json"),
    JSON.stringify({
      name: "@fifthbell/brokaw",
      version: "1.2.3",
      type: "module",
      exports: { "./cronkite-manifest.json": "./dist/cronkite-manifest.json" },
    }),
  );
  const variant = (key: string, html: string) => ({
    key,
    document: { html },
  });
  const mediathek = Array.from(
    { length: overrides.mediathekVariants ?? 1 },
    (_, index) =>
      variant(
        index === 0 ? "html/mediathek/index.html" : `html/mediathek/${index}.html`,
        overrides.shell ?? mediathekShell,
      ),
  );
  await writeFile(
    join(pkg, "dist", "cronkite-manifest.json"),
    JSON.stringify({
      package: "@fifthbell/brokaw",
      version: overrides.manifestVersion ?? "1.2.3",
      templateRendering: {
        contract: "cronkite.templates",
        contractVersion: 1,
        partials: { p: { entry: overrides.partialEntry ?? "templates/partial.hbs" } },
        renderables: {
          "media-page": {
            template: { entry: "templates/page.hbs" },
            inputSchema: "templates/page.schema.json",
          },
        },
        staticAssets: { css: { source: "templates/asset.css" } },
        systemPages: [
          { renderable: "media-page", variants: mediathek },
          { renderable: "homepage", variants: [variant("html/index.html", "<html></html>")] },
        ],
      },
    }),
  );
  const fonts = [
    { key: "content/fonts/fonts.css", contentType: "text/css; charset=utf-8", body: "a{}" },
    {
      key: overrides.duplicateFontKey ? "content/fonts/fonts.css" : "content/fonts/a.woff2",
      contentType: "font/woff2",
      body: "x",
    },
  ];
  await writeFile(
    join(pkg, "dist", "renderer.js"),
    `export const render = async (document) => document.html;
export const fontFiles = () => ${JSON.stringify(fonts)};
export const liveProgramReleaseFiles = (input) => {
  if (input.programId !== "fifthbell") throw new Error("unexpected program");
  return [{ key: "html/other.html" }, { key: ${JSON.stringify(overrides.releaseLastKey ?? "html/program.html")} }];
};
`,
  );
}

let workspace: string;
let binDirectory: string;

beforeAll(async () => {
  workspace = await mkdtemp(join(tmpdir(), "brokaw-verify-script-test-"));
  binDirectory = join(workspace, "bin");
  await mkdir(binDirectory);
  await writeFile(join(binDirectory, "npm"), npmShim);
  await chmod(join(binDirectory, "npm"), 0o755);
});

afterAll(async () => {
  await rm(workspace, { recursive: true, force: true });
});

async function run(name: string, overrides: Overrides = {}) {
  const fixtureRoot = join(workspace, name);
  await writeFixturePackage(fixtureRoot, overrides);
  try {
    const { stdout } = await execFileAsync(process.execPath, [script], {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        PATH: `${binDirectory}:${process.env.PATH}`,
        FIXTURE_PACKAGES: fixtureRoot,
      },
    });
    return { ok: true as const, output: stdout };
  } catch (error) {
    const failure = error as { stderr?: string };
    return { ok: false as const, output: failure.stderr ?? String(error) };
  }
}

describe("verify-packed-contract script", () => {
  it("accepts a self-consistent packed package", async () => {
    const result = await run("valid");
    expect(result.ok).toBe(true);
    expect(result.output).toContain("packedArtifact");
    expect(result.output).toContain(
      "Validated packed @fifthbell/brokaw@1.2.3 declarative contract.",
    );
  });

  it.each([
    ["manifest-version", { manifestVersion: "9.9.9" }, "packed manifest identity does not match the package"],
    ["escaping-entry", { partialEntry: "../../outside" }, "partial p path escapes the packed package"],
    ["missing-entry", { partialEntry: "templates/missing.hbs" }, "ENOENT"],
    ["directory-entry", { partialEntry: "templates" }, "partial p path is not a regular packed file"],
    ["two-mediathek", { mediathekVariants: 2 }, "packed basement must render one shared Mediathek shell"],
    ["no-shell", { shell: "<html></html>" }, "packed basement must render one shared Mediathek shell"],
    ["bad-html", { shell: "plain" }, "did not render HTML"],
    ["duplicate-fonts", { duplicateFontKey: true }, "packed font file set is empty or contains duplicate keys"],
    ["release-pointer", { releaseLastKey: "html/other.html" }, "does not end at its pointer"],
  ] satisfies [string, Overrides, string][])(
    "rejects %s",
    async (name, overrides, message) => {
      const result = await run(name, overrides);
      expect(result.ok).toBe(false);
      expect(result.output).toContain(message);
    },
  );
});

describe("verifyPackedContract exported function", () => {
  const environment = (fixtureRoot: string) => ({
    ...process.env,
    PATH: `${binDirectory}:${process.env.PATH}`,
    FIXTURE_PACKAGES: fixtureRoot,
  });

  it("verifies the fictional package and logs the same lines as the CLI", async () => {
    const fixtureRoot = join(workspace, "in-process");
    await writeFixturePackage(fixtureRoot, {});
    const lines: string[] = [];
    await verifyPackedContract({
      env: environment(fixtureRoot),
      log: (line: string) => lines.push(line),
    });
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toMatchObject({ packedArtifact: "fixture.tgz" });
    expect(lines[1]).toBe(
      "Validated packed @fifthbell/brokaw@1.2.3 declarative contract.",
    );
  });

  it("rejects with the script's error message for an inconsistent package", async () => {
    const fixtureRoot = join(workspace, "in-process-bad");
    await writeFixturePackage(fixtureRoot, { manifestVersion: "9.9.9" });
    await expect(
      verifyPackedContract({ env: environment(fixtureRoot), log: () => {} }),
    ).rejects.toThrow("packed manifest identity does not match the package");
  });
});

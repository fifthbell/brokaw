import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceSchemas = join(root, "src", "schemas");
const distributionSchemas = join(root, "dist", "schemas");

await mkdir(distributionSchemas, { recursive: true });
await cp(sourceSchemas, distributionSchemas, { recursive: true });

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const importBuilt = async (path) =>
  import(pathToFileURL(join(root, path)).href);

const manifestSchema = await readJson(
  join(sourceSchemas, "cronkite-manifest.schema.json"),
);
const packageJson = await readJson(join(root, "package.json"));
const { cronkiteManifest } = await importBuilt("dist/cronkite-manifest.js");
const renderer = await importBuilt("dist/renderer.js");
const { layoutFiles } = await importBuilt("dist/layouts.js");
const { outletConfig } = await importBuilt("dist/outlet-config.js");
const { version } = await importBuilt("dist/version.js");
const { assertManifestAlignment } = await importBuilt(
  "dist/manifest-validation.js",
);
const { addContractFormats } = await importBuilt("dist/json-schema-formats.js");

const ajv = new Ajv2020({ allErrors: true, strict: false });
addContractFormats(ajv);
const validateManifest = ajv.compile(manifestSchema);

if (!validateManifest(cronkiteManifest)) {
  throw new Error(
    `Cronkite manifest schema validation failed: ${ajv.errorsText(
      validateManifest.errors,
      { separator: "; " },
    )}`,
  );
}

assertManifestAlignment(cronkiteManifest, {
  layouts: Object.keys(layoutFiles),
  languages: outletConfig.supportedLanguages,
  defaultLanguage: outletConfig.defaultLanguage,
  packageName: packageJson.name,
  packageVersion: packageJson.version,
  exportedVersion: version,
});

const requireExport = (name, owner) => {
  if (typeof renderer[name] !== "function") {
    throw new Error(`${owner} declares missing function export ${name}`);
  }
};

const assertPackedFile = async (path, owner) => {
  const resolved = join(root, path);
  if (!resolved.startsWith(`${join(root, "dist")}/`)) {
    throw new Error(`${owner} path escapes the packed dist directory: ${path}`);
  }
  if (!(await stat(resolved)).isFile()) {
    throw new Error(`${owner} path is not a regular packed file: ${path}`);
  }
};

for (const [name, descriptor] of Object.entries(
  cronkiteManifest.renderables ?? {},
)) {
  if ("export" in descriptor) requireExport(descriptor.export, name);
  if ("entry" in descriptor) await assertPackedFile(descriptor.entry, name);
  if ("inputSchema" in descriptor) {
    await assertPackedFile(descriptor.inputSchema, name);
  }
  for (const [resourceName, resource] of Object.entries(
    descriptor.resources ?? {},
  )) {
    await assertPackedFile(resource.schema, `${name}.${resourceName}`);
  }
}

for (const [name, capability] of Object.entries(
  cronkiteManifest.capabilities ?? {},
)) {
  requireExport(capability.export, `capability ${name}`);
}

for (const schemaName of [
  "canonical-document.schema.json",
  "feed-renderable-input.schema.json",
  "live-program-release-input.schema.json",
]) {
  const schema = await readJson(join(sourceSchemas, schemaName));
  ajv.compile(schema);
}

await writeFile(
  join(root, "dist", "cronkite-manifest.json"),
  `${JSON.stringify(cronkiteManifest, null, 2)}\n`,
);

console.log(
  `Validated and emitted ${cronkiteManifest.package}@${cronkiteManifest.version} Cronkite manifest.`,
);

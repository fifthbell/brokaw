import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "json-schema-to-typescript";
import { format } from "prettier";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const contracts = [
  {
    schema: "src/schemas/canonical-document.schema.json",
    output: "src/types/canonical-document.generated.ts",
    name: "CanonicalDocument",
  },
  {
    schema: "src/schemas/cronkite-manifest.schema.json",
    output: "src/types/cronkite-manifest.generated.ts",
    name: "CronkiteManifest",
  },
  {
    schema: "src/schemas/live-program-release-input.schema.json",
    output: "src/types/live-program-release-input.generated.ts",
    name: "LiveProgramReleaseInput",
  },
];

for (const contract of contracts) {
  const schemaPath = join(root, contract.schema);
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  const generated = await compile(schema, contract.name, {
    bannerComment:
      "/* eslint-disable */\n/** Generated from the normative JSON Schema. Do not edit by hand. */",
    style: {
      bracketSpacing: true,
      printWidth: 100,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: "all",
    },
    unreachableDefinitions: true,
  });

  await writeFile(
    join(root, contract.output),
    await format(generated, { parser: "typescript" }),
  );
  console.log(`Generated ${contract.output}`);
}

const canonicalSchema = JSON.parse(
  await readFile(
    join(root, "src/schemas/canonical-document.schema.json"),
    "utf8",
  ),
);
const canonicalSchemaModule = await format(
  `/* eslint-disable */\n/** Generated from the normative JSON Schema. Do not edit by hand. */\nexport const canonicalDocumentSchema = ${JSON.stringify(canonicalSchema, null, 2)} as const;\n`,
  { parser: "typescript" },
);
await writeFile(
  join(root, "src/types/canonical-document-schema.generated.ts"),
  canonicalSchemaModule,
);
console.log("Generated src/types/canonical-document-schema.generated.ts");

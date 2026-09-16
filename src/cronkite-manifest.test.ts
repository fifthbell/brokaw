import { createRequire } from "node:module";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { cronkiteManifest } from "./cronkite-manifest.js";
import { addContractFormats } from "./json-schema-formats.js";
import { layoutFiles } from "./layouts.js";
import { assertManifestAlignment } from "./manifest-validation.js";
import { outletConfig } from "./outlet-config.js";
import * as renderer from "./renderer.js";
import type { CronkiteCLSManifest } from "./types/cronkite-manifest.generated.js";
import { version } from "./version.js";

const require = createRequire(import.meta.url);
const schema = require("./schemas/cronkite-manifest.schema.json") as object;
const packageJson = require("../package.json") as {
  name: string;
  version: string;
};

function sources() {
  return {
    layouts: Object.keys(layoutFiles),
    languages: outletConfig.supportedLanguages,
    defaultLanguage: outletConfig.defaultLanguage,
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    exportedVersion: version,
  };
}

describe("Cronkite manifest", () => {
  it("validates against the CPS-02 JSON Schema", () => {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addContractFormats(ajv);
    const validate = ajv.compile(schema);

    expect(validate(cronkiteManifest), JSON.stringify(validate.errors)).toBe(
      true,
    );
  });

  it("declares the authoritative layouts, languages, identity, and exports", () => {
    expect(() =>
      assertManifestAlignment(cronkiteManifest, sources()),
    ).not.toThrow();
    expect(cronkiteManifest.languages).toEqual(["en", "es", "it"]);
    expect(outletConfig.defaultLanguage).toBe("en");
    expect(cronkiteManifest.layouts).not.toContain("coming-soon");
    expect(cronkiteManifest.capabilities).toEqual({
      fonts: { export: "fontFiles" },
    });

    for (const descriptor of Object.values(cronkiteManifest.renderables)) {
      if ("export" in descriptor && descriptor.export) {
        expect(
          typeof renderer[descriptor.export as keyof typeof renderer],
        ).toBe("function");
      }
    }
  });

  it("makes every drift boundary fail closed", () => {
    const layouts = structuredClone(
      cronkiteManifest,
    ) as unknown as CronkiteCLSManifest;
    layouts.layouts = ["homepage"];
    expect(() => assertManifestAlignment(layouts, sources())).toThrow(
      "layout drift",
    );

    const languages = structuredClone(
      cronkiteManifest,
    ) as unknown as CronkiteCLSManifest;
    languages.languages = ["en"];
    expect(() => assertManifestAlignment(languages, sources())).toThrow(
      "language drift",
    );

    const identity = structuredClone(
      cronkiteManifest,
    ) as unknown as CronkiteCLSManifest;
    identity.version = "9.9.9";
    expect(() => assertManifestAlignment(identity, sources())).toThrow(
      "package identity drift",
    );
  });

  it("owns localized system copy and preserves current English and Spanish 404 text", () => {
    for (const page of cronkiteManifest.systemPages) {
      expect(Object.keys(page.copy).sort()).toEqual(["en", "es", "it"]);
      expect(cronkiteManifest.layouts).toContain(page.layout);
    }

    const notFound = cronkiteManifest.systemPages.find(
      (page) => page.layout === "404",
    );
    expect(notFound?.copy).toEqual({
      en: {
        title: "Page Not Found",
        description: "The page you are looking for does not exist.",
      },
      es: {
        title: "Página no encontrada",
        description: "La página que buscas no existe.",
      },
      it: {
        title: "Pagina non trovata",
        description: "La pagina che stai cercando non esiste.",
      },
    });
  });

  it("declares the opaque live-program release and canonical pointer ordering", () => {
    expect(cronkiteManifest.renderables["live-program"]).toEqual({
      engine: "handlebars",
      export: "liveProgramReleaseFiles",
      outputMode: "files",
      lifecycle: "request",
      inputSchema: "dist/schemas/live-program-release-input.schema.json",
      contract: {
        kind: "alcantara.program-template",
        version: 1,
      },
    });
    expect(cronkiteManifest.writeOrdering["live-program"]).toEqual({
      last: ["html/program.html"],
    });
  });
});

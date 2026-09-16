import { createRequire } from "node:module";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { addContractFormats } from "./json-schema-formats.js";
import { liveProgramReleaseFiles } from "./live-program-release.js";
import { liveProgramPageFiles } from "./renderer.node.js";
import { version } from "./version.js";

const require = createRequire(import.meta.url);
const inputSchema =
  require("./schemas/live-program-release-input.schema.json") as object;

describe("live-program release renderable", () => {
  it("preserves legacy bundle output and appends the configured canonical pointer last", () => {
    const legacyFiles = liveProgramPageFiles();
    const release = liveProgramReleaseFiles({
      programId: "fifthbell",
      apiBaseUrl: "https://api.example.test/program/fifthbell",
    });

    expect(legacyFiles.some((file) => file.key === "index.html")).toBe(true);
    expect(legacyFiles.some((file) => file.key.startsWith("html/"))).toBe(
      false,
    );
    expect(release.at(-1)?.key).toBe("html/program.html");
    expect(
      release
        .slice(0, -1)
        .every((file) => file.key.startsWith(`html/live-program.v${version}/`)),
    ).toBe(true);

    const canonical = release.at(-1)?.body.toString("utf8") ?? "";
    expect(canonical).toContain(`<base href="./live-program.v${version}/">`);
    expect(canonical).toContain(
      'window.__FIFTHBELL_LIVE_PROGRAM_CONFIG__={"programId":"fifthbell","apiBaseUrl":"https://api.example.test/program/fifthbell"}',
    );
  });

  it("rejects unsafe or incomplete runtime configuration before producing files", () => {
    expect(() =>
      liveProgramReleaseFiles({
        programId: "fifthbell",
        apiBaseUrl: "http://api.example.test",
      }),
    ).toThrow("must use HTTPS outside local development");
    expect(() =>
      liveProgramReleaseFiles({
        programId: "../other",
        apiBaseUrl: "https://api.example.test",
      }),
    ).toThrow("programId is invalid");
  });

  it("preserves the existing local-development HTTP exception", () => {
    expect(() =>
      liveProgramReleaseFiles({
        programId: "fifthbell",
        apiBaseUrl: "http://127.0.0.1:3000/program/fifthbell",
      }),
    ).not.toThrow();
  });

  it("keeps the packaged input schema aligned with runtime URL policy", () => {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addContractFormats(ajv);
    const validate = ajv.compile(inputSchema);

    expect(
      validate({
        programId: "fifthbell",
        apiBaseUrl: "https://api.example.test/program/fifthbell",
      }),
    ).toBe(true);
    expect(
      validate({
        programId: "fifthbell",
        apiBaseUrl: "http://localhost:3000/program/fifthbell",
      }),
    ).toBe(true);
    expect(
      validate({
        programId: "fifthbell",
        apiBaseUrl: "http://api.example.test/program/fifthbell",
      }),
    ).toBe(false);
    expect(
      validate({
        programId: "fifthbell",
        apiBaseUrl: "https://user:password@api.example.test/program",
      }),
    ).toBe(false);
  });
});

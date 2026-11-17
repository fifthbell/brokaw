import { createRequire } from "node:module";
import { Ajv2020 } from "ajv/dist/2020.js";
import fs from "node:fs";
import { describe, expect, it, vi } from "vitest";
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
    expect(() => liveProgramReleaseFiles(null as any)).toThrow("live-program release input must be an object");
    expect(() => liveProgramReleaseFiles([] as any)).toThrow("live-program release input must be an object");
    expect(() => liveProgramReleaseFiles("string" as any)).toThrow("live-program release input must be an object");
    expect(() => liveProgramReleaseFiles({ programId: "fifthbell" } as any)).toThrow(
      "live-program release input requires only apiBaseUrl and programId",
    );
    expect(() =>
      liveProgramReleaseFiles({
        programId: "fifthbell",
        apiBaseUrl: "https://api.example.test",
        extraProp: true,
      } as any),
    ).toThrow("live-program release input requires only apiBaseUrl and programId");
    expect(() =>
      liveProgramReleaseFiles({
        programId: 123 as any,
        apiBaseUrl: "https://api.example.test",
      }),
    ).toThrow("programId is invalid");
    expect(() =>
      liveProgramReleaseFiles({
        programId: "a".repeat(129),
        apiBaseUrl: "https://api.example.test",
      }),
    ).toThrow("programId is invalid");
    expect(() =>
      liveProgramReleaseFiles({
        programId: "fifthbell",
        apiBaseUrl: 123 as any,
      }),
    ).toThrow("live-program apiBaseUrl must be an absolute URL");
    expect(() =>
      liveProgramReleaseFiles({
        programId: "fifthbell",
        apiBaseUrl: "not a valid url",
      }),
    ).toThrow("live-program apiBaseUrl must be an absolute URL");
    expect(() =>
      liveProgramReleaseFiles({
        programId: "fifthbell",
        apiBaseUrl: "http://api.example.test",
      }),
    ).toThrow("must use HTTPS outside local development");
    expect(() =>
      liveProgramReleaseFiles({
        programId: "fifthbell",
        apiBaseUrl: "https://user:pass@api.example.test",
      }),
    ).toThrow("cannot contain credentials, query parameters, or a fragment");
    expect(() =>
      liveProgramReleaseFiles({
        programId: "fifthbell",
        apiBaseUrl: "https://api.example.test?param=1",
      }),
    ).toThrow("cannot contain credentials, query parameters, or a fragment");
    expect(() =>
      liveProgramReleaseFiles({
        programId: "fifthbell",
        apiBaseUrl: "https://api.example.test#section",
      }),
    ).toThrow("cannot contain credentials, query parameters, or a fragment");
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

  it("refuses a bundle whose index.html has no <head>", () => {
    const realRead = fs.readFileSync.bind(fs);
    const readSpy = vi.spyOn(fs, "readFileSync").mockImplementation(((path: any, options: any) => {
      const contents = realRead(path, options);
      return String(path).endsWith("index.html")
        ? Buffer.from("<html><body>No head</body></html>")
        : contents;
    }) as typeof fs.readFileSync);
    try {
      expect(() =>
        liveProgramReleaseFiles({
          programId: "fifthbell",
          apiBaseUrl: "https://api.example.test",
        }),
      ).toThrow("live-program index.html is missing <head>");
    } finally {
      readSpy.mockRestore();
    }
  });

  it("throws when bundle is missing index.html", () => {
    const realReaddir = fs.readdirSync.bind(fs);
    const readdirSpy = vi.spyOn(fs, "readdirSync").mockImplementation(((p: any, opts: any) => {
      const res = realReaddir(p, opts);
      if (Array.isArray(res)) {
        return res.filter((item: any) => item.name !== "index.html");
      }
      return res;
    }) as any);
    try {
      expect(() =>
        liveProgramReleaseFiles({
          programId: "fifthbell",
          apiBaseUrl: "https://api.example.test",
        }),
      ).toThrow("live-program bundle is missing index.html");
    } finally {
      readdirSpy.mockRestore();
    }
  });
});

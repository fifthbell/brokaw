import {
  liveProgramPageFiles,
  type LiveProgramFileEntry,
} from "./renderer.node.js";
import type { FifthbellLiveProgramReleaseInput } from "./types/live-program-release-input.generated.js";
import { version } from "./version.js";

const PROGRAM_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function validateInput(input: unknown): FifthbellLiveProgramReleaseInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("live-program release input must be an object");
  }

  const values = input as Record<string, unknown>;
  const keys = Object.keys(values).sort();
  if (keys.join(",") !== "apiBaseUrl,programId") {
    throw new Error(
      "live-program release input requires only apiBaseUrl and programId",
    );
  }
  if (
    typeof values.programId !== "string" ||
    !PROGRAM_ID.test(values.programId) ||
    values.programId.length > 128
  ) {
    throw new Error("live-program programId is invalid");
  }
  if (typeof values.apiBaseUrl !== "string") {
    throw new Error("live-program apiBaseUrl must be an absolute URL");
  }

  let apiBaseUrl: URL;
  try {
    apiBaseUrl = new URL(values.apiBaseUrl);
  } catch {
    throw new Error("live-program apiBaseUrl must be an absolute URL");
  }
  const localHttp =
    apiBaseUrl.protocol === "http:" &&
    (apiBaseUrl.hostname === "localhost" ||
      apiBaseUrl.hostname === "127.0.0.1");
  if (
    (apiBaseUrl.protocol !== "https:" && !localHttp) ||
    apiBaseUrl.username ||
    apiBaseUrl.password ||
    apiBaseUrl.search ||
    apiBaseUrl.hash
  ) {
    throw new Error(
      "live-program apiBaseUrl must use HTTPS outside local development and cannot contain credentials, query parameters, or a fragment",
    );
  }

  return {
    programId: values.programId,
    apiBaseUrl: values.apiBaseUrl.replace(/\/$/, ""),
  };
}

function configureCanonicalDocument(
  html: string,
  releasePrefix: string,
  input: FifthbellLiveProgramReleaseInput,
): string {
  const head = html.match(/<head(?:\s[^>]*)?>/i)?.[0];
  if (!head) throw new Error("live-program index.html is missing <head>");

  const runtimeConfig = JSON.stringify(input)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
  const injection = [
    `<base href="./${releasePrefix}/">`,
    `<script>window.__FIFTHBELL_LIVE_PROGRAM_CONFIG__=${runtimeConfig};</script>`,
  ].join("\n    ");
  return html.replace(head, `${head}\n    ${injection}`);
}

export function liveProgramReleaseFiles(
  input: FifthbellLiveProgramReleaseInput,
): LiveProgramFileEntry[] {
  const validated = validateInput(input);
  const bundleFiles = liveProgramPageFiles();
  const index = bundleFiles.find((file) => file.key === "index.html");
  if (!index) throw new Error("live-program bundle is missing index.html");

  const relativeReleasePrefix = `live-program.v${version}`;
  const releasePrefix = `html/${relativeReleasePrefix}`;
  return [
    ...bundleFiles.map((file) => ({
      ...file,
      key: `${releasePrefix}/${file.key}`,
    })),
    {
      key: "html/program.html",
      body: Buffer.from(
        configureCanonicalDocument(
          index.body.toString("utf8"),
          relativeReleasePrefix,
          validated,
        ),
      ),
      contentType: index.contentType,
    },
  ];
}

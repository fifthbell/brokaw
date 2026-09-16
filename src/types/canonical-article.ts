import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js";
import { addContractFormats } from "../json-schema-formats.js";
import type { CronkiteCanonicalDocument } from "./canonical-document.generated.js";
import { canonicalDocumentSchema } from "./canonical-document-schema.generated.js";

const ajv = new Ajv2020({ allErrors: true, strict: false, useDefaults: true });
addContractFormats(ajv);
const validateCanonicalDocument = ajv.compile(canonicalDocumentSchema);

function summarizeValidationErrors(errors: ErrorObject[] | null | undefined) {
  return (errors ?? [])
    .slice(0, 8)
    .map(
      (error) =>
        `${error.instancePath || "/"} ${error.message ?? "is invalid"}`,
    )
    .join("; ");
}

export const canonicalArticleSchema = {
  parse(input: unknown): CanonicalDocument {
    const candidate = structuredClone(input);
    if (!validateCanonicalDocument(candidate)) {
      throw new Error(
        `Canonical document validation failed: ${summarizeValidationErrors(
          validateCanonicalDocument.errors,
        )}`,
      );
    }
    return candidate as CanonicalDocument;
  },
};

export type CanonicalDocument = CronkiteCanonicalDocument;
export type CanonicalArticle = CanonicalDocument;
export type RumConfig = NonNullable<CanonicalDocument["rumConfig"]>;
export type SelfReference = NonNullable<CanonicalDocument["articles"]>[number];

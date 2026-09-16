import type { Ajv2020 } from "ajv/dist/2020.js";

export function addContractFormats(ajv: Ajv2020): void {
  ajv.addFormat("date-time", {
    type: "string",
    validate: (value: string) =>
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        value,
      ) && !Number.isNaN(Date.parse(value)),
  });
  ajv.addFormat("uri", {
    type: "string",
    validate: (value: string) => {
      try {
        const url = new URL(value);
        return Boolean(url.protocol);
      } catch {
        return false;
      }
    },
  });
  ajv.addFormat(
    "uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
}

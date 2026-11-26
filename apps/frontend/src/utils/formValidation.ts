import { z } from "@repo/zod-validations";
import type { ActionResult } from "./actionResult";
import type { FORM_FIELDS } from "../constants/fields";

type FormFieldName = (typeof FORM_FIELDS)[keyof typeof FORM_FIELDS];

// submitForm validates the mapped form fields against the schema and
// forwards to `submit` on success; on failure it returns the
// "validation" variant of ActionResult so components render field errors
// inline. `submit` must itself return an ActionResult — service
// server-failures surface through the same union, so a route action
// always returns exactly one result shape.
//
// On success it calls submit with the original formData first (services
// may need fields outside the schema — hidden IDs, files — e.g. updateUser
// forwards the multipart body) and the parsed data second. fields keys
// must match the schema's own output keys and values must be FORM_FIELDS
// names, so a typo'd key or a drifted field name is a compile error.
async function submitForm<Schema extends z.ZodType, T>(
  schema: Schema,
  formData: FormData,
  fields: Record<keyof z.output<Schema> & string, FormFieldName>,
  submit: (
    formData: FormData,
    data: z.output<Schema>,
  ) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  // Object.entries can't see the generic keyof, so its value type widens
  // to unknown; the cast only restores what the fields param already
  // guarantees.
  const parsed = schema.safeParse(
    Object.fromEntries(
      Object.entries(fields as Record<string, string>).map(([key, name]) => [
        key,
        formData.get(name),
      ]),
    ),
  );

  if (!parsed.success) {
    return {
      ok: false,
      kind: "validation",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  return await submit(formData, parsed.data);
}

export { submitForm };

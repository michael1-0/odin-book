import { z } from "@repo/zod-validations";
import { FORM_FIELDS } from "../constants/fields";

type FormFieldName = (typeof FORM_FIELDS)[keyof typeof FORM_FIELDS];

// Validation-failure envelope for route actions. Two { error: true } shapes
// coexist: validation failures (this envelope) carry errors with no message,
// while service server-failures carry message — createPost/createComment
// additionally stash the raw backend envelope under an errors key of a
// different shape. Components read field errors via fetcher.data?.errors,
// and Profile's picture-reset tells the two kinds apart by the presence of
// errors, so this shape must stay exactly this.
//
// submitForm validates the mapped form fields against the schema; on
// success it calls submit with the original formData first (services may
// need fields outside the schema — hidden IDs, files — e.g. updateUser
// forwards the multipart body) and the parsed data second. fields keys
// must match the schema's own output keys and values must be FORM_FIELDS
// names, so a typo'd key or a drifted field name is a compile error.
export async function submitForm<Schema extends z.ZodType>(
  schema: Schema,
  formData: FormData,
  fields: Record<keyof z.output<Schema> & string, FormFieldName>,
  submit: (formData: FormData, data: z.output<Schema>) => Promise<unknown>,
) {
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
    return { error: true, errors: z.flattenError(parsed.error).fieldErrors };
  }

  return await submit(formData, parsed.data);
}

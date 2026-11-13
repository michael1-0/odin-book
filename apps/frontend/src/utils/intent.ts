import { FORM_FIELDS } from "../constants/fields";

// Thrown by every route action when the submitted intent isn't recognized.
export function unknownIntent(): Response {
  return new Response("Unknown intent", { status: 400 });
}

// Reads the intent field from an action's formData; forms that omit it
// fail with the same 400 as unrecognized intents.
export function readIntent(formData: FormData): string {
  const intent = formData.get(FORM_FIELDS.intent);

  if (typeof intent !== "string") {
    throw unknownIntent();
  }

  return intent;
}

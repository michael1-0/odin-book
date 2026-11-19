// Reads one writable form field out of a FormData. Hidden-input IDs are
// the usual case; empty values are treated as missing so callers guard
// once instead of re-checking `typeof` at every read.
function readFormField(formData: FormData, field: string): string | undefined {
  const value = formData.get(field);

  return typeof value === "string" && value !== "" ? value : undefined;
}

export { readFormField };

import { describe, expect, it, vi } from "vitest";
import {
  CommentCreateBodySchema,
  PostCreateBodySchema,
} from "@repo/zod-validations";
import { FORM_FIELDS } from "../../../src/constants/fields";
import { serverFailure } from "../../../src/utils/actionResult";
import { submitForm } from "../../../src/utils/formValidation";

describe("submitForm", () => {
  it("validates the mapped fields and forwards the parsed data", async () => {
    const formData = new FormData();
    formData.set(FORM_FIELDS.content, "Hello");

    const submit = vi.fn((_formData: FormData, data: { content: string }) =>
      Promise.resolve({
        ok: true as const,
        data,
      }),
    );

    const result = await submitForm(
      PostCreateBodySchema,
      formData,
      { content: FORM_FIELDS.content },
      submit,
    );

    expect(result).toEqual({ ok: true, data: { content: "Hello" } });
    expect(submit).toHaveBeenCalledWith(formData, { content: "Hello" });
  });

  it("returns the validation variant without calling submit", async () => {
    const formData = new FormData();
    formData.set(FORM_FIELDS.content, "");

    const submit = vi.fn();

    const result = await submitForm(
      PostCreateBodySchema,
      formData,
      { content: FORM_FIELDS.content },
      submit,
    );

    expect(result).toMatchObject({
      ok: false,
      kind: "validation",
      fieldErrors: { content: ["Content cannot be empty"] },
    });
    expect(submit).not.toHaveBeenCalled();
  });

  it("feeds the schema's coerced output to submit", async () => {
    const formData = new FormData();
    formData.set(FORM_FIELDS.postId, "7");
    formData.set(FORM_FIELDS.content, "Nice post");

    const submit = vi.fn(
      (_formData: FormData, data: { postId: number; content: string }) =>
        Promise.resolve({
          ok: true as const,
          data,
        }),
    );

    const result = await submitForm(
      CommentCreateBodySchema,
      formData,
      {
        postId: FORM_FIELDS.postId,
        content: FORM_FIELDS.content,
      },
      submit,
    );

    expect(result).toEqual({
      ok: true,
      data: { postId: 7, content: "Nice post" },
    });
  });

  it("passes server failures through unchanged", async () => {
    const formData = new FormData();
    formData.set(FORM_FIELDS.content, "Hello");

    const failure = serverFailure("Failed to create post");

    const result = await submitForm(
      PostCreateBodySchema,
      formData,
      { content: FORM_FIELDS.content },
      () => Promise.resolve(failure),
    );

    expect(result).toBe(failure);
  });
});

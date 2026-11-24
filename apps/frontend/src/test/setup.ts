import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library registers its auto-cleanup only when the test globals are
// enabled. Tests import vitest explicitly instead, so clean up by hand.
afterEach(() => {
  cleanup();
});

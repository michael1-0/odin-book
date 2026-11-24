import request from "supertest";
import app from "../../src/app.ts";

export function api() {
  return request(app);
}

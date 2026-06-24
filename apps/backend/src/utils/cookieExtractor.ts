import type { Request } from "express";

function cookieExtractor(req: Request) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["token"];
  }
  return token;
}

export default cookieExtractor;

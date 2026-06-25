import { createHash } from "crypto";

function createGravatarUrl(email: string) {
  if (!email) {
    return email;
  }
  const trimmedEmail = email.trim().toLowerCase();
  const hash = createHash("sha256").update(trimmedEmail).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}`;
}

export default createGravatarUrl;

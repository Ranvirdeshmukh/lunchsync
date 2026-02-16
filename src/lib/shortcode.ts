import { customAlphabet } from "nanoid";

const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // no ambiguous chars
const generate = customAlphabet(alphabet, 6);

export function generateShortCode(): string {
  return generate();
}

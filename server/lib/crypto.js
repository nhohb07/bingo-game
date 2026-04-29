import crypto from "node:crypto";
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "../../shared/constants.js";

export function makeId() {
  return crypto.randomUUID();
}

export function makeRoomCode(hasCode) {
  let code = "";
  do {
    code = Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_ALPHABET[crypto.randomInt(ROOM_CODE_ALPHABET.length)]).join("");
  } while (hasCode(code));
  return code;
}

export function makeHostToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function secureCompare(expectedValue, receivedValue) {
  if (!expectedValue || !receivedValue) return false;
  const expected = Buffer.from(String(expectedValue));
  const received = Buffer.from(String(receivedValue));
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

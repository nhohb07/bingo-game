export function tidyCode(value: string) {
  return value.toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function itemKey(value: string) {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleUpperCase("vi-VN");
}

export function readJson<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as T | null;
  } catch {
    return null;
  }
}

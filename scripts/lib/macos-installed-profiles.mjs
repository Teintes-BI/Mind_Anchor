export function parseProfilesShowJson(jsonText) {
  const trimmed = jsonText.trim();
  if (!trimmed) {
    return {};
  }
  return JSON.parse(trimmed);
}

export const buildCurlAuthArgs = (headers = {}) => {
  const normalizedHeaders = { ...headers };
  const authorizationHeader = normalizedHeaders.Authorization ?? normalizedHeaders.authorization ?? null;
  delete normalizedHeaders.Authorization;
  delete normalizedHeaders.authorization;

  const headerArgs = Object.entries(normalizedHeaders).flatMap(([name, value]) =>
    value === null || value === undefined || value === "" ? [] : ["-H", `${name}: ${value}`],
  );

  if (typeof authorizationHeader !== "string") {
    return headerArgs;
  }

  const bearerMatch = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) {
    return [...headerArgs, "-H", `Authorization: ${authorizationHeader}`];
  }

  return [...headerArgs, "--oauth2-bearer", bearerMatch[1]];
};

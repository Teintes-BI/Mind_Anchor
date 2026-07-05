export const OPENCLAW_MINIMUM_NODE_VERSION = {
  major: 22,
  minor: 16,
  patch: 0,
};

const parseVersion = (rawVersion) => {
  const normalized = String(rawVersion ?? "").trim();
  const match = normalized.match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
};

export const isNodeVersionAtLeast = (rawVersion, minimumVersion = OPENCLAW_MINIMUM_NODE_VERSION) => {
  const parsed = parseVersion(rawVersion);
  if (!parsed) {
    return false;
  }
  if (parsed.major !== minimumVersion.major) {
    return parsed.major > minimumVersion.major;
  }
  if (parsed.minor !== minimumVersion.minor) {
    return parsed.minor > minimumVersion.minor;
  }
  return parsed.patch >= minimumVersion.patch;
};

export const selectOpenClawNodeBinary = ({ candidates, minimumVersion = OPENCLAW_MINIMUM_NODE_VERSION }) => {
  const checkedCandidates = [];

  for (const candidate of candidates ?? []) {
    if (!candidate?.path || !candidate?.version) {
      continue;
    }
    const compatible = isNodeVersionAtLeast(candidate.version, minimumVersion);
    checkedCandidates.push({
      path: candidate.path,
      version: candidate.version,
      compatible,
    });
    if (compatible) {
      return {
        path: candidate.path,
        version: candidate.version,
        checkedCandidates,
      };
    }
  }

  return {
    path: null,
    version: null,
    checkedCandidates,
  };
};

import path from "node:path";

export function defaultOpenClawRegistryE2EBuildSourcePaths(repoRoot) {
  return [
    path.resolve(repoRoot, "apps/macos/Sources/App/MindAnchorMacApp.swift"),
    path.resolve(repoRoot, "apps/macos/Sources/Core/AppConfiguration.swift"),
    path.resolve(repoRoot, "apps/macos/Sources/Core/NotificationStatusDiagnosticRunner.swift"),
    path.resolve(repoRoot, "apps/macos/project.yml"),
  ];
}

export function shouldRebuildOpenClawRegistryE2EApp({
  appBundleMTimeMs,
  sourceMTimeMsList,
}) {
  if (appBundleMTimeMs == null) {
    return true;
  }

  return sourceMTimeMsList.some((mtime) => Number.isFinite(mtime) && mtime > appBundleMTimeMs);
}

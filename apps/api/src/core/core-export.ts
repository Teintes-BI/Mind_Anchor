import type { CoreExport, CoreEvent } from "@mindanchor/domain";
import type { CoreRepository } from "./core-types.js";

export const exportCoreProfile = (repository: CoreRepository, profileId: string, userId: string): Promise<CoreExport> =>
  repository.exportProfile(profileId, userId);

export const buildCloudProjection = (repository: CoreRepository, event: CoreEvent) =>
  repository.buildCloudProjection(event);

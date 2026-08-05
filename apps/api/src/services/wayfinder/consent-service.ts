import { z } from "zod";
import {
  consentGrantSchema,
  updateConsentInputSchema,
  type ConsentGrant,
} from "@mindanchor/domain";
import { createId, now } from "../../lib/utils.js";
import { WayfinderRepository } from "./wayfinder-repository.js";

export class WayfinderConsentService {
  constructor(private readonly repository: WayfinderRepository) {}

  list(userId: string) {
    return this.repository.listConsentGrants(userId);
  }

  async upsert(
    userId: string,
    input: z.infer<typeof updateConsentInputSchema>,
    traceId: string,
  ): Promise<ConsentGrant> {
    const parsed = updateConsentInputSchema.parse(input);
    const existing = this.repository
      .listConsentGrants(userId)
      .find(
        (grant) =>
          grant.source === parsed.source && grant.purpose === parsed.purpose && grant.scope === parsed.scope,
      );
    const timestamp = now();
    return this.repository.saveConsentGrant(
      consentGrantSchema.parse({
        id: existing?.id ?? createId(),
        userId,
        ...parsed,
        grantedAt: existing?.grantedAt ?? timestamp,
        updatedAt: timestamp,
        traceId,
      }),
    );
  }

  isGranted(userId: string, consentRef: string) {
    return this.repository
      .listConsentGrants(userId)
      .some((grant) => grant.id === consentRef && grant.status === "granted");
  }

  assertGranted(userId: string, consentRef: string) {
    if (!this.isGranted(userId, consentRef)) {
      throw new Error("wayfinder_consent_required");
    }
  }
}

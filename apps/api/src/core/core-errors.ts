export const CORE_ERROR_CODES = [
  "core_profile_scope_mismatch",
  "core_idempotency_conflict",
  "core_revision_conflict",
  "core_not_found",
  "core_permission_required",
  "core_p3_egress_blocked",
  "core_migration_checksum_mismatch",
] as const;

export type CoreErrorCode = (typeof CORE_ERROR_CODES)[number];

export class CoreError extends Error {
  readonly code: CoreErrorCode;

  constructor(code: CoreErrorCode, message = code) {
    super(message);
    this.name = "CoreError";
    this.code = code;
  }
}

# Wayfinder Health Data Boundary

## Allowed input

MindAnchor accepts only user-authorized, aggregated summaries from Android Health Connect, iOS HealthKit, or a vendor SDK/cloud adapter that has already been normalized into the shared contract. The supported summary kinds are sleep, activity, steps, and resting heart rate.

The mobile client sends `windowStart`, `windowEnd`, `capturedAt`, `receivedAt`, source provenance, consent scope, retention class, missingness, and bounded values. Raw samples, raw sensor streams, account credentials, and provider tokens stay on the phone/provider side.

## Missingness and delay

- `available`: at least one bounded value was returned inside the requested window.
- `missing`: permission, provider, or device returned no value. This is not evidence of inactivity.
- `delayed`: a value exists but arrived more than 24 hours after the requested window. It is kept as low-confidence context and ignored for dose changes.

## Policy boundary

Health data can influence the strength of a recovery or reduced-load option. It cannot create a medical diagnosis, declare that a user must stop, trigger an external action, or override a user's explicit choice. Every derived summary carries provenance, confidence, evidence references, and retention metadata.

## Consent, pause, revoke, export, delete

The user starts each mobile sync from a visible control after the platform permission prompt. Pausing or revoking `health_summary` stops new uploads. Existing summaries are included in `POST /wayfinder/export` and removed by `POST /wayfinder/delete`; deletion is verified by re-reading the export after the operation.

## Calibration

The system may record a prediction band (`low`, `medium`, `high`), the user's later band/rating, outcome, and bounded absolute error. Calibration is an evaluation aid, not a clinical score. Reports group error by user, recommendation, and time window.

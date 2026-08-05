import catalog from "../skills/wayfinder-perspective-packs.json" with { type: "json" };

const packs = Array.isArray(catalog?.packs) ? catalog.packs : [];

export const WAYFINDER_PERSPECTIVE_PACKS = Object.freeze(
  packs.map((pack) =>
    Object.freeze({
      ...pack,
      skill: `${pack.id}@${pack.version}`,
    }),
  ),
);

export const WAYFINDER_PERSPECTIVE_PACK_IDS = Object.freeze(
  WAYFINDER_PERSPECTIVE_PACKS.map((pack) => pack.skill),
);

export const isWayfinderPerspectivePack = (value) => WAYFINDER_PERSPECTIVE_PACK_IDS.includes(value);

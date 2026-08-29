export const GROUPS = [
  { kind: 'field', heading: 'Field of study' },
  { kind: 'project', heading: 'Projects' },
  { kind: 'skill', heading: 'Skills' },
  { kind: 'interest', heading: 'Interests' },
];

const VALID_KINDS = new Set(GROUPS.map((g) => g.kind));

function normalizeKind(kind) {
  if (typeof kind !== 'string') return null;
  let k = kind.trim().toLowerCase();
  if (k === 'field of study' || k === 'fields of study') return 'field';
  if (k.endsWith('s')) k = k.slice(0, -1); // skills -> skill, projects -> project
  return VALID_KINDS.has(k) ? k : null;
}

export function parsePoints(raw) {
  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [{ kind: 'skill', hasKind: false, label: raw, why: '' }];
  }

  if (!Array.isArray(parsed)) return [];

  return normalizePoints(parsed);
}

export function normalizePoints(parsed) {
  if (!Array.isArray(parsed)) return [];

  return parsed.map((p) => {
    if (typeof p === 'string') {
      return { kind: 'skill', hasKind: false, label: p, why: '' };
    }
    const kind = normalizeKind(p.kind);
    return {
      kind: kind ?? 'skill',
      hasKind: kind !== null,
      label: p.label ?? '',
      why: p.why ?? '',
    };
  });
}

export function groupPoints(points) {
  if (points.length === 0) return [];

  if (!points.some((p) => p.hasKind)) {
    return [{ kind: 'all', heading: null, points }];
  }

  return GROUPS.map((g) => ({
    ...g,
    points: points.filter((p) => p.kind === g.kind),
  })).filter((g) => g.points.length > 0);
}
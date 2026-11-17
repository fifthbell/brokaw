/**
 * Input Brokaw does not recognize is ignored, not rejected (gaulatti/ariston#217:
 * "If we don't recognize it, we ignore it"). Each ignored item is counted
 * under a fixed reason, and the first one of each reason writes one log line
 * naming only that reason, so neither the counters nor the log grow with
 * the input. Nothing from the input itself (names, values) is logged.
 */
export const IGNORED_INPUT_REASONS = [
  /** A body block whose `type` this release does not render: the block is dropped. */
  'document_body_block_type',
  /** A heading `level` other than 2, 3 or 4: rendered as level 2. */
  'document_heading_level',
  /** An `infoBox` `tone` outside neutral/info/warning/success: rendered as `neutral`. */
  'document_info_box_tone',
  /** A `heroLayout` outside spotlight/editorial: treated as absent. */
  'document_hero_layout',
  /** An unknown member of `capturedSelection` or its `context`. */
  'captured_selection_field',
  /** An unknown member of the captured catalog, its context or a resource descriptor. */
  'captured_catalog_field',
  /** A captured catalog `state` other than selected/withdrawn: not readable, like withdrawn. */
  'captured_catalog_state',
  /** A captured resource `kind` this release does not read: the resource is skipped. */
  'captured_resource_kind',
  /** An unknown member of `rumConfig`. */
  'rum_config_field',
  /** An embed provider the helper does not declare: the helper yields '' and the embed is omitted. */
  'embed_provider',
  /** An unknown member of the live-program release input. */
  'live_program_release_field',
] as const;

export type IgnoredInputReason = (typeof IGNORED_INPUT_REASONS)[number];

const counts = new Map<IgnoredInputReason, number>();

export function recordIgnoredInput(reason: IgnoredInputReason, amount = 1): void {
  if (amount <= 0) return;
  const previous = counts.get(reason) ?? 0;
  counts.set(reason, previous + amount);
  if (previous === 0) console.warn(`[brokaw] ignored unrecognized input: ${reason}`);
}

/** Counts of ignored input since this module loaded, one entry per reason. */
export function ignoredInputCounts(): Readonly<Record<IgnoredInputReason, number>> {
  return Object.freeze(
    Object.fromEntries(IGNORED_INPUT_REASONS.map((reason) => [reason, counts.get(reason) ?? 0])) as Record<IgnoredInputReason, number>,
  );
}

/** Counts the members of `value` that are not in `known` under `reason`. */
export function recordUnknownMembers(value: object, known: readonly string[], reason: IgnoredInputReason): void {
  recordIgnoredInput(reason, Object.keys(value).filter((key) => !known.includes(key)).length);
}

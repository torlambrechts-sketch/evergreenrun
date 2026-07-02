/**
 * The active rule-set version. Bump this whenever any number in /config/rules
 * changes. It is stamped onto every Plan and durability_index_snapshot the
 * engine produces, so a row can always be traced back to the rules that made it.
 *
 * `-draft` marks a rule set the advisor has NOT yet signed. Drop the suffix and
 * flip advisorSigned to true (in index.ts) only once every number is signed off.
 */
export const RULE_SET_VERSION = "2026.07.02-draft";

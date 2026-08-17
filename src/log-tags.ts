/** Console request-log formatting shared by the Node and Worker hosts. */

/** Tag a non-compressed outcome's skip reason for the stdout / `wrangler tail`
 *  request line. Empty string when there is no reason, so the caller can append
 *  it unconditionally without a spurious `savings:skip()`. */
export function skipReasonTag(reason: string | undefined): string {
  return reason ? `savings:skip(${reason})` : '';
}

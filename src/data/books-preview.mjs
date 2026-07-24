/**
 * Legacy compatibility export.
 *
 * Every numbered route now imports a dedicated full editorial-preview module.
 * Keeping the empty collection lets validation code prove that no compressed
 * fallback is reachable without retaining the former six-block outlines.
 */
export const previewBooks = [];
export const previewBookByNumber = new Map();

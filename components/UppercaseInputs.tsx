'use client';

/**
 * Global interceptor: converts every free-text input value to UPPERCASE
 * both visually (globals.css) and in the React controlled state.
 *
 * Skips: email, password, url, number, date/time variants, file, hidden.
 * Renders nothing — mount once in the root layout.
 */

import { useEffect } from 'react';

const SKIP_TYPES = new Set([
  'email', 'password', 'url', 'number', 'range',
  'date', 'datetime-local', 'time', 'month', 'week',
  'color', 'file', 'hidden', 'radio', 'checkbox', 'submit', 'reset', 'button', 'image',
]);

export function UppercaseInputs() {
  useEffect(() => {
    const inputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,  'value')?.set;
    const textaSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

    function handler(e: Event) {
      const t = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!t?.tagName) return;

      const tag  = t.tagName.toUpperCase();
      const type = ((t as HTMLInputElement).type ?? '').toLowerCase();

      const eligible =
        (tag === 'INPUT'    && !SKIP_TYPES.has(type)) ||
        (tag === 'TEXTAREA');

      if (!eligible) return;

      const upper = t.value.toUpperCase();
      if (upper === t.value) return;           // already uppercase → no-op, prevents loop

      const setter = tag === 'TEXTAREA' ? textaSetter : inputSetter;
      if (!setter) return;

      // Save cursor so typing stays in place
      const selStart = (t as HTMLInputElement).selectionStart;
      const selEnd   = (t as HTMLInputElement).selectionEnd;

      // Write uppercase value via native setter (bypasses React's stale-value guard)
      setter.call(t, upper);
      // Re-fire input event so React's onChange sees the uppercased value
      t.dispatchEvent(new Event('input', { bubbles: true }));

      // Restore caret
      try { (t as HTMLInputElement).setSelectionRange(selStart, selEnd); } catch { /* non-text types */ }
    }

    // Capture phase: runs before React's synthetic event listener
    document.addEventListener('input', handler, true);
    return () => document.removeEventListener('input', handler, true);
  }, []);

  return null;
}

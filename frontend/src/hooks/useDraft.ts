import { useState } from 'react';
import {
  loadDraft,
  saveDraft,
  deleteDraft,
  type DraftKind,
  type FormDraft,
} from '../services/drafts';

export function useDraft(uid: string, board: string, kind: DraftKind) {
  const [draft, setDraft] = useState(() => loadDraft(uid, board, kind));
  const [saved, setSaved] = useState<boolean | undefined>();
  function save(form: HTMLFormElement) {
    const values = Object.fromEntries(new FormData(form)) as FormDraft;
    setDraft(values);
    setSaved(saveDraft(uid, board, kind, values));
  }
  function clear(preserveNewer = false) {
    const current = loadDraft(uid, board, kind);
    // A pending post can finish after the user starts a new draft on this tab.
    if (preserveNewer && saved !== false && JSON.stringify(current) !== JSON.stringify(draft)) {
      setDraft(current);
      return false;
    }
    setDraft(undefined);
    setSaved(deleteDraft(uid, board, kind) ? undefined : false);
    return true;
  }
  const message =
    saved === false
      ? 'Draft storage is unavailable. Keep this page open to preserve your changes.'
      : saved
        ? 'Draft saved in this tab.'
        : draft
          ? 'Draft restored in this tab.'
          : 'Drafts are saved in this browser tab and cleared when you sign out.';
  return { draft, save, clear, message };
}

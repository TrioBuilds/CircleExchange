export type FormDraft = Record<string, string>;
export type DraftKind = 'offer' | 'ask';

function accountPrefix(uid: string) {
  return 'circleexchange:draft:' + encodeURIComponent(uid) + ':';
}

function draftKey(uid: string, board: string, kind: DraftKind) {
  return accountPrefix(uid) + encodeURIComponent(board) + ':' + kind;
}

export function loadDraft(uid: string, board: string, kind: DraftKind): FormDraft | undefined {
  try {
    const raw = sessionStorage.getItem(draftKey(uid, board, kind));
    if (!raw || raw.length > 20000) return;
    const draft: unknown = JSON.parse(raw);
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return;
    if (
      Object.keys(draft).length > 20 ||
      !Object.values(draft).every((value) => typeof value === 'string' && value.length <= 1500)
    )
      return;
    return draft as FormDraft;
  } catch {
    return;
  }
}

export function saveDraft(uid: string, board: string, kind: DraftKind, draft: FormDraft) {
  try {
    sessionStorage.setItem(draftKey(uid, board, kind), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function deleteDraft(uid: string, board: string, kind: DraftKind) {
  try {
    sessionStorage.removeItem(draftKey(uid, board, kind));
    return true;
  } catch {
    return false;
  }
}

export function clearDrafts(uid: string) {
  try {
    const prefix = accountPrefix(uid);
    for (let index = sessionStorage.length - 1; index >= 0; index--) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(prefix)) sessionStorage.removeItem(key);
    }
  } catch {
    /* Storage can be disabled by the browser. */
  }
}

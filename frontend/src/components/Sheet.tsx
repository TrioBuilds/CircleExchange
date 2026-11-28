import { useEffect, type ReactNode } from 'react';
import { openSheet } from '../app/navigation';

export default function Sheet({
  id,
  title,
  composer = false,
  busy = false,
  children,
}: {
  id: string;
  title: string;
  composer?: boolean;
  busy?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (composer && window.location.hash === '#' + id) openSheet(id);
  }, [composer, id]);

  return (
    <dialog
      id={id}
      className={composer ? 'sheet composer-sheet' : 'sheet'}
      aria-labelledby={id + '-heading'}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
    >
      <header className="sheet-heading">
        <h2 id={id + '-heading'}>{title}</h2>
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={(event) => event.currentTarget.closest('dialog')?.close()}
        >
          Close
        </button>
      </header>
      {children}
    </dialog>
  );
}

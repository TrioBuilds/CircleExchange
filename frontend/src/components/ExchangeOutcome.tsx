import { useEffect, useState } from 'react';
import { confirmOutcome, loadOutcome, type Outcome } from '../services/outcomes';

export default function ExchangeOutcome({
  board,
  listingId,
  uid,
  isOwner,
}: {
  board: string;
  listingId: string;
  uid: string;
  isOwner: boolean;
}) {
  const [outcome, setOutcome] = useState<Outcome>();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    void loadOutcome(board, listingId)
      .then((result) => {
        if (active) {
          setOutcome(result);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setError('Could not check exchange confirmations.');
      });
    return () => {
      active = false;
    };
  }, [board, listingId, refresh]);

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await confirmOutcome(board, listingId, uid, isOwner);
      setOutcome(await loadOutcome(board, listingId));
    } catch {
      setError('Could not confirm the exchange. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const confirmed = isOwner ? outcome?.ownerConfirmedAt : outcome?.partnerConfirmedAt;
  return (
    <section className="exchange-outcome" aria-label="Exchange confirmation">
      {error && <p role="alert">{error}</p>}
      {outcome?.confirmedAt ? (
        <p role="status">Both members confirmed this exchange.</p>
      ) : confirmed ? (
        <p role="status">You confirmed. Waiting for the other member.</p>
      ) : loaded ? (
        <>
          <p>Confirm once you’ve received what you agreed to.</p>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy ? 'Confirming…' : 'Confirm exchange received'}
          </button>
        </>
      ) : (
        !error && <p role="status">Checking exchange confirmation…</p>
      )}
      {!busy && !outcome?.confirmedAt && (confirmed || error) && (
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setError('');
            setRefresh((value) => value + 1);
          }}
        >
          Refresh confirmation
        </button>
      )}
    </section>
  );
}

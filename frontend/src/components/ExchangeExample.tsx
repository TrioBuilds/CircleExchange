import { useState } from 'react';

export default function ExchangeExample() {
  const [replay, setReplay] = useState(0);
  return (
    <section className="exchange-example" aria-labelledby="example-title">
      <div className="example-heading">
        <p className="eyebrow example-label">Illustrative exchange</p>
        <h2 id="example-title">Movie night for two</h2>
      </div>
      <div className="example-story" key={replay}>
        <div className="example-need">
          <strong>The person looking</strong>
          <p>“I need two movie tickets for Saturday. Any offers?”</p>
        </div>
        <span className="example-arrow" aria-hidden="true">
          ↓
        </span>
        <div className="example-help">
          <strong>The neighbor helping</strong>
          <p>“I can book them with my ticket offer. My fee is ₹200.”</p>
        </div>
        <dl className="example-receipt">
          <div>
            <dt>Ticket discount</dt>
            <dd>Up to ₹500</dd>
          </div>
          <div>
            <dt>Fee paid to the helper</dt>
            <dd>₹200</dd>
          </div>
          <div className="example-net">
            <dt>You save after the fee</dt>
            <dd>Up to ₹300</dd>
          </div>
        </dl>
      </div>
      <p className="example-terms">
        In this example, the helper earns the fee once the tickets are issued. If booking fails,
        there’s no fee. Agree on cancellation terms with the helper before booking.
      </p>
      <button className="example-replay" onClick={() => setReplay((value) => value + 1)}>
        Replay the example <span aria-hidden="true">↻</span>
      </button>
    </section>
  );
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  categories,
  feedbackScreen,
  newFeedbackKey,
  prepareFeedbackImage,
  submitFeedback,
  type Category,
} from '../services/feedback';
import Notice from './Notice';
import '../feedback.css';

export function FeedbackImage({ blob, alt }: { blob: Blob; alt: string }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return <img ref={image} alt={alt} />;
}

export default function FeedbackComposer({ user }: { user: User | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const key = useRef('');
  const [category, setCategory] = useState<Category>('experience');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<Blob[]>([]);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);

  async function addImages(files: File[]) {
    setPreparing(true);
    setError('');
    const results = await Promise.allSettled(
      files.slice(0, 2 - images.length).map(prepareFeedbackImage),
    );
    setImages((previous) => [
      ...previous,
      ...results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])),
    ]);
    const failure = results.find((result) => result.status === 'rejected');
    if (failure)
      setError(
        failure.reason instanceof Error ? failure.reason.message : 'Could not open the image.',
      );
    else if (files.length > 2 - images.length) setError('You can attach up to two images.');
    setPreparing(false);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() || busy || preparing) return;
    setError('');
    setBusy(true);
    key.current ||= newFeedbackKey();
    try {
      const id = await submitFeedback(
        key.current,
        category,
        body.trim(),
        feedbackScreen(user),
        images,
      );
      setReceipt(id.slice(-8).toUpperCase());
      setBody('');
      setImages([]);
      setCategory('experience');
      key.current = '';
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/operation-not-allowed')
        setError('Guest feedback is unavailable. Sign in to send your message.');
      else if (code)
        setError(
          'Could not send yet. Check your connection or try again in a few minutes. Your message is still here.',
        );
      else
        setError(err instanceof Error ? err.message : 'Could not send feedback. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="feedback-footer">
      <button
        className="text-button"
        onClick={() => {
          setReceipt('');
          dialog.current?.showModal();
        }}
      >
        Help us improve
      </button>
      {user && <a href="/feedback">My feedback</a>}
      <dialog
        ref={dialog}
        className="feedback-dialog"
        aria-labelledby="feedback-heading"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <div className="feedback-heading">
          <h2 id="feedback-heading">Help us improve</h2>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            Close
          </button>
        </div>
        {receipt ? (
          <>
            <p className="notice" role="status">
              Thanks for sharing. Your feedback reference is <strong>{receipt}</strong>.
            </p>
            <a className="primary" href="/feedback">
              View my feedback
            </a>
          </>
        ) : (
          <form className="feedback-form" onSubmit={(event) => void send(event)}>
            <fieldset className="feedback-tags" disabled={busy}>
              <legend>What’s on your mind?</legend>
              {(Object.keys(categories) as Category[]).map((item) => (
                <label key={item}>
                  <input
                    type="radio"
                    name="feedback-category"
                    checked={category === item}
                    onChange={() => setCategory(item)}
                  />
                  <span>{categories[item]}</span>
                </label>
              ))}
            </fieldset>
            <label htmlFor="feedback-body">Your message</label>
            <textarea
              id="feedback-body"
              rows={4}
              maxLength={2000}
              required
              disabled={busy}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Tell us what happened or what could work better."
            />
            {images.length > 0 && (
              <div className="feedback-images">
                {images.map((blob, index) => (
                  <div key={index}>
                    <FeedbackImage blob={blob} alt={'Attachment preview ' + (index + 1)} />
                    <button
                      className="text-button"
                      type="button"
                      aria-label={'Remove attachment ' + (index + 1)}
                      disabled={busy || preparing}
                      onClick={() =>
                        setImages((previous) => previous.filter((_, i) => i !== index))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label htmlFor="feedback-images">
              Add screenshots or photos <small>(optional, up to two)</small>
            </label>
            <input
              id="feedback-images"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={busy || preparing || images.length === 2}
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                event.currentTarget.value = '';
                if (files.length) void addImages(files);
              }}
            />
            <p className="fine-print">
              {user && !user.isAnonymous
                ? 'We’ll include your account, circle, current screen, and browser details.'
                : 'We’ll include the current screen and browser details. Return in this browser to check for replies.'}{' '}
              Keep private information out of photos.
            </p>
            <Notice error={error} message="" />
            <button className="primary" disabled={!body.trim() || busy || preparing}>
              {busy ? 'Sending…' : preparing ? 'Preparing images…' : 'Send feedback'}
            </button>
          </form>
        )}
      </dialog>
    </div>
  );
}

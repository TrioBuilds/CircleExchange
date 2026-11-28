import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// jsdom does not implement the dialog top layer. Browser playback covers native focus and Escape.
HTMLDialogElement.prototype.showModal ??= function () {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function () {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};

beforeEach(() => sessionStorage.clear());
afterEach(cleanup);

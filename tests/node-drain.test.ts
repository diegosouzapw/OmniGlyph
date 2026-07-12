import { describe, expect, it } from 'vitest';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { waitForDrain } from '../src/node.js';

// Long SSE responses hit backpressure once per full write buffer; each cycle
// calls waitForDrain on the SAME ServerResponse. Any listener left behind by a
// finished wait accumulates until MaxListenersExceededWarning fires and the
// proxy leaks memory for the lifetime of the connection.
const DRAIN_CYCLES = 25;

function makeResponse(): ServerResponse {
  return new ServerResponse(new IncomingMessage(new Socket()));
}

describe('waitForDrain', () => {
  it('does not accumulate listeners across repeated backpressure cycles', async () => {
    const res = makeResponse();
    const before = {
      drain: res.listenerCount('drain'),
      close: res.listenerCount('close'),
      error: res.listenerCount('error'),
    };

    for (let i = 0; i < DRAIN_CYCLES; i++) {
      const wait = waitForDrain(res);
      res.emit('drain');
      await wait;
    }

    expect(res.listenerCount('drain')).toBe(before.drain);
    expect(res.listenerCount('close')).toBe(before.close);
    expect(res.listenerCount('error')).toBe(before.error);
  });

  it('rejects when the client closes and detaches every listener it added', async () => {
    const res = makeResponse();
    const before = {
      drain: res.listenerCount('drain'),
      close: res.listenerCount('close'),
      error: res.listenerCount('error'),
    };

    const wait = waitForDrain(res);
    res.emit('close');

    await expect(wait).rejects.toThrow('client response closed');
    expect(res.listenerCount('drain')).toBe(before.drain);
    expect(res.listenerCount('close')).toBe(before.close);
    expect(res.listenerCount('error')).toBe(before.error);
  });

  it('rejects with the stream error and detaches every listener it added', async () => {
    const res = makeResponse();
    const before = {
      drain: res.listenerCount('drain'),
      close: res.listenerCount('close'),
      error: res.listenerCount('error'),
    };

    const wait = waitForDrain(res);
    res.emit('error', new Error('boom'));

    await expect(wait).rejects.toThrow('boom');
    expect(res.listenerCount('drain')).toBe(before.drain);
    expect(res.listenerCount('close')).toBe(before.close);
    expect(res.listenerCount('error')).toBe(before.error);
  });
});

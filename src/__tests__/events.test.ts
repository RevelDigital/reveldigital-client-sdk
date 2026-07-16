import { describe, expect, test, vi } from 'vitest';
import { EventType, createPlayerClient } from '../index';

function emit(eventType: EventType, detail?: any): void {
  window.dispatchEvent(new CustomEvent(`RevelDigital.${eventType}`, { detail }));
}

describe('on()', () => {

  test('delivers the event detail to the callback', () => {

    const client = createPlayerClient();
    const onCommand = vi.fn();

    client.on(EventType.COMMAND, onCommand);
    emit(EventType.COMMAND, { name: 'volume', arg: '11' });

    expect(onCommand).toHaveBeenCalledWith({ name: 'volume', arg: '11' });
  });

  test('supports multiple listeners on the same event type', () => {

    const client = createPlayerClient();
    const first = vi.fn();
    const second = vi.fn();

    client.on(EventType.START, first);
    client.on(EventType.START, second);
    emit(EventType.START);

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  test('registering the same callback twice is a no-op, matching addEventListener', () => {

    const client = createPlayerClient();
    const onStart = vi.fn();

    client.on(EventType.START, onStart);
    client.on(EventType.START, onStart);
    emit(EventType.START);

    expect(onStart).toHaveBeenCalledOnce();
  });
});

describe('off()', () => {

  test('removes only the listener passed to it', () => {

    // Regression: off() took no callback, so unsubscribing one handler tore down every
    // handler for the event type — silently breaking any other subscriber.
    const client = createPlayerClient();
    const first = vi.fn();
    const second = vi.fn();

    client.on(EventType.START, first);
    client.on(EventType.START, second);
    client.off(EventType.START, first);
    emit(EventType.START);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  test('removes every listener for the event type when no callback is given', () => {

    const client = createPlayerClient();
    const first = vi.fn();
    const second = vi.fn();

    client.on(EventType.START, first);
    client.on(EventType.START, second);
    client.off(EventType.START);
    emit(EventType.START);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  test('the first registered listener is removable', () => {

    // Regression: the handler registry was keyed only by event type, so a second on()
    // overwrote the first entry and left the first listener attached to window with no
    // reference left to remove it.
    const client = createPlayerClient();
    const first = vi.fn();
    const second = vi.fn();

    client.on(EventType.START, first);
    client.on(EventType.START, second);
    client.off(EventType.START, second);
    client.off(EventType.START, first);
    emit(EventType.START);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  test('leaves other event types untouched', () => {

    const client = createPlayerClient();
    const onStart = vi.fn();
    const onStop = vi.fn();

    client.on(EventType.START, onStart);
    client.on(EventType.STOP, onStop);
    client.off(EventType.START);
    emit(EventType.STOP);

    expect(onStop).toHaveBeenCalledOnce();
  });

  test('is safe to call for an event type with no listeners', () => {

    const client = createPlayerClient();

    expect(() => client.off(EventType.START)).not.toThrow();
    expect(() => client.off(EventType.START, vi.fn())).not.toThrow();
  });

  test('removing an unregistered callback leaves existing listeners intact', () => {

    const client = createPlayerClient();
    const registered = vi.fn();

    client.on(EventType.START, registered);
    client.off(EventType.START, vi.fn());
    emit(EventType.START);

    expect(registered).toHaveBeenCalledOnce();
  });
});

describe('EventType', () => {

  test('is a real enum object at runtime', () => {

    // Regression: declared as an ambient const enum, which erased at compile time and
    // broke isolatedModules consumers such as Vite.
    expect(EventType.START).toBe('Start');
    expect(EventType.STOP).toBe('Stop');
    expect(EventType.COMMAND).toBe('Command');
    expect(EventType.CONFIG).toBe('Config');
    expect(EventType.POSTMESSAGE).toBe('PostMessage');
  });
});

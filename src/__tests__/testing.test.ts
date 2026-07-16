import { afterEach, describe, expect, test, vi } from 'vitest';
import { EventType, createPlayerClient } from '../index';
import { IMockPlayer, createMockPlayer } from '../testing';

let player: IMockPlayer | undefined;

function mockPlayer(...args: Parameters<typeof createMockPlayer>): IMockPlayer {
  player = createMockPlayer(...args);
  return player;
}

afterEach(() => {
  player?.dispose();
  player = undefined;
});

describe('lifecycle events', () => {

  test('emit() drives the same path the player triggers', () => {

    const player = mockPlayer();
    const client = createPlayerClient();
    const onStop = vi.fn();
    const onStart = vi.fn();

    client.on(EventType.STOP, onStop);
    client.on(EventType.START, onStart);

    player.emit(EventType.STOP);
    player.emit(EventType.START);

    expect(onStop).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledOnce();
  });

  test('emit() delivers command name and arg', () => {

    const player = mockPlayer();
    const client = createPlayerClient();
    const onCommand = vi.fn();

    client.on(EventType.COMMAND, onCommand);
    player.emit(EventType.COMMAND, { name: 'volume', arg: '11' });

    expect(onCommand).toHaveBeenCalledWith({ name: 'volume', arg: '11' });
  });

  test('emit() works when legacy event handling is disabled', () => {

    const player = mockPlayer();
    const client = createPlayerClient({ useLegacyEventHandling: false });
    const onStop = vi.fn();

    client.on(EventType.STOP, onStop);
    player.emit(EventType.STOP);

    expect(onStop).toHaveBeenCalledOnce();
  });

  test('emit() reaches listeners registered before the mock player was created', () => {

    const client = createPlayerClient();
    const onStart = vi.fn();
    client.on(EventType.START, onStart);

    mockPlayer().emit(EventType.START);

    expect(onStart).toHaveBeenCalledOnce();
  });
});

describe('preferences', () => {

  test('getPrefs() reads the seeded values', () => {

    mockPlayer({ prefs: { rotationSeconds: 2, kenBurns: false, language: 'de' } });
    const prefs = createPlayerClient().getPrefs();

    expect(prefs.getInt('rotationSeconds')).toBe(2);
    expect(prefs.getBoolOrNull('kenBurns')).toBe(false);
    expect(prefs.getString('language')).toBe('de');
  });

  test('prefs can be rewritten mid-test', () => {

    const player = mockPlayer({ prefs: { language: 'en' } });
    const client = createPlayerClient();

    player.prefs.set('language', 'fr');

    expect(client.getPrefs().getString('language')).toBe('fr');
  });

  test('unseeded preferences read as unset', () => {

    mockPlayer();
    const prefs = createPlayerClient().getPrefs();

    expect(prefs.has('language')).toBe(false);
    expect(prefs.getStringOrNull('language')).toBeNull();
  });
});

describe('device and layout accessors', () => {

  test('reports the configured width, height, and duration', async () => {

    mockPlayer({ width: 1920, height: 1080, duration: 15000 });
    const client = createPlayerClient();

    expect(await client.getWidth()).toBe(1920);
    expect(await client.getHeight()).toBe(1080);
    expect(await client.getDuration()).toBe(15000);
  });

  test('defaults to null, matching a gadget running with no player', async () => {

    mockPlayer();
    const client = createPlayerClient();

    expect(await client.getWidth()).toBeNull();
    expect(await client.getHeight()).toBeNull();
    expect(await client.getDevice()).toBeNull();
    expect(await client.getDeviceKey()).toBeNull();
  });

  test('device details round-trip through the normal mapping', async () => {

    const enteredService = new Date('2024-01-15T00:00:00.000Z');

    mockPlayer({
      device: {
        name: 'Lobby Display',
        registrationKey: 'abc123',
        deviceType: 'BrightSign',
        enteredService,
        langCode: 'en',
        timeZone: 'America/New_York',
        tags: ['lobby', 'ground-floor'],
        location: { city: 'Seattle', state: 'WA', country: 'US', postalCode: '98101' }
      }
    });
    const client = createPlayerClient();
    const device = await client.getDevice();

    expect(device?.name).toBe('Lobby Display');
    expect(device?.registrationKey).toBe('abc123');
    expect(device?.deviceType).toBe('BrightSign');
    expect(device?.enteredService).toEqual(enteredService);
    expect(device?.tags).toEqual(['lobby', 'ground-floor']);
    expect(device?.location?.city).toBe('Seattle');
    expect(device?.location?.postalCode).toBe('98101');

    expect(await client.getDeviceKey()).toBe('abc123');
    expect(await client.getLanguageCode()).toBe('en');
    expect(await client.getDeviceTimeZoneName()).toBe('America/New_York');
  });

  test('getCommandMap() reports the configured commands', async () => {

    mockPlayer({ commandMap: { volume: '11' } });

    expect(await createPlayerClient().getCommandMap()).toEqual({ volume: '11' });
  });
});

describe('recording', () => {

  test('records commands, remote commands, and callbacks', async () => {

    const player = mockPlayer();
    const client = createPlayerClient();

    client.sendCommand('volume', '11');
    client.sendRemoteCommand(['dev1', 'dev2'], 'reboot', 'now');
    client.callback('test');

    // The client dispatches these through a promise, so let it settle.
    await vi.waitFor(() => expect(player.commands).toHaveLength(1));

    expect(player.commands[0]).toEqual({ name: 'volume', arg: '11' });
    expect(player.remoteCommands[0]).toEqual({ deviceKeys: ['dev1', 'dev2'], name: 'reboot', arg: 'now' });
    expect(player.callbacks[0]).toEqual(['test']);
  });

  test('records tracked events and their properties', async () => {

    const player = mockPlayer();
    const client = createPlayerClient();

    client.timeEvent('slideShown');
    client.track('slideShown', { slide: 3 });

    await vi.waitFor(() => expect(player.trackedEvents).toHaveLength(1));

    expect(player.timedEvents).toEqual(['slideShown']);
    expect(player.trackedEvents[0]).toEqual({ name: 'slideShown', properties: { slide: 3 } });
  });

  test('records finish()', async () => {

    const player = mockPlayer();
    const client = createPlayerClient();

    client.finish();

    await vi.waitFor(() => expect(player.finishCount).toBe(1));
  });
});

describe('dispose()', () => {

  test('removes the globals it installed', () => {

    expect((window as any).Client).toBeUndefined();
    expect((window as any).gadgets).toBeUndefined();

    createMockPlayer().dispose();

    expect((window as any).Client).toBeUndefined();
    expect((window as any).gadgets).toBeUndefined();
  });

  test('restores globals that were already present', () => {

    const existingClient = { existing: true };
    const existingGadgets = { existing: true };
    (window as any).Client = existingClient;
    (window as any).gadgets = existingGadgets;

    createMockPlayer().dispose();

    expect((window as any).Client).toBe(existingClient);
    expect((window as any).gadgets).toBe(existingGadgets);

    delete (window as any).Client;
    delete (window as any).gadgets;
  });

  test('a disposed player leaves getPrefs() on its no-player fallback', () => {

    createMockPlayer({ prefs: { language: 'de' } }).dispose();

    expect(createPlayerClient().getPrefs().getStringOrNull('language')).toBeNull();
  });
});

describe('isPreviewMode()', () => {

  test('is false with a mock player attached', async () => {

    mockPlayer();

    expect(await createPlayerClient().isPreviewMode()).toBe(false);
  });
});

import { EventType } from './enums/event-types';
import { IClient } from './interfaces/client.interface';
import { IDictionary } from './interfaces/config.interface';
import { IDevice } from './interfaces/device.interface';
import { IMockPrefsOptions, MockPrefs, PrefValues } from './prefs';
import { version } from './version';

export { MockPrefs } from './prefs';
export type { IMockPrefsOptions, PrefValues } from './prefs';

/**
 * Options for {@link createMockPlayer}.
 *
 * Every field is optional. Anything left unset behaves as it does with no player
 * attached: preferences read as unset, and device accessors resolve to null.
 */
export interface IMockPlayerOptions extends IMockPrefsOptions {

  /** Preference values the gadget will read via `client.getPrefs()`. */
  prefs?: PrefValues;

  /** Value returned by `client.getWidth()`. Defaults to null. */
  width?: number;

  /** Value returned by `client.getHeight()`. Defaults to null. */
  height?: number;

  /** Value returned by `client.getDuration()`, in milliseconds. Defaults to null. */
  duration?: number;

  /**
   * Device details returned by `client.getDevice()`.
   *
   * Also backs `getDeviceKey()`, `getLanguageCode()`, and `getDeviceTimeZoneName()`
   * unless those are overridden below.
   */
  device?: Partial<IDevice>;

  /** Value returned by `client.getDeviceTimeZoneID()`. Defaults to null. */
  timeZoneID?: string;

  /** Value returned by `client.getDeviceTimeZoneOffset()`. Defaults to null. */
  timeZoneOffset?: number;

  /** Value returned by `client.getRevelRoot()`. Defaults to null. */
  revelRoot?: string;

  /** Commands returned by `client.getCommandMap()`. Defaults to an empty map. */
  commandMap?: IDictionary<any>;
}

/**
 * A command recorded by {@link IMockPlayer.commands}.
 */
export interface IRecordedCommand {
  name: string;
  arg: string;
}

/**
 * A remote command recorded by {@link IMockPlayer.remoteCommands}.
 */
export interface IRecordedRemoteCommand extends IRecordedCommand {
  deviceKeys: string[];
}

/**
 * An analytics event recorded by {@link IMockPlayer.trackedEvents}.
 */
export interface IRecordedEvent {
  name: string;
  properties: any;
}

/**
 * A stand-in for a real player, for use in tests and local development.
 *
 * Returned by {@link createMockPlayer}.
 */
export interface IMockPlayer {

  /**
   * Dispatch a player lifecycle event to every listener registered via
   * `PlayerClient.on()`.
   *
   * This drives the same code path the player itself triggers rather than a stub.
   *
   * @example
   * player.emit(EventType.STOP);
   * player.emit(EventType.START);
   * player.emit(EventType.COMMAND, { name: 'volume', arg: '11' });
   *
   * @param eventType the event to dispatch
   * @param detail Optional. Payload delivered to the listener's callback. For
   *               {@link EventType.COMMAND} this is `{ name, arg }`.
   */
  emit(eventType: EventType, detail?: any): void;

  /**
   * The preferences backing `client.getPrefs()`.
   *
   * Writable during a test via `player.prefs.set('key', 'value')`.
   */
  readonly prefs: MockPrefs;

  /** Commands sent via `client.sendCommand()`, in order. */
  readonly commands: IRecordedCommand[];

  /** Commands sent via `client.sendRemoteCommand()`, in order. */
  readonly remoteCommands: IRecordedRemoteCommand[];

  /** Events logged via `client.track()`, in order. */
  readonly trackedEvents: IRecordedEvent[];

  /** Event names passed to `client.timeEvent()`, in order. */
  readonly timedEvents: string[];

  /** Argument lists passed to `client.callback()`, in order. */
  readonly callbacks: any[][];

  /** Number of times `client.finish()` has been called. */
  readonly finishCount: number;

  /**
   * Uninstall the mock player, restoring any globals that were present beforehand.
   *
   * Call this between tests to avoid leaking state.
   */
  dispose(): void;
}

/**
 * Serializes device details into the raw, lower-cased JSON shape the player returns,
 * so that `PlayerClient.getDevice()` parses it through its normal mapping.
 *
 * @ignore
 */
function serializeDevice(device: Partial<IDevice>): string {

  return JSON.stringify({
    name: device.name,
    key: device.registrationKey,
    devicetype: device.deviceType,
    enteredservice: device.enteredService?.toISOString(),
    langcode: device.langCode,
    timezone: device.timeZone,
    description: device.tags?.join('\n'),
    location: device.location === undefined ? undefined : {
      city: device.location.city,
      state: device.location.state,
      country: device.location.country,
      postalcode: device.location.postalCode,
      address: device.location.address,
      latitude: device.location.latitude,
      longitude: device.location.longitude
    }
  });
}

/**
 * Installs a mock player on `window`, letting a gadget run and be tested with no real
 * player attached.
 *
 * This wires up the same globals a real player provides — the Client API and the
 * Gadgets API `Prefs` object — so `PlayerClient` takes its normal code path. Lifecycle
 * events dispatched via {@link IMockPlayer.emit} are delivered through the genuine
 * event path, which makes `START`/`STOP` handling testable without a player.
 *
 * Call this **before** constructing the client, since `PlayerClient` resolves and
 * caches the Client API on first use.
 *
 * @example
 * import { createPlayerClient, EventType } from '@reveldigital/client-sdk';
 * import { createMockPlayer } from '@reveldigital/client-sdk/testing';
 *
 * const player = createMockPlayer({
 *   prefs: { rotationSeconds: 2, kenBurns: false },
 *   width: 1920,
 *   height: 1080
 * });
 * const client = createPlayerClient();
 *
 * client.on(EventType.STOP, () => pause());
 * player.emit(EventType.STOP);
 *
 * expect(await client.getWidth()).toBe(1920);
 * expect(client.getPrefs().getBoolOrNull('kenBurns')).toBe(false);
 *
 * player.dispose();
 *
 * @param options Optional. Values the mock player should report.
 * @returns {IMockPlayer} handle for driving and inspecting the mock player
 */
export function createMockPlayer(options?: IMockPlayerOptions): IMockPlayer {

  const prefs = new MockPrefs(options);

  const commands: IRecordedCommand[] = [];
  const remoteCommands: IRecordedRemoteCommand[] = [];
  const trackedEvents: IRecordedEvent[] = [];
  const timedEvents: string[] = [];
  const callbacks: any[][] = [];
  let finishCount = 0;

  const client: IClient = {

    callback(...args: any[]): void {
      callbacks.push(args);
    },

    sendCommand(name: string, arg: string): void {
      commands.push({ name, arg });
    },

    sendRemoteCommand(deviceKeys: string[], name: string, arg: string): void {
      remoteCommands.push({ deviceKeys, name, arg });
    },

    track(eventName: string, properties?: string): void {
      trackedEvents.push({
        name: eventName,
        properties: properties === undefined ? undefined : JSON.parse(properties)
      });
    },

    timeEvent(eventName: string): void {
      timedEvents.push(eventName);
    },

    newEventSession(id?: string): void {
      // Sessions have no observable effect on a mock player.
    },

    finish(): void {
      finishCount++;
    },

    applyConfig(values: IDictionary<any>): void {
      for (const [key, value] of Object.entries(values)) {
        prefs.set(key, value);
      }
    },

    getDeviceTime(date?: Date): Promise<string | null> {
      return Promise.resolve((date ?? new Date()).toISOString());
    },

    getDeviceTimeZoneName(): Promise<string | null> {
      return Promise.resolve(options?.device?.timeZone ?? null);
    },

    getDeviceTimeZoneID(): Promise<string | null> {
      return Promise.resolve(options?.timeZoneID ?? null);
    },

    getDeviceTimeZoneOffset(): Promise<number | null> {
      return Promise.resolve(options?.timeZoneOffset ?? null);
    },

    getLanguageCode(): Promise<string | null> {
      return Promise.resolve(options?.device?.langCode ?? null);
    },

    getDeviceKey(): Promise<string | null> {
      return Promise.resolve(options?.device?.registrationKey ?? null);
    },

    getDevice(): Promise<string | null> {
      return Promise.resolve(
        options?.device === undefined ? null : serializeDevice(options.device)
      );
    },

    getRevelRoot(): Promise<string | null> {
      return Promise.resolve(options?.revelRoot ?? null);
    },

    getCommandMap(): Promise<string | null> {
      return Promise.resolve(JSON.stringify(options?.commandMap ?? {}));
    },

    getWidth(): Promise<number | null> {
      return Promise.resolve(options?.width ?? null);
    },

    getHeight(): Promise<number | null> {
      return Promise.resolve(options?.height ?? null);
    },

    getDuration(): Promise<number | null> {
      return Promise.resolve(options?.duration ?? null);
    },

    getSdkVersion(): Promise<string | null> {
      return Promise.resolve(version);
    }
  };

  const globals = window as any;

  const hadClient = 'Client' in globals;
  const hadGadgets = 'gadgets' in globals;
  const previousClient = globals.Client;
  const previousGadgets = globals.gadgets;

  globals.Client = client;

  // Expose the shared prefs through the Gadgets API global, the same place the player
  // publishes it, so getPrefs() resolves it without any special casing.
  globals.gadgets = {
    ...previousGadgets,
    Prefs: function MockPrefsCtor() {
      return prefs;
    }
  };

  return {

    prefs,
    commands,
    remoteCommands,
    trackedEvents,
    timedEvents,
    callbacks,

    get finishCount(): number {
      return finishCount;
    },

    emit(eventType: EventType, detail?: any): void {

      // Prefer the controller the player itself calls, so the event travels the real
      // path end to end. It is absent only when the client opted out of legacy event
      // handling, in which case dispatch directly.
      const controller = globals.RevelDigital?.Controller;

      if (controller !== undefined) {
        switch (eventType) {
          case EventType.START:
            controller.onStart();
            return;
          case EventType.STOP:
            controller.onStop();
            return;
          case EventType.COMMAND:
            controller.onCommand(detail?.name, detail?.arg);
            return;
        }
      }

      window.dispatchEvent(new CustomEvent(`RevelDigital.${eventType}`, { detail }));
    },

    dispose(): void {

      if (hadClient) {
        globals.Client = previousClient;
      } else {
        delete globals.Client;
      }

      if (hadGadgets) {
        globals.gadgets = previousGadgets;
      } else {
        delete globals.gadgets;
      }
    }
  };
}

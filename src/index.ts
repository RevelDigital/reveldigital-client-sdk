import { EventType } from './enums/event-types';
import { IPrefs, MockPrefs, PrefsWrapper } from './prefs';
import { IClient } from './interfaces/client.interface';
import { IDictionary } from './interfaces/config.interface';
import { IDataTableOptions } from './interfaces/datatable.interface';
import { IEventProperties } from './interfaces/event-properties.interface';
import { IOptions } from './interfaces/options.interface';
import { IDevice } from './interfaces/device.interface';
import { DataTableRef, DataTablePrefRef } from './datatable-ref';
import { version } from './version';

// Re-export all public types
export { EventType } from './enums/event-types';
export { DataTableRef, DataTablePrefRef } from './datatable-ref';
export type { ICommand } from './interfaces/command.interface';
export { ConfigType } from './interfaces/config.interface';
export type { IConfig, IDictionary } from './interfaces/config.interface';
export type {
  DataTableFilterOp,
  DataTableFilterValue,
  DataTableColumnType,
  IDataTableFilterOperator,
  IDataTableFilter,
  IDataTableOptions,
  IDataTableQueryParams,
  IDataTableRow,
  IDataTableResult,
  IDataTableColumn,
  IDataTableSchema,
  IDataTableChangeEvent,
  IDataTablePrefFilterRule,
  IDataTablePref
} from './interfaces/datatable.interface';
export type { IDevice } from './interfaces/device.interface';
export type { IEventProperties } from './interfaces/event-properties.interface';
export type { ILocation } from './interfaces/location.interface';
export type { IOptions } from './interfaces/options.interface';
export type { IPrefs, PrefValues } from './prefs';

// Re-exported so consumers can name the Gadgets API types returned by this SDK without
// taking a direct dependency on @reveldigital/gadget-types.
export type { gadgets } from '@reveldigital/gadget-types';


/** @ignore */
declare global {
  var Client: IClient;
}

export function createPlayerClient(options?: IOptions): PlayerClient {
  return new PlayerClient(options);
}

export class PlayerClient {

  /** @ignore */
  private clientPromise: Promise<IClient> | null | undefined;

  private handlerFn = function (callback: (data: any) => void): EventListenerOrEventListenerObject {
    return function actualHandler(e: Event) {
      callback((<CustomEvent>e).detail);
    }
  }
  /**
   * Registered listeners, keyed by event type and then by the caller's callback, so a
   * single callback can be removed without disturbing others on the same event type.
   *
   * @ignore
   */
  private handlers = new Map<string, Map<(data: any) => void, EventListenerOrEventListenerObject>>();

  /** @ignore */
  private mockPrefs: MockPrefs | undefined;


  constructor(options?: IOptions) {

    /**
     * Legacy method for trapping events from the player side.
     */
    if (options?.useLegacyEventHandling !== false) {
      (window as any).RevelDigital = {
        Controller: {
          onCommand: function (name: string, arg: string) {
            window.dispatchEvent(new CustomEvent(`RevelDigital.${EventType.COMMAND}`, { detail: { name, arg } }));
          },
          onStart: function () {
            window.dispatchEvent(new CustomEvent(`RevelDigital.${EventType.START}`));
          },
          onStop: function () {
            window.dispatchEvent(new CustomEvent(`RevelDigital.${EventType.STOP}`));
          }
        }
      }
    }

    // Listen for postMessage events from the player
    window.addEventListener('message', (messageEvent: MessageEvent) => {
      if (typeof messageEvent.data !== 'string') return;

      try {
        const parsed = JSON.parse(messageEvent.data);

        if (parsed.type === 'applyConfig' && parsed.isOpener) {
          parsed.isOpener = false;
          window.parent.postMessage(JSON.stringify(parsed), '*');
        } else if (parsed.type === 'openConfig') {
          window.dispatchEvent(new CustomEvent(`RevelDigital.${EventType.CONFIG}`));
        }

        window.dispatchEvent(new CustomEvent(`RevelDigital.${EventType.POSTMESSAGE}`, { detail: parsed }));
      } catch {
        // Ignore non-JSON messages
      }
    });
  }

  /**
   * Add an event listener for the specified player event.
   *
   * Multiple listeners may be registered for the same event type. Registering the same
   * callback twice for the same event type is a no-op, matching `addEventListener`.
   *
   * This method works with or without a player attached — events are delivered over
   * `window`, so {@link createMockPlayer} can drive the real event path in a test.
   *
   * @param {EventType} eventType type of event to listen for
   * @param callback function to call when the event is triggered
   */
  public on(eventType: EventType, callback: (data: any) => void): void {

    let listeners = this.handlers.get(eventType);

    if (listeners === undefined) {
      listeners = new Map<(data: any) => void, EventListenerOrEventListenerObject>();
      this.handlers.set(eventType, listeners);
    }

    if (listeners.has(callback)) {
      return;
    }

    const listener = this.handlerFn(callback);
    listeners.set(callback, listener);

    window.addEventListener(`RevelDigital.${eventType}`, listener);
  }

  /**
   * Remove an event listener for the specified player event.
   *
   * @example
   * client.off(EventType.START, onStart);   // remove a single listener
   * client.off(EventType.START);            // remove every listener for the event
   *
   * @param {EventType} eventType type of event to stop listening for
   * @param callback Optional. The callback to remove, as passed to {@link PlayerClient.on}.
   *                 If omitted, all listeners for this event type are removed.
   */
  public off(eventType: EventType, callback?: (data: any) => void): void {

    const listeners = this.handlers.get(eventType);

    if (listeners === undefined) {
      return;
    }

    if (callback !== undefined) {

      const listener = listeners.get(callback);

      if (listener === undefined) {
        return;
      }

      window.removeEventListener(`RevelDigital.${eventType}`, listener);
      listeners.delete(callback);

      if (listeners.size === 0) {
        this.handlers.delete(eventType);
      }
      return;
    }

    for (const listener of listeners.values()) {
      window.removeEventListener(`RevelDigital.${eventType}`, listener);
    }
    this.handlers.delete(eventType);
  }

  /**
   * This method allows the gadget to communicate with player scripting.
   * If the appropriate scripting is in place in the currently running template, calling this method
   * will initiate a callback which can be acted upon in player script.
   * 
   * @example
   * client.callback('test', 'this');
   * 
   * @param args variable number of arguments
   */
  public callback(...args: any[]): void {

    this.getClient().then((client) => {

      switch (args.length) {
        case 0:
          client.callback();
          break;
        case 1:
          client.callback(args[0]);
          break;
        case 2:
          client.callback(args[1]);
          break;
        case 3:
          client.callback(args[2]);
          break;
        case 4:
          client.callback(args[3]);
          break;
        case 5:
          client.callback(args[4]);
          break;
      }
    })
  }

  /**
   * Accessor method for the user preferences interface exposed by the Gadgets API.
   *
   * See {@link https://developers.google.com/gadgets/docs/basic} for more details on the Gadgets API.
   *
   * When no player is attached — a local dev server, CMS preview, or a test — this falls
   * back to an in-memory {@link MockPrefs}, matching the mock fallback used by the rest of
   * the Client API. Unset preferences then read as `''`, `false`, `0`, or `[]`. This method
   * never throws and never returns undefined.
   *
   * The returned object extends the Gadgets API `Prefs` surface with {@link IPrefs.has}
   * and nullable getters, which distinguish an unset preference from one deliberately
   * set to a falsy value.
   *
   * @example
   * const prefs = client.getPrefs();
   * const myString = prefs.getString('myStringPref');
   *
   * // Honor a gadget.yaml `default_value: true` without mistaking a designer's
   * // deliberate false for an unset preference.
   * const kenBurns = prefs.getBoolOrNull('kenBurns') ?? true;
   *
   * @returns {IPrefs} Gadget API Prefs object, extended with existence-aware accessors
   */
  public getPrefs(): IPrefs {

    const prefsCtor = (window as any)?.gadgets?.Prefs;

    if (typeof prefsCtor === 'function') {
      return new PrefsWrapper(new prefsCtor());
    }

    // Cached so that values written via set() survive across calls, as they would in
    // the player, and so the fallback is announced only once.
    if (this.mockPrefs === undefined) {

      console.log(
        '%cGadgets API not available, falling back to mock prefs',
        'background-color:blue; color:yellow;'
      );
      this.mockPrefs = new MockPrefs();
    }

    return new PrefsWrapper(this.mockPrefs);
  }

  /**
   * Returns the current device time in ISO8601 format.
   * Current device time is determined by the device timezone assigned to the device in the CMS.
   * 
   * @param date Optional. If supplied will translate the supplied date/time to device time based on respective timezones.
   * @returns Date/time in ISO8601 format
   */
  public async getDeviceTime(date?: Date): Promise<string | null> {

    const client = await this.getClient();

    if (date !== undefined) {
      return client.getDeviceTime(date);
    }
    return client.getDeviceTime();
  }

  /**
   * Returns the timezone name currently assigned to the device.
   * 
   * @returns Timezone Name
   */
  public async getDeviceTimeZoneName(): Promise<string | null> {

    const client = await this.getClient();

    return client.getDeviceTimeZoneName();
  }

  /**
   * Returns the timezone ID currently assigned to the device.
   * 
   * @returns Timezone ID
   */
  public async getDeviceTimeZoneID(): Promise<string | null> {

    const client = await this.getClient();

    return client.getDeviceTimeZoneID();
  }

  /**
   * Returns the numerical offset from GMT of the timezone currently assigned to the device.
   * 
   * @returns Timezone offset
   */
  public async getDeviceTimeZoneOffset(): Promise<number | null> {

    const client = await this.getClient();

    return client.getDeviceTimeZoneOffset();
  }

  /**
   * Returns the language code of the language currently assigned to the device.
   * 
   * @returns Language code
   */
  public async getLanguageCode(): Promise<string | null> {

    const client = await this.getClient();

    return client.getLanguageCode();
  }

  /**
   * Returns the unique Revel Digital device key associated with the device.
   * 
   * @returns Device key
   */
  public async getDeviceKey(): Promise<string | null> {

    const client = await this.getClient();

    return client.getDeviceKey();
  }

  /**
   * Send a command to the player device.
   * 
   * @param name Command name
   * @param arg Command argument
   */
  public sendCommand(name: string, arg: string): void {

    this.getClient().then((client) => {
      client.sendCommand(name, arg);
    })
  }

  /**
   * Send a command to any remote player with the supplied device key(s).
   * Note: Remote commands can only be delivered to devices within the same account as the sender device.
   * 
   * @param deviceKeys Array of remote device keys
   * @param name Command name
   * @param arg Command arg
   */
  public sendRemoteCommand(deviceKeys: string[], name: string, arg: string): void {

    this.getClient().then((client) => {
      client.sendRemoteCommand(deviceKeys, name, arg);
    });
  }

  /**
   * Log an event for use with AdHawk analytics.
   * Events are used for tracking various metrics including usage statistics, player condition, state changes, etc.
   * 
   * @param eventName Unique name for this event
   * @param {IEventProperties} properties A map of user defined properties to associate with this event
   */
  public track(eventName: string, properties?: IEventProperties): void {

    this.getClient().then((client) => {
      client.track(eventName, JSON.stringify(properties));
    })
  }

  /**
   * Method for initiating a timed event.
   * Timed events are useful for tracking the duration of an event and must be proceeded with a call to track().
   * 
   * @example
   * client.timeEvent('testEvent');
   * client.track("test", { "a": "b" });
   * @param eventName Unique name for this event
   */
  public timeEvent(eventName: string): void {

    this.getClient().then((client) => {
      client.timeEvent(eventName);
    })
  }

  /**
   * A session is a way of grouping events together. Each event has an associated session ID.
   * Session ID's are randomly generated and reset by subsequent calls to newEventSession().
   * 
   * Each call to track() will utilize the same session ID, until another call to newEventSession().
   * @param id Optional. User supplied session ID. If not supplied a random session ID will be generated.
   */
  public newEventSession(id?: string): void {

    this.getClient().then((client) => {
      if (id !== undefined) {
        client.newEventSession();
      } else {
        client.newEventSession(id);
      }
    })
  }

  /**
   * Returns the root folder utilized by this player device.
   * 
   * @returns Path to the root folder
   */
  public async getRevelRoot(): Promise<string | null> {

    const client = await this.getClient();

    return client.getRevelRoot();
  }

  /**
   * Returns a map of commands currently active for this device.
   * 
   * @returns Map of commands currently active for this device.
   */
  public async getCommandMap(): Promise<string | null> {

    const client = await this.getClient();

    return JSON.parse(<string>await client.getCommandMap());
  }

  /**
   * Indicate to the player that this app has finished it's visualization.
   * This allows the player to proceed with the next item in a playlist if applicable.
   */
  public finish(): void {

    this.getClient().then((client) => {

      client.finish();
    })
  }

  /**
   * Check is the gadget is running in preview mode. Preview mode is enabled when the gadget is
   * being edited in the CMS, or otherwise not running in a normal player environment.
   * 
   * @returns True if the gadget is running in preview mode, false otherwise.
   */
  public async isPreviewMode(): Promise<boolean> {

    const client = await this.getClient();

    return client instanceof NoopClient;
  }

  /**
   * Returns the device details associated with the player running the gadget or web app.
   * 
   * @returns Device details.
   */
  public async getDevice(): Promise<IDevice | null> {

    const client = await this.getClient();

    let deviceJson = await client.getDevice();
    if (deviceJson == null) {
      return null;
    }
    let obj: any = JSON.parse(deviceJson);
    if (obj == null) {
      return null;
    }

    const device: IDevice[] = [obj].map((device: any) => {

      return {
        name: device.name,
        registrationKey: device.key,
        deviceType: device.devicetype,
        enteredService: new Date(device.enteredservice),
        langCode: device.langcode,
        timeZone: device.timezone,
        tags: device.description?.split('\n'),
        location: {
          city: device.location?.city,
          state: device.location?.state,
          country: device.location?.country,
          postalCode: device.location?.postalcode,
          address: device.location?.address,
          latitude: device.location?.latitude,
          longitude: device.location?.longitude
        }
      }
    });
    return device[0];
  }

  /**
   * Returns the width of the visualization area.
   * 
   * @returns Width of the visualization area
   */
  public async getWidth(): Promise<number | null> {

    const client = await this.getClient();

    return client.getWidth();
  }

  /**
   * Returns the height of the visualization area.
   * 
   * @returns Height of the visualization area
   */
  public async getHeight(): Promise<number | null> {

    const client = await this.getClient();

    return client.getHeight();
  }

  /**
   * Returns the duration of the currently playing source.
   * (only applicable when associated with a playlist)
   * 
   * @returns Duration of the current item in milliseconds
   */
  public async getDuration(): Promise<number | null> {

    const client = await this.getClient();

    return client.getDuration();
  }

  /**
   * Returns the current SDK version.
   *
   * @returns SDK version
   */
  public async getSdkVersion(): Promise<string> {

    return Promise.resolve(version);
  }

  /**
   * Applies configuration preferences to the gadget (preview mode only).
   *
   * This method is only available when running in preview mode (typically during
   * gadget development or testing in the CMS).
   *
   * @param prefs - Dictionary of preference key-value pairs to apply
   */
  public async applyConfig(prefs: IDictionary<any>): Promise<void> {

    if (await this.isPreviewMode()) {
      const client = await this.getClient();
      client.applyConfig(prefs);
    } else {
      console.log(
        '%capplyConfig() is only available in preview mode.',
        'background-color:blue; color:yellow;'
      );
    }
  }

  /**
   * Creates a typed wrapper for a Revel Digital data table.
   *
   * The data table feature must be enabled for the gadget. The returned
   * {@link DataTableRef} provides typed Promise-based methods and callback-based
   * event handling for real-time row change events.
   *
   * @param tableId - The data table ID (e.g. 'tbl_menu_items')
   * @param options - Optional configuration overrides
   * @returns A {@link DataTableRef} instance
   * @throws Error if the global datatable library is not loaded
   *
   * @example
   * const dt = client.createDataTable('tbl_menu_items');
   *
   * // Fetch rows with filtering and sorting
   * const result = await dt.getRows({
   *   filter: { category: 'Entree', price: { op: 'lte', value: 25 } },
   *   sort: 'price',
   *   sortDir: 'asc'
   * });
   *
   * // Subscribe to real-time updates
   * dt.on('rowUpdated', (change) => console.log('Row updated:', change));
   * dt.on('rowCreated', (change) => console.log('Row created:', change));
   * dt.on('rowDeleted', (change) => console.log('Row deleted:', change));
   *
   * // Cleanup when done
   * dt.dispose();
   */
  public createDataTable(tableId: string, options?: IDataTableOptions): DataTableRef {
    return new DataTableRef(tableId, options);
  }

  /**
   * Creates a typed data table wrapper from a gadget preference value.
   *
   * The preference JSON string (as serialized by the template editor's datatable
   * option) is parsed and used to auto-configure filter, sort, and logic settings.
   * The returned {@link DataTablePrefRef} provides a `getFilteredRows()` convenience
   * method that applies these settings automatically.
   *
   * @param prefValue - The raw gadget preference string (JSON)
   * @param options - Optional configuration overrides
   * @returns A {@link DataTablePrefRef} instance
   * @throws Error if the global datatable library is not loaded
   *
   * @example
   * const cfg = client.createDataTableFromPref(prefs.getString('rdDataTable'));
   *
   * // Fetch rows with auto-wired filter + sort
   * const result = await cfg.getFilteredRows();
   *
   * // Access the underlying DataTableRef for events, schema, etc.
   * cfg.dataTable.on('rowUpdated', (change) => console.log(change));
   *
   * // Cleanup when done
   * cfg.dispose();
   */
  public createDataTableFromPref(prefValue: string, options?: IDataTableOptions): DataTablePrefRef {
    return new DataTablePrefRef(prefValue, options);
  }


  // ---
  // PRIVATE METHODS.
  // ---
  /** @ignore */
  private getClient(): Promise<IClient> {

    if (this.clientPromise) {

      return (this.clientPromise);
    }

    if (window.Client) {

      return (this.clientPromise = Promise.resolve(window.Client));
    }

    // A "complete" status indicates that the "load" event has been fired on the
    // window; and, that all sub-resources such as Scripts, Images, and Frames have
    // been loaded.
    if (window.document.readyState === "complete") {

      // If this event has fired AND the 3rd-party script isn't available (see IF-
      // condition BEFORE this one), it means that the 3rd-party script either
      // failed on the network or was BLOCKED by an ad-blocker. As such, we have to
      // fall-back to using a mock API.
      return (this.clientPromise = Promise.resolve(new NoopClient()));
    }

    // ASSERT: If we made it this far, the document has not completed loading (but it
    // may be in an "interactive" state which is when I believe that the Angular app
    // gets bootstrapped). As such, we need bind to the LOAD event to wait for our
    // third-party scripts to load (or fail to load, or be blocked).
    this.clientPromise = new Promise<IClient>(
      (resolve) => {

        window.addEventListener(
          "load",
          function handleWindowLoad() {

            // At this point, the 3rd-party library is either available or
            // it's not - there's no further loading to do. If it's not
            // present on the global scope, we're going to fall-back to using
            // a mock API.
            resolve(window.Client || new NoopClient());
          }
        );

      }
    );

    return (this.clientPromise);
  }
}


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

// I provide a mock API for the 3rd-party script. This just allows the consuming code to
// act as though the library is available even if it failed to load (example, it was
// blocked by an ad-blocker).

/** @ignore */
class NoopClient implements IClient {

  constructor() {

    console.log(
      '%cClient API not available, falling back to mock API',
      'background-color:blue; color:yellow;'
    );
  }

  public applyConfig(prefs: IDictionary<any>): void {

    const evt = { type: 'applyConfig', prefs: prefs, isOpener: window.opener !== null };

    if (window.opener) {
      window.opener.postMessage(
        JSON.stringify(evt),
        '*'
      );
    } else {
      window.parent.postMessage(
        JSON.stringify(evt),
        '*'
      );
    }
  }

  public callback(...args: any[]): void {

    // NOOP implement, nothing to do....
  }

  public getDeviceTime(date?: Date): Promise<string | null> {

    return Promise.resolve(new Date().toISOString());
  }

  public async getDeviceTimeZoneName(): Promise<string | null> {

    return Promise.resolve(null);
  }

  public async getDeviceTimeZoneID(): Promise<string | null> {

    return Promise.resolve(null);
  }

  public async getDeviceTimeZoneOffset(): Promise<number | null> {

    return Promise.resolve(null);
  }

  public async getLanguageCode(): Promise<string | null> {

    return Promise.resolve(null);
  }

  public async getDeviceKey(): Promise<string | null> {

    return Promise.resolve(null);
  }

  public sendCommand(name: string, arg: string): void {

    // NOOP implement, nothing to do....
  }

  public sendRemoteCommand(deviceKeys: string[], name: string, arg: string) {

    // NOOP implement, nothing to do....
  }

  public track(eventName: string, properties?: string): void {

    // NOOP implement, nothing to do....
  }

  public timeEvent(eventName: string): void {

    // NOOP implement, nothing to do....
  }

  public newEventSession(id?: string): void {

    // NOOP implement, nothing to do....
  }

  public async getRevelRoot(): Promise<string | null> {

    return Promise.resolve(null);
  }

  public async getCommandMap(): Promise<string | null> {

    return Promise.resolve('{}');
  }

  public finish(): void {

    // NOOP implement, nothing to do....
  }

  public async getDevice(): Promise<any | null> {

    return Promise.resolve(null);
  }

  public async getWidth(): Promise<number | null> {

    return Promise.resolve(null);
  }

  public async getHeight(): Promise<number | null> {

    return Promise.resolve(null);
  }

  public async getDuration(): Promise<number | null> {

    return Promise.resolve(null);
  }

  public async getSdkVersion(): Promise<string> {

    return Promise.resolve(version);
  }
}

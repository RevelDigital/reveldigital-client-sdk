import { decode } from 'html-entities';
import {
  IDataTableChangeEvent,
  IDataTableColumn,
  IDataTableOptions,
  IDataTablePref,
  IDataTableQueryParams,
  IDataTableResult,
  IDataTableSchema
} from './interfaces/datatable.interface';

type DataTableEventType = 'rowUpdated' | 'rowCreated' | 'rowDeleted';
type DataTableEventCallback = (event: IDataTableChangeEvent) => void;

/**
 * Framework-agnostic wrapper around the global `gadgets.reveldigital.datatable` library.
 *
 * Provides typed Promise-based methods and callback-based event handling for real-time updates.
 *
 * ```typescript
 * const dt = client.createDataTable('tbl_menu_items');
 *
 * // Fetch rows
 * const result = await dt.getRows({ sort: 'price', sortDir: 'asc' });
 *
 * // Real-time updates
 * dt.on('rowUpdated', (change) => console.log('Updated:', change));
 *
 * // Cleanup
 * dt.dispose();
 * ```
 */
export class DataTableRef {

  /** @ignore */
  private _instance: any;
  /** @ignore */
  private _listeners: Map<DataTableEventType, Set<DataTableEventCallback>> = new Map();
  /** @ignore */
  private _internalHandlers: Map<DataTableEventType, (change: IDataTableChangeEvent) => void> = new Map();

  /**
   * Creates a new DataTableRef.
   *
   * @param tableId - The data table ID (e.g. 'tbl_menu_items')
   * @param options - Optional configuration overrides
   * @throws Error if the global datatable library is not loaded
   */
  constructor(tableId: string, options?: IDataTableOptions) {

    const lib = (window as any).gadgets?.['reveldigital.datatable'];

    if (!lib || typeof lib.create !== 'function') {
      throw new Error(
        'RevelDigital DataTable library is not available. ' +
        'Ensure the datatable feature is enabled for this gadget.'
      );
    }

    this._instance = lib.create(tableId, options);
    this._wireEvents();
  }

  /**
   * Registers a callback for a data table change event.
   *
   * @param eventType - The event type: 'rowUpdated', 'rowCreated', or 'rowDeleted'
   * @param callback - Function to call when the event fires
   *
   * ```typescript
   * dt.on('rowUpdated', (change) => console.log('Row updated:', change));
   * dt.on('rowCreated', (change) => console.log('Row created:', change));
   * dt.on('rowDeleted', (change) => console.log('Row deleted:', change));
   * ```
   */
  public on(eventType: DataTableEventType, callback: DataTableEventCallback): void {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }
    this._listeners.get(eventType)!.add(callback);
  }

  /**
   * Removes a previously registered callback for a data table change event.
   *
   * @param eventType - The event type
   * @param callback - The callback to remove
   */
  public off(eventType: DataTableEventType, callback: DataTableEventCallback): void {
    this._listeners.get(eventType)?.delete(callback);
  }

  /**
   * Fetches rows from the data table.
   *
   * @param params - Optional query parameters (filter, sort, pagination)
   * @returns Promise resolving to the result set
   *
   * ```typescript
   * const result = await dt.getRows({
   *   filter: { category: 'Entree', price: { op: 'lte', value: 25 } },
   *   sort: 'itemName',
   *   sortDir: 'asc',
   *   pageSize: 20
   * });
   * ```
   */
  public getRows(params?: IDataTableQueryParams): Promise<IDataTableResult> {
    return this._instance.getRows(params);
  }

  /**
   * Fetches the table schema (column definitions and metadata).
   *
   * @returns Promise resolving to the table schema
   */
  public getSchema(): Promise<IDataTableSchema> {
    return this._instance.getSchema();
  }

  /**
   * Gets visible (non-hidden) columns from the table schema.
   *
   * @returns Promise resolving to an array of visible column definitions
   */
  public getVisibleColumns(): Promise<IDataTableColumn[]> {
    return this._instance.getVisibleColumns();
  }

  /**
   * Fetches rows with hidden column data stripped.
   *
   * @param params - Optional query parameters (same as getRows)
   * @returns Promise resolving to the result set with hidden fields removed
   */
  public getVisibleRows(params?: IDataTableQueryParams): Promise<IDataTableResult> {
    return this._instance.getVisibleRows(params);
  }

  /**
   * Starts polling for changes at the given interval.
   *
   * @param intervalMs - Polling interval in milliseconds (default 30000)
   */
  public startPolling(intervalMs?: number): void {
    this._instance.startPolling(intervalMs);
  }

  /**
   * Stops polling for changes.
   */
  public stopPolling(): void {
    this._instance.stopPolling();
  }

  /**
   * Releases all resources: stops polling, closes the real-time connection,
   * removes event listeners, and clears all registered callbacks.
   */
  public dispose(): void {
    for (const [eventType, handler] of this._internalHandlers) {
      this._instance.off(eventType, handler);
    }

    this._instance.dispose();

    this._listeners.clear();
    this._internalHandlers.clear();
  }

  /** @ignore */
  static _fromInstance(instance: any): DataTableRef {
    const ref = Object.create(DataTableRef.prototype) as DataTableRef;
    ref._listeners = new Map();
    ref._internalHandlers = new Map();
    ref._instance = instance;
    ref._wireEvents();
    return ref;
  }

  /** @ignore */
  private _wireEvents(): void {
    const events: DataTableEventType[] = ['rowUpdated', 'rowCreated', 'rowDeleted'];

    for (const eventType of events) {
      const handler = (change: IDataTableChangeEvent) => {
        const callbacks = this._listeners.get(eventType);
        if (callbacks) {
          for (const cb of callbacks) {
            cb(change);
          }
        }
      };
      this._internalHandlers.set(eventType, handler);
      this._instance.on(eventType, handler);
    }
  }
}


/**
 * Wrapper around a data table created from a gadget preference value.
 *
 * Automatically configures filter and sort settings from the preference,
 * and provides a `getFilteredRows()` convenience method that applies them.
 *
 * ```typescript
 * const cfg = client.createDataTableFromPref(prefs.getString('rdDataTable'));
 *
 * // Fetch rows with auto-wired filter + sort from the preference
 * const result = await cfg.getFilteredRows();
 *
 * // Access the underlying DataTableRef for schema, events, etc.
 * cfg.dataTable.on('rowUpdated', (change) => console.log(change));
 *
 * // Cleanup
 * cfg.dispose();
 * ```
 */
export class DataTablePrefRef {

  /** The underlying DataTableRef with full access to schema, events, polling, etc. */
  public readonly dataTable: DataTableRef;

  /** The parsed preference object. */
  public readonly pref: IDataTablePref;

  /** @ignore */
  private _config: any;

  /**
   * Creates a new DataTablePrefRef from a gadget preference JSON string.
   *
   * @param prefValue - The raw gadget preference string (JSON)
   * @param options - Optional configuration overrides
   * @throws Error if the global datatable library is not loaded
   */
  constructor(prefValue: string, options?: IDataTableOptions) {

    const lib = (window as any).gadgets?.['reveldigital.datatable'];

    if (!lib || typeof lib.createFromPref !== 'function') {
      throw new Error(
        'RevelDigital DataTable library is not available. ' +
        'Ensure the datatable feature is enabled for this gadget.'
      );
    }

    // gadgets.Prefs.getString() returns HTML-encoded values, decode before parsing
    const decoded = decode(prefValue);

    this._config = lib.createFromPref(decoded, options);
    this.pref = this._config.pref;
    this.dataTable = DataTableRef._fromInstance(this._config.dt);
  }

  /**
   * Fetches rows with the filter and sort settings from the preference automatically applied.
   * Additional query parameters can override or supplement the preference settings.
   *
   * @param params - Optional additional query parameters
   * @returns Promise resolving to the result set
   *
   * ```typescript
   * // Use preference defaults
   * const result = await cfg.getFilteredRows();
   *
   * // Override page size
   * const page = await cfg.getFilteredRows({ pageSize: 10 });
   * ```
   */
  public getFilteredRows(params?: IDataTableQueryParams): Promise<IDataTableResult> {
    return this._config.getFilteredRows(params);
  }

  /**
   * Releases all resources held by the underlying DataTableRef.
   */
  public dispose(): void {
    this.dataTable.dispose();
  }

}

import { gadgets } from '@reveldigital/gadget-types';

/**
 * Raw preference values used to seed a {@link MockPrefs} instance.
 *
 * Values are coerced to strings, mirroring the player, where every preference is
 * string-backed regardless of its declared datatype. Arrays are joined with `|`,
 * matching the Gadgets API array encoding.
 */
export type PrefValues = Record<string, unknown>;

/**
 * The preferences interface returned by {@link PlayerClient.getPrefs}.
 *
 * Extends the Gadgets API `Prefs` surface with existence checks ({@link IPrefs.has})
 * and nullable getters, which let a gadget distinguish an unset preference from one
 * deliberately set to a falsy value such as `false`, `0`, or `''`.
 */
export interface IPrefs extends gadgets.Prefs {

  /**
   * Returns true if the preference has been assigned a value.
   *
   * Note: the Gadgets API exposes no existence check, so for a preference backed by
   * a real player this is a probe — a preference is considered present when it reads
   * back as a non-empty string. A preference explicitly set to an empty string is
   * therefore reported as absent. Preferences backed by {@link MockPrefs} track
   * existence exactly.
   */
  has(key: string): boolean;

  /** Returns the preference value, or null if it is not set. */
  getStringOrNull(key: string): string | null;

  /** Returns the preference value, or null if it is not set. */
  getBoolOrNull(key: string): boolean | null;

  /** Returns the preference value, or null if it is not set. */
  getIntOrNull(key: string): number | null;

  /** Returns the preference value, or null if it is not set. */
  getFloatOrNull(key: string): number | null;

  /** Returns the preference value, or null if it is not set. */
  getArrayOrNull(key: string): string[] | null;
}

/**
 * The subset of the Gadgets API `Prefs` surface this SDK reads from.
 *
 * Declared structurally so that both the player's own `gadgets.Prefs` and
 * {@link MockPrefs} satisfy it.
 *
 * @ignore
 */
interface IPrefsSource {
  getArray(key: string): string[];
  getBool(key: string): boolean;
  getCountry(): string;
  getFloat(key: string): number;
  getInt(key: string): number;
  getLang(): string;
  getModuleId(): string | number;
  getMsg(key: string): string;
  getString(key: string): string;
  set(key: string, val: any): void;
  setArray(key: string, val: any[]): void;
  has?(key: string): boolean;
}

/**
 * Wraps a Gadgets API `Prefs` object, delegating the standard getters to it while
 * adding the existence-aware accessors declared by {@link IPrefs}.
 *
 * @ignore
 */
export class PrefsWrapper implements IPrefs {

  constructor(private readonly source: IPrefsSource) { }

  public has(key: string): boolean {

    // MockPrefs tracks existence exactly; the player's Prefs cannot, so fall back to
    // probing for a non-empty value.
    if (typeof this.source.has === 'function') {
      return this.source.has(key);
    }
    return this.source.getString(key) !== '';
  }

  public getStringOrNull(key: string): string | null {

    return this.has(key) ? this.source.getString(key) : null;
  }

  public getBoolOrNull(key: string): boolean | null {

    return this.has(key) ? this.source.getBool(key) : null;
  }

  public getIntOrNull(key: string): number | null {

    return this.has(key) ? this.source.getInt(key) : null;
  }

  public getFloatOrNull(key: string): number | null {

    return this.has(key) ? this.source.getFloat(key) : null;
  }

  public getArrayOrNull(key: string): string[] | null {

    return this.has(key) ? this.source.getArray(key) : null;
  }

  public getArray(key: string): string[] {

    return this.source.getArray(key);
  }

  public getBool(key: string): boolean {

    return this.source.getBool(key);
  }

  public getCountry(): string {

    return this.source.getCountry();
  }

  public getFloat(key: string): number {

    return this.source.getFloat(key);
  }

  public getInt(key: string): number {

    return this.source.getInt(key);
  }

  public getLang(): string {

    return this.source.getLang();
  }

  public getModuleId(): string | number {

    return this.source.getModuleId();
  }

  public getMsg(key: string): string {

    return this.source.getMsg(key);
  }

  public getString(key: string): string {

    return this.source.getString(key);
  }

  public set(key: string, val: any): void {

    this.source.set(key, val);
  }

  public setArray(key: string, val: any[]): void {

    this.source.setArray(key, val);
  }

  /**
   * Present only to satisfy the `gadgets.Prefs` declaration, which mistakenly declares
   * the constructor as an instance method.
   *
   * @ignore
   */
  public new(): { moduleId: string | number } {

    return { moduleId: this.getModuleId() };
  }
}

/**
 * Options for constructing a {@link MockPrefs} instance.
 */
export interface IMockPrefsOptions {

  /** Preference values to seed. Coerced to strings; arrays are joined with `|`. */
  prefs?: PrefValues;

  /** Value returned by `getLang()`. Defaults to `'en'`. */
  lang?: string;

  /** Value returned by `getCountry()`. Defaults to `'US'`. */
  country?: string;

  /** Value returned by `getModuleId()`. Defaults to `0`. */
  moduleId?: string | number;
}

/**
 * An in-memory implementation of the Gadgets API `Prefs` interface, used when no
 * player is attached — a local dev server, CMS preview, or a test.
 *
 * Getter semantics match the player: an unset preference reads as `''`, `false`, `0`,
 * or `[]` rather than throwing. Unlike the player's implementation it tracks existence
 * exactly, so {@link MockPrefs.has} distinguishes an unset preference from one set to
 * an empty string.
 */
export class MockPrefs implements IPrefsSource {

  private readonly values = new Map<string, string>();
  private readonly lang: string;
  private readonly country: string;
  private readonly moduleId: string | number;

  constructor(options?: IMockPrefsOptions) {

    this.lang = options?.lang ?? 'en';
    this.country = options?.country ?? 'US';
    this.moduleId = options?.moduleId ?? 0;

    for (const [key, value] of Object.entries(options?.prefs ?? {})) {
      if (value !== undefined && value !== null) {
        this.set(key, value);
      }
    }
  }

  public has(key: string): boolean {

    return this.values.has(key);
  }

  public getString(key: string): string {

    return this.values.get(key) ?? '';
  }

  public getBool(key: string): boolean {

    const value = this.getString(key).toLowerCase();

    return value === 'true' || value === '1';
  }

  public getInt(key: string): number {

    const value = Number.parseInt(this.getString(key), 10);

    return Number.isNaN(value) ? 0 : value;
  }

  public getFloat(key: string): number {

    const value = Number.parseFloat(this.getString(key));

    return Number.isNaN(value) ? 0 : value;
  }

  public getArray(key: string): string[] {

    const value = this.getString(key);

    return value === '' ? [] : value.split('|');
  }

  public getCountry(): string {

    return this.country;
  }

  public getLang(): string {

    return this.lang;
  }

  public getModuleId(): string | number {

    return this.moduleId;
  }

  public getMsg(key: string): string {

    // Message bundles are supplied by the player and unavailable standalone.
    return '';
  }

  public set(key: string, val: any): void {

    if (Array.isArray(val)) {
      this.setArray(key, val);
      return;
    }
    this.values.set(key, String(val));
  }

  public setArray(key: string, val: any[]): void {

    this.values.set(key, val.map(String).join('|'));
  }
}

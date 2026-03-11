/**
 * Generic dictionary interface for key-value pairs.
 *
 * @template T - The type of values stored in the dictionary
 */
export interface IDictionary<T> {
    [Key: string]: T;
}

/**
 * Enumeration of configuration operation types.
 */
export enum ConfigType {
    /** Request to open the configuration interface. */
    OpenConfig = 'openConfig',
    /** Instruction to apply new configuration values. */
    ApplyConfig = 'applyConfig'
}

/**
 * Interface representing configuration settings and events for the Revel Digital system.
 */
export interface IConfig {
    /** Dictionary of preference key-value pairs containing configuration settings. */
    prefs: IDictionary<any>;
    /** The type of configuration operation being performed. */
    type: ConfigType;
    /** Indicates if this configuration event originated from a popup window opener. */
    isOpener: boolean;
}

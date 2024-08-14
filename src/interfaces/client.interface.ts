/** @ignore */
export interface IClient {

    callback(...args: any[]): void;

    getDeviceTime(date?: Date): Promise<string | null>;

    getDeviceTimeZoneName(): Promise<string | null>;

    getDeviceTimeZoneID(): Promise<string | null>;

    getDeviceTimeZoneOffset(): Promise<number | null>;

    getLanguageCode(): Promise<string | null>;

    getDeviceKey(): Promise<string | null>;

    sendCommand(name: string, arg: string): void;

    sendRemoteCommand(deviceKeys: string[], name: string, arg: string): void;

    track(eventName: string, properties?: string): void;

    timeEvent(eventName: string): void;

    newEventSession(id?: string): void;

    getRevelRoot(): Promise<string | null>;

    getCommandMap(): Promise<any | null>;

    finish(): void;
}
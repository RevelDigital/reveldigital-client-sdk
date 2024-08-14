// Type definitions for the OpenSocial Core Gadget spec 0.1
// Project: http://opensocial.github.io/spec/trunk/Core-Gadget.xml#JavaScript-API-Reference
// Definitions by: Mike Tinnes <https://github.com/mtinnes>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export namespace gadgets {
    export class Prefs {

        new(): {
            moduleId: string | number
        };

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
    }

    export namespace util {
        function escapeString(str: string): string;

        function getFeatureParamteres(feature: string): any;

        function hasFeature(feature: string): boolean;

        function registerOnLoadHandler(callback: any): void;

        function unescapeString(str: string): string;
    }

    export namespace json {
        function parse(text: string): any;

        function stringify(v: any): string;
    }

    export namespace io {
        function encodeValues(fields: any): string;

        function getProxyUrl(url: string, opt_params: any): string;

        function makeRequest(url: string, opt_params: any): void;

        export namespace RequestParameters {
            const AUTHORIZATION: string;
            const CONTENT_TYPE: string;
            const GET_FULL_HEADERS: string;
            const GET_SUMMARIES: string;
            const HEADERS: string;
            const METHOD: string;
            const NUM_ENTRIES: string;
            const OAUTH_RECEIVED_CALLBACK: string;
            const OAUTH_REQUEST_TOKEN: string;
            const OAUTH_REQUEST_TOKEN_SECRET: string;
            const OAUTH_SERVICE_NAME: string;
            const OAUTH_TOKEN_NAME: string;
            const OAUTH_USE_TOKEN: string;
            const POST_DATA: string;
            const REFRESH_INTERVAL: string;
            const SIGN_OWNER: string;
            const SIGN_VIEWER: string;
        }

        export namespace AuthorizationType {
            const NONE: string;
            const OAUTH: string;
            const OAUTH2: string;
            const SIGNED: string;
        }

        export namespace ContentType {
            const DOM: string;
            const FEED: string;
            const JSON: string;
            const TEXT: string;
        }

        export namespace MethodType {
            const DELETE: string;
            const GET: string;
            const HEAD: string;
            const POST: string;
            const PUT: string;
        }
    }
}

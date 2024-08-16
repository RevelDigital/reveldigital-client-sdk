[**@reveldigital/client-sdk**](../README.md) • **Docs**

***

[@reveldigital/client-sdk](../globals.md) / PlayerClient

# Class: PlayerClient

## Constructors

### new PlayerClient()

> **new PlayerClient**(): [`PlayerClient`](PlayerClient.md)

#### Returns

[`PlayerClient`](PlayerClient.md)

#### Defined in

[index.ts:19](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L19)

## Methods

### callback()

> **callback**(...`args`): `void`

This method allows the gadget to communicate with player scripting.
If the appropriate scripting is in place in the currently running template, calling this method
will initiate a callback which can be acted upon in player script.

#### Parameters

• ...**args**: `any`[]

variable number of arguments

#### Returns

`void`

#### Example

```ts
client.callback('test', 'this');
```

#### Defined in

[index.ts:67](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L67)

***

### finish()

> **finish**(): `void`

Indicate to the player that this gadget has finished it's visualization.
This allows the player to proceed with the next item in a playlist if applicable.

#### Returns

`void`

#### Defined in

[index.ts:292](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L292)

***

### getCommandMap()

> **getCommandMap**(): `Promise`\<`any`\>

Returns a map of commands currently active for this device.

#### Returns

`Promise`\<`any`\>

Map of commands currently active for this device.

#### Defined in

[index.ts:281](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L281)

***

### getDeviceKey()

> **getDeviceKey**(): `Promise`\<`null` \| `string`\>

Returns the unique Revel Digital device key associated with the device.

#### Returns

`Promise`\<`null` \| `string`\>

Device key

#### Defined in

[index.ts:181](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L181)

***

### getDeviceTime()

> **getDeviceTime**(`date`?): `Promise`\<`null` \| `string`\>

Returns the current device time in ISO8601 format.
Current device time is determined by the device timezone assigned to the device in the CMS.

#### Parameters

• **date?**: `Date`

Optional. If supplied will translate the supplied date/time to device time based on respective timezones.

#### Returns

`Promise`\<`null` \| `string`\>

Date/time in ISO8601 format

#### Defined in

[index.ts:118](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L118)

***

### getDeviceTimeZoneID()

> **getDeviceTimeZoneID**(): `Promise`\<`null` \| `string`\>

Returns the timezone ID currently assigned to the device.

#### Returns

`Promise`\<`null` \| `string`\>

Timezone ID

#### Defined in

[index.ts:145](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L145)

***

### getDeviceTimeZoneName()

> **getDeviceTimeZoneName**(): `Promise`\<`null` \| `string`\>

Returns the timezone name currently assigned to the device.

#### Returns

`Promise`\<`null` \| `string`\>

Timezone Name

#### Defined in

[index.ts:133](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L133)

***

### getDeviceTimeZoneOffset()

> **getDeviceTimeZoneOffset**(): `Promise`\<`null` \| `number`\>

Returns the numerical offset from GMT of the timezone currently assigned to the device.

#### Returns

`Promise`\<`null` \| `number`\>

Timezone offset

#### Defined in

[index.ts:157](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L157)

***

### getLanguageCode()

> **getLanguageCode**(): `Promise`\<`null` \| `string`\>

Returns the language code of the language currently assigned to the device.

#### Returns

`Promise`\<`null` \| `string`\>

Language code

#### Defined in

[index.ts:169](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L169)

***

### getPrefs()

> **getPrefs**(): `undefined` \| `Prefs`

Accessor method for the user preferences interface exposed by the Gadgets API.

See [https://developers.google.com/gadgets/docs/basic](https://developers.google.com/gadgets/docs/basic) for more details on the Gadgets API.

#### Returns

`undefined` \| `Prefs`

Gadget API Prefs object

#### Example

```ts
constructor(public client: PlayerClientService) {
           let prefs = client.getPrefs();
           let myString = prefs.getString('myStringPref');
}
```

#### Defined in

[index.ts:106](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L106)

***

### getRevelRoot()

> **getRevelRoot**(): `Promise`\<`null` \| `string`\>

Returns the root folder utilized by this player device.

#### Returns

`Promise`\<`null` \| `string`\>

Path to the root folder

#### Defined in

[index.ts:269](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L269)

***

### isPreviewMode()

> **isPreviewMode**(): `Promise`\<`boolean`\>

Check is the gadget is running in preview mode. Preview mode is enabled when the gadget is
being edited in the CMS, or otherwise not running in a normal player environment.

#### Returns

`Promise`\<`boolean`\>

True if the gadget is running in preview mode, false otherwise.

#### Defined in

[index.ts:306](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L306)

***

### newEventSession()

> **newEventSession**(`id`?): `void`

A session is a way of grouping events together. Each event has an associated session ID.
Session ID's are randomly generated and reset by subsequent calls to newEventSession().

Each call to track() will utilize the same session ID, until another call to newEventSession().

#### Parameters

• **id?**: `string`

Optional. User supplied session ID. If not supplied a random session ID will be generated.

#### Returns

`void`

#### Defined in

[index.ts:253](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L253)

***

### off()

> **off**(`eventName`, `callback`): `void`

Remove an event listener for the specified player event.

#### Parameters

• **eventName**: `string`

One of the following player events: 'Start', 'Stop', 'Command'

• **callback**

function to remove

#### Returns

`void`

#### Defined in

[index.ts:48](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L48)

***

### on()

> **on**(`eventName`, `callback`): `void`

Add an event listener for the specified player event.

#### Parameters

• **eventName**: `string`

One of the following player events: 'Start', 'Stop', 'Command'

• **callback**

function to call when the event is triggered

#### Returns

`void`

#### Defined in

[index.ts:33](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L33)

***

### sendCommand()

> **sendCommand**(`name`, `arg`): `void`

Send a command to the player device.

#### Parameters

• **name**: `string`

Command name

• **arg**: `string`

Command argument

#### Returns

`void`

#### Defined in

[index.ts:194](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L194)

***

### sendRemoteCommand()

> **sendRemoteCommand**(`deviceKeys`, `name`, `arg`): `void`

Send a command to any remote player with the supplied device key(s).
Note: Remote commands can only be delivered to devices within the same account as the sender device.

#### Parameters

• **deviceKeys**: `string`[]

Array of remote device keys

• **name**: `string`

Command name

• **arg**: `string`

Command arg

#### Returns

`void`

#### Defined in

[index.ts:209](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L209)

***

### timeEvent()

> **timeEvent**(`eventName`): `void`

Method for initiating a timed event.
Timed events are useful for tracking the duration of an event and must be proceeded with a call to track().

#### Parameters

• **eventName**: `string`

Unique name for this event

#### Returns

`void`

#### Example

```ts
client.timeEvent('testEvent');
client.track("test", { "a": "b" });
```

#### Defined in

[index.ts:239](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L239)

***

### track()

> **track**(`eventName`, `properties`?): `void`

Log an event for use with AdHawk analytics.
Events are used for tracking various metrics including usage statistics, player condition, state changes, etc.

#### Parameters

• **eventName**: `string`

Unique name for this event

• **properties?**: `IEventProperties`

A map of user defined properties to associate with this event

#### Returns

`void`

#### Defined in

[index.ts:223](https://github.com/RevelDigital/reveldigital-client-sdk/blob/07971f0d78ea6011de154b80d847680ae80aad92/src/index.ts#L223)

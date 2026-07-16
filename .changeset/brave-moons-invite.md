---
"@reveldigital/client-sdk": minor
---

Make the SDK degrade gracefully with no player attached, and add a supported test harness.

- `getPrefs()` no longer throws outside the player. It falls back to an in-memory mock, matching the mock fallback used by the rest of the Client API, and is now typed `IPrefs` rather than `gadgets.Prefs | undefined` — it never returns undefined.
- `IPrefs` extends the Gadgets API `Prefs` surface with `has()` and `getStringOrNull()` / `getBoolOrNull()` / `getIntOrNull()` / `getFloatOrNull()` / `getArrayOrNull()`, which distinguish an unset preference from one deliberately set to a falsy value.
- `EventType` is a plain enum instead of an ambient `const enum`, which broke `isolatedModules` consumers such as Vite (TS2748). No runtime change.
- `off(eventType, callback?)` removes a single listener when given one, and every listener for the event type when not. Previously it took no callback, so unsubscribing one handler tore down all of them. This also fixes a related bug where registering a second listener for an event type left the first permanently attached and unremovable.
- New `@reveldigital/client-sdk/testing` entrypoint exporting `createMockPlayer()`, for driving player lifecycle events and asserting on what a gadget sent to the player.
- `gadgets` types are re-exported from the package root, so consumers no longer need a direct dependency on `@reveldigital/gadget-types` to name a prefs value.
- Documented per-method behavior with no player attached.

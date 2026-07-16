import { afterEach, describe, expect, test, vi } from 'vitest';
import { createPlayerClient } from '../index';
import { MockPrefs } from '../prefs';

/**
 * Installs a stand-in for the Gadgets API `Prefs` global that mirrors the player's:
 * string-backed, with no existence check of its own.
 */
function installPlayerPrefs(values: Record<string, string>): void {

  (window as any).gadgets = {
    Prefs: class {
      getString(key: string) { return values[key] ?? ''; }
      getBool(key: string) { return this.getString(key) === 'true'; }
      getInt(key: string) { return Number.parseInt(this.getString(key), 10) || 0; }
      getFloat(key: string) { return Number.parseFloat(this.getString(key)) || 0; }
      getArray(key: string) { const v = this.getString(key); return v === '' ? [] : v.split('|'); }
      getCountry() { return 'US'; }
      getLang() { return 'en'; }
      getModuleId() { return 42; }
      getMsg(key: string) { return ''; }
      set(key: string, val: any) { values[key] = String(val); }
      setArray(key: string, val: any[]) { values[key] = val.join('|'); }
    }
  };
}

afterEach(() => {
  delete (window as any).gadgets;
  vi.restoreAllMocks();
});

describe('getPrefs() with no player attached', () => {

  test('does not throw when the Gadgets API is absent', () => {

    // Regression: previously `new window.gadgets.Prefs()` threw a TypeError, killing
    // the gadget during startup in dev and CMS preview.
    expect((window as any).gadgets).toBeUndefined();

    const client = createPlayerClient();

    expect(() => client.getPrefs()).not.toThrow();
    expect(client.getPrefs()).toBeDefined();
  });

  test('unset preferences read as empty rather than throwing', () => {

    const prefs = createPlayerClient().getPrefs();

    expect(prefs.getString('nope')).toBe('');
    expect(prefs.getBool('nope')).toBe(false);
    expect(prefs.getInt('nope')).toBe(0);
    expect(prefs.getFloat('nope')).toBe(0);
    expect(prefs.getArray('nope')).toEqual([]);
  });

  test('announces the fallback once, then caches the mock across calls', () => {

    const log = vi.spyOn(console, 'log').mockImplementation(() => { });
    const client = createPlayerClient();

    client.getPrefs().set('written', 'value');

    // Values survive across calls, as they would in the player.
    expect(client.getPrefs().getString('written')).toBe('value');
    expect(log).toHaveBeenCalledTimes(1);
  });
});

describe('getPrefs() with a player attached', () => {

  test('reads through to the Gadgets API prefs', () => {

    installPlayerPrefs({ language: 'de', maxItems: '12' });

    const prefs = createPlayerClient().getPrefs();

    expect(prefs.getString('language')).toBe('de');
    expect(prefs.getInt('maxItems')).toBe(12);
    expect(prefs.getModuleId()).toBe(42);
  });

  test('has() probes for a value when the source cannot report existence', () => {

    installPlayerPrefs({ language: 'de' });

    const prefs = createPlayerClient().getPrefs();

    expect(prefs.has('language')).toBe(true);
    expect(prefs.has('missing')).toBe(false);
  });

  test('writes through to the Gadgets API prefs', () => {

    installPlayerPrefs({});

    const prefs = createPlayerClient().getPrefs();

    prefs.set('language', 'fr');
    prefs.setArray('categories', ['events', 'births']);

    expect(prefs.getString('language')).toBe('fr');
    expect(prefs.getArray('categories')).toEqual(['events', 'births']);
  });
});

describe('distinguishing an unset preference from a falsy one', () => {

  test('getBoolOrNull separates a deliberate false from an unset preference', () => {

    const prefs = createPlayerClient().getPrefs();

    prefs.set('kenBurns', false);

    expect(prefs.getBoolOrNull('kenBurns')).toBe(false);
    expect(prefs.getBoolOrNull('unset')).toBeNull();

    // The motivating case: honoring a gadget.yaml `default_value: true` without
    // overriding a designer's deliberate false.
    expect(prefs.getBoolOrNull('kenBurns') ?? true).toBe(false);
    expect(prefs.getBoolOrNull('unset') ?? true).toBe(true);
  });

  test('nullable getters separate zero and empty from unset', () => {

    const prefs = createPlayerClient().getPrefs();

    prefs.set('maxItems', 0);
    prefs.set('label', '');
    prefs.set('ratio', 0.0);
    prefs.setArray('categories', []);

    expect(prefs.getIntOrNull('maxItems')).toBe(0);
    expect(prefs.getIntOrNull('unset')).toBeNull();

    expect(prefs.getFloatOrNull('ratio')).toBe(0);
    expect(prefs.getFloatOrNull('unset')).toBeNull();

    expect(prefs.getStringOrNull('label')).toBe('');
    expect(prefs.getStringOrNull('unset')).toBeNull();

    expect(prefs.getArrayOrNull('categories')).toEqual([]);
    expect(prefs.getArrayOrNull('unset')).toBeNull();
  });

  test('has() tracks existence exactly when backed by MockPrefs', () => {

    const prefs = createPlayerClient().getPrefs();

    prefs.set('label', '');

    // An empty string is a value that was set, not an absent preference. The player's
    // own Prefs cannot express this, but the mock can.
    expect(prefs.has('label')).toBe(true);
    expect(prefs.has('unset')).toBe(false);
  });
});

describe('MockPrefs', () => {

  test('coerces seeded values to strings, matching the player', () => {

    const prefs = new MockPrefs({
      prefs: { maxItems: 12, kenBurns: true, ratio: 1.5, categories: ['events', 'births'] }
    });

    expect(prefs.getInt('maxItems')).toBe(12);
    expect(prefs.getString('maxItems')).toBe('12');
    expect(prefs.getBool('kenBurns')).toBe(true);
    expect(prefs.getFloat('ratio')).toBe(1.5);
    expect(prefs.getArray('categories')).toEqual(['events', 'births']);
  });

  test('ignores null and undefined seed values', () => {

    const prefs = new MockPrefs({ prefs: { a: null, b: undefined, c: 'set' } });

    expect(prefs.has('a')).toBe(false);
    expect(prefs.has('b')).toBe(false);
    expect(prefs.has('c')).toBe(true);
  });

  test('getBool accepts the string forms the player emits', () => {

    const prefs = new MockPrefs({ prefs: { a: 'true', b: 'TRUE', c: '1', d: 'false', e: '0', f: 'yes' } });

    expect(prefs.getBool('a')).toBe(true);
    expect(prefs.getBool('b')).toBe(true);
    expect(prefs.getBool('c')).toBe(true);
    expect(prefs.getBool('d')).toBe(false);
    expect(prefs.getBool('e')).toBe(false);
    expect(prefs.getBool('f')).toBe(false);
  });

  test('reports lang, country, and moduleId', () => {

    expect(new MockPrefs().getLang()).toBe('en');
    expect(new MockPrefs().getCountry()).toBe('US');
    expect(new MockPrefs().getModuleId()).toBe(0);

    const custom = new MockPrefs({ lang: 'de', country: 'DE', moduleId: 7 });

    expect(custom.getLang()).toBe('de');
    expect(custom.getCountry()).toBe('DE');
    expect(custom.getModuleId()).toBe(7);
  });
});

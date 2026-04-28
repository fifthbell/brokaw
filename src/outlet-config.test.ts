import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { outletConfig } from './outlet-config.js';
import { version } from './version.js';

type ExpectedType =
  | 'string'
  | 'boolean'
  | 'string[]'
  | 'record<string,string>'
  | 'named-slug';

const requiredContract: Record<string, ExpectedType> = {
  publicSiteUrl: 'string',
  cdnUrl: 'string',
  siteName: 'string',
  contentPath: 'string',
  inventoryFilename: 'string',
  defaultLanguage: 'string',
  supportedLanguages: 'string[]',
  prefixDefaultLocale: 'boolean',
  defaultAuthor: 'named-slug',
  defaultCategory: 'named-slug',
  linkInBioRoute: 'string',
  searchTitle: 'string',
  searchDescriptions: 'record<string,string>',
  socialLanguages: 'string[]',
  socialUserAgent: 'string',
  socialImageExport: 'string',
  hashtagServiceBaseUrl: 'string'
};

function expectContractValue(key: string, expectedType: ExpectedType): void {
  const value = (outletConfig as Record<string, unknown>)[key];

  expect(value, `${key} is required`).not.toBeUndefined();
  expect(value, `${key} is required`).not.toBeNull();

  if (expectedType === 'string[]') {
    expect(Array.isArray(value), `${key} must be an array`).toBe(true);
    expect((value as unknown[]).every((item) => typeof item === 'string'), `${key} must contain only strings`).toBe(true);
    return;
  }

  if (expectedType === 'record<string,string>') {
    expect(value && typeof value === 'object' && !Array.isArray(value), `${key} must be an object`).toBe(true);
    expect(Object.values(value as Record<string, unknown>).every((item) => typeof item === 'string'), `${key} values must be strings`).toBe(true);
    return;
  }

  if (expectedType === 'named-slug') {
    expect(value && typeof value === 'object' && !Array.isArray(value), `${key} must be an object`).toBe(true);
    expect((value as { name?: unknown }).name, `${key}.name must be a string`).toEqual(expect.any(String));
    expect((value as { slug?: unknown }).slug, `${key}.slug must be a string`).toEqual(expect.any(String));
    return;
  }

  expect(typeof value, `${key} must be a ${expectedType}`).toBe(expectedType);
}

describe('outletConfig', () => {
  it('satisfies Cronkite required outletConfig contract', () => {
    for (const [key, expectedType] of Object.entries(requiredContract)) {
      expectContractValue(key, expectedType);
    }
  });

  it('uses Fifthbell production integration values expected by Cronkite', () => {
    expect(outletConfig.contentPath).toBe('/content');
    expect(outletConfig.inventoryFilename).toBe('cronkite-inventory.json');
    expect(outletConfig.socialImageExport).toBe('buildInstagramImageHtml');
    expect(outletConfig.hashtagServiceBaseUrl).toBe('http://192.168.0.99:8000');
  });
});

describe('version', () => {
  it('matches package.json version', () => {
    const require = createRequire(import.meta.url);
    const packageJson = require('../package.json') as { version: string };

    expect(version).toBe(packageJson.version);
  });
});

// Permanent repo guards: OPS-07 (standalone repo), OPS-08 (single config), privacy
// (SOLO-01 / ID-02 stay on device), raw HTML and UI-01 (no hover).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

/** Non-test .ts/.tsx sources under the given repo-relative directories. */
function sources(...dirs: string[]): string[] {
  return dirs
    .flatMap((d) => walk(join(ROOT, d)))
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f));
}

/** file:line for every line matching the pattern. */
function findLines(files: string[], pattern: RegExp): string[] {
  const hits: string[] = [];
  for (const file of files) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (pattern.test(line)) hits.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
      });
  }
  return hits;
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8')) as Record<string, unknown>;
}

describe('OPS-08 single config file', () => {
  it('SPEC default literals (2000 / 15000 / 600000) appear only in shared/src/config.ts', () => {
    const files = sources('shared/src', 'client/src', 'server/src').filter(
      (f) => relative(ROOT, f) !== join('shared', 'src', 'config.ts'),
    );
    expect(files.length).toBeGreaterThan(5);
    const hits = findLines(files, /(?<![\w.])(2_?000|15_?000|600_?000)(?![\w.])/);
    expect(hits).toEqual([]);
  });
});

describe('OPS-07 standalone repo and in-repo dependencies', () => {
  it('root package is schulte-game with exactly the three workspaces', () => {
    const root = readJson('package.json');
    expect(root['name']).toBe('schulte-game');
    expect(root['workspaces']).toEqual(['shared', 'client', 'server']);
  });

  it('every dependency spec is an exact semver, except @schulte/shared which is "*"', () => {
    for (const pkg of ['package.json', 'shared/package.json', 'client/package.json', 'server/package.json']) {
      const json = readJson(pkg);
      for (const field of ['dependencies', 'devDependencies']) {
        const deps = (json[field] ?? {}) as Record<string, string>;
        for (const [name, spec] of Object.entries(deps)) {
          if (name === '@schulte/shared') {
            expect(spec, `${pkg} ${name}`).toBe('*');
            continue;
          }
          expect(spec, `${pkg} ${name}`).toMatch(/^\d+\.\d+\.\d+$/);
        }
      }
    }
  });

  it('no dependency points outside the repo (file:, link:, git, http, ../)', () => {
    for (const pkg of ['package.json', 'shared/package.json', 'client/package.json', 'server/package.json']) {
      const json = readJson(pkg);
      for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
        const deps = (json[field] ?? {}) as Record<string, string>;
        for (const [name, spec] of Object.entries(deps)) {
          expect(spec, `${pkg} ${name}`).not.toMatch(/^(file:|link:|git|http)/);
          expect(spec, `${pkg} ${name}`).not.toContain('../');
        }
      }
    }
  });
});

describe('privacy: nothing leaves the device (SOLO-01, ID-02)', () => {
  it('client and shared sources use no network API', () => {
    const files = sources('client/src', 'shared/src');
    expect(files.length).toBeGreaterThan(10);
    const hits = findLines(files, /\bfetch\s*\(|\b(XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/);
    expect(hits).toEqual([]);
  });

  it('client/index.html references no external URL', () => {
    const html = readFileSync(join(ROOT, 'client', 'index.html'), 'utf8');
    expect(html).not.toMatch(/https?:\/\//);
  });
});

describe('raw HTML injection is forbidden (T-05-02)', () => {
  it('client sources never use dangerouslySetInnerHTML or innerHTML', () => {
    const hits = findLines(sources('client/src'), /dangerouslySetInnerHTML|innerHTML/);
    expect(hits).toEqual([]);
  });
});

describe('UI-01 no hover-dependent styling', () => {
  it('styles.css has no hover pseudo-class or hover media query', () => {
    const css = readFileSync(join(ROOT, 'client', 'src', 'styles.css'), 'utf8');
    expect(css).not.toMatch(/:hover/);
    expect(css).not.toMatch(/@media[^{]*\bhover\s*:/);
  });
});

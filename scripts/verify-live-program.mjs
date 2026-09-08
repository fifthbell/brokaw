import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { liveProgramPageFiles } from '../dist/renderer.js';

const entries = liveProgramPageFiles();
const byKey = new Map(entries.map((entry) => [entry.key, entry]));
assert(byKey.has('index.html'), 'live-program bundle must include index.html');
assert(byKey.has('live-program-manifest.json'), 'live-program bundle must include its manifest');

const manifest = JSON.parse(byKey.get('live-program-manifest.json').body.toString('utf8'));
assert.equal(manifest.package, '@fifthbell/brokaw');
assert.equal(manifest.kind, 'alcantara.program-template');
assert.equal(manifest.contractVersion, 1);
assert.equal(manifest.id, 'fifthbell.live-program');
assert.equal(manifest.name, 'Fifthbell Live Program');
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.entrypoint, 'index.html');
assert.deepEqual(manifest.capabilities, [
  'audio.mixing',
  'audio.playback',
  'media.groups',
  'program.reload',
  'scene.activation',
  'scene.configuration',
  'scene.staging',
  'stinger.transitions',
]);
assert.deepEqual(manifest.control, {
  protocol: 'alcantara.program.v1',
  transport: 'server-sent-events',
  snapshotPath: 'state',
  eventsPath: 'events',
  runtimeParameters: {
    programId: 'programId',
    apiBaseUrl: 'apiBaseUrl',
  },
  signals: [
    'audio_bus_update',
    'broadcast_settings_update',
    'heartbeat',
    'instant_play',
    'instant_stop_all',
    'program_media_groups_changed',
    'program_reload',
    'program_scenes_changed',
    'program_state_snapshot',
    'program_stingers_changed',
    'scene_change',
    'scene_cleared',
    'scene_instant_state',
    'scene_instant_stop',
    'scene_instant_take',
    'scene_staged',
    'scene_update',
    'song_off_air',
  ],
});
assert.deepEqual(
  manifest.files.map((file) => file.key),
  entries.filter((entry) => entry.key !== 'live-program-manifest.json').map((entry) => entry.key),
  'manifest must list every packaged renderer file in deterministic order',
);
for (const file of manifest.files) {
  const entry = byKey.get(file.key);
  assert(entry, `manifest entry ${file.key} must exist`);
  assert.equal(entry.contentType, file.contentType, `${file.key} content type must match`);
  assert.equal(entry.body.byteLength, file.bytes, `${file.key} byte size must match`);
  assert.equal(createHash('sha256').update(entry.body).digest('hex'), file.sha256, `${file.key} digest must match`);
}

const html = byKey.get('index.html').body.toString('utf8');
const cssEntry = entries.find((entry) => entry.contentType.startsWith('text/css'));
assert(cssEntry, 'live-program bundle must include CSS');
for (const match of html.matchAll(/(?:src|href)="\.\/([^"?#]+)["?#]/g)) {
  assert(byKey.has(match[1]), `HTML reference ${match[1]} must be packaged`);
}
for (const match of cssEntry.body.toString('utf8').matchAll(/url\(["']?\.\/([^)"'?#]+)["']?\)/g)) {
  assert(byKey.has(match[1]), `CSS reference ${match[1]} must be packaged`);
}
assert(!/https?:\/\/(?:[^/]+\.)?alcantara\b/i.test(html + cssEntry.body.toString('utf8')), 'presentation assets must not load from Alcantara');

console.log(`Verified live-program bundle ${manifest.bundleVersion}: ${entries.length} files`);

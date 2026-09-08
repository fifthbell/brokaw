export const PROGRAM_TEMPLATE_KIND = "alcantara.program-template";
export const PROGRAM_TEMPLATE_CONTRACT_VERSION = 1;

export const liveProgramTemplateContract = {
  kind: PROGRAM_TEMPLATE_KIND,
  contractVersion: PROGRAM_TEMPLATE_CONTRACT_VERSION,
  id: "fifthbell.live-program",
  name: "Fifthbell Live Program",
  entrypoint: "index.html",
  capabilities: [
    "audio.mixing",
    "audio.playback",
    "media.groups",
    "program.reload",
    "scene.activation",
    "scene.configuration",
    "scene.staging",
    "stinger.transitions",
  ],
  control: {
    protocol: "alcantara.program.v1",
    transport: "server-sent-events",
    snapshotPath: "state",
    eventsPath: "events",
    runtimeParameters: {
      programId: "programId",
      apiBaseUrl: "apiBaseUrl",
    },
    signals: [
      "audio_bus_update",
      "broadcast_settings_update",
      "heartbeat",
      "instant_play",
      "instant_stop_all",
      "program_media_groups_changed",
      "program_reload",
      "program_scenes_changed",
      "program_state_snapshot",
      "program_stingers_changed",
      "scene_change",
      "scene_cleared",
      "scene_instant_state",
      "scene_instant_stop",
      "scene_instant_take",
      "scene_staged",
      "scene_update",
      "song_off_air",
    ],
  },
} as const;

export type ProgramTemplateContract = typeof liveProgramTemplateContract;

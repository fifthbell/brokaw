import { describe, expect, it } from "vitest";
import {
  PROGRAM_TEMPLATE_CONTRACT_VERSION,
  PROGRAM_TEMPLATE_KIND,
  liveProgramTemplateContract,
} from "./program-template-manifest.js";

describe("program template manifest", () => {
  it("declares the accepted contract identity and version", () => {
    expect(PROGRAM_TEMPLATE_KIND).toBe("alcantara.program-template");
    expect(PROGRAM_TEMPLATE_CONTRACT_VERSION).toBe(1);
    expect(liveProgramTemplateContract.kind).toBe(PROGRAM_TEMPLATE_KIND);
    expect(liveProgramTemplateContract.contractVersion).toBe(PROGRAM_TEMPLATE_CONTRACT_VERSION);
    expect(liveProgramTemplateContract.id).toBe("fifthbell.live-program");
    expect(liveProgramTemplateContract.name).toBe("Fifthbell Live Program");
    expect(liveProgramTemplateContract.entrypoint).toBe("index.html");
  });

  it("declares expected capabilities and control protocol", () => {
    expect(liveProgramTemplateContract.capabilities).toContain("audio.mixing");
    expect(liveProgramTemplateContract.capabilities).toContain("audio.playback");
    expect(liveProgramTemplateContract.capabilities).toContain("media.groups");
    expect(liveProgramTemplateContract.capabilities).toContain("program.reload");
    expect(liveProgramTemplateContract.capabilities).toContain("scene.activation");
    expect(liveProgramTemplateContract.capabilities).toContain("scene.configuration");
    expect(liveProgramTemplateContract.capabilities).toContain("scene.staging");
    expect(liveProgramTemplateContract.capabilities).toContain("stinger.transitions");

    expect(liveProgramTemplateContract.control.protocol).toBe("alcantara.program.v1");
    expect(liveProgramTemplateContract.control.transport).toBe("server-sent-events");
    expect(liveProgramTemplateContract.control.snapshotPath).toBe("state");
    expect(liveProgramTemplateContract.control.eventsPath).toBe("events");
    expect(liveProgramTemplateContract.control.runtimeParameters.programId).toBe("programId");
    expect(liveProgramTemplateContract.control.runtimeParameters.apiBaseUrl).toBe("apiBaseUrl");
    expect(liveProgramTemplateContract.control.signals).toContain("audio_bus_update");
    expect(liveProgramTemplateContract.control.signals).toContain("instant_play");
    expect(liveProgramTemplateContract.control.signals).toContain("scene_change");
    expect(liveProgramTemplateContract.control.signals).toContain("program_reload");
  });
});

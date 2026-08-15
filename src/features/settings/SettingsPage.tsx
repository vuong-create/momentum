import { useState } from "react";

import useExperience from "../../experience/useExperience";
import DataBackupPanel from "./components/DataBackupPanel";

import "./settings.css";

type PreferenceToggleProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

function PreferenceToggle({
  checked,
  disabled = false,
  label,
  onChange,
}: PreferenceToggleProps) {
  return (
    <button
      type="button"
      className={`settings-toggle ${checked ? "is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export default function SettingsPage() {
  const experience = useExperience();
  const [updating, setUpdating] = useState<
    "sound" | "motion" | "sound-preferences" | null
  >(null);

  async function updateSoundPreferences(patch: Parameters<typeof experience.updateSoundPreferences>[0]) {
    setUpdating("sound-preferences");
    try {
      await experience.updateSoundPreferences(patch);
    } finally {
      setUpdating(null);
    }
  }

  async function updateSound(enabled: boolean) {
    setUpdating("sound");

    try {
      await experience.setSoundsEnabled(enabled);
    } finally {
      setUpdating(null);
    }
  }

  async function updateMotion(enabled: boolean) {
    setUpdating("motion");

    try {
      await experience.setAnimationsEnabled(enabled);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <section className="page settings-page">
      <header className="settings-heading">
        <span className="text-label">Momentum</span>
        <h1 className="font-pixel">Settings</h1>
        <p>
          Shape how Momentum responds while keeping every interaction calm
          and optional.
        </p>
      </header>

      <div className="settings-grid">
        <section className="settings-panel settings-feedback-panel">
          <div className="settings-panel-heading">
            <div>
              <span className="text-label">Experience</span>
              <h2>Feedback</h2>
            </div>
            <span className="settings-panel-index">01</span>
          </div>

          <div className="settings-control-list">
            <div className="settings-control-row">
              <div>
                <strong>Interaction sounds</strong>
                <span>
                  Soft cues for meaningful actions such as adding and
                  completing activities.
                </span>
              </div>
              <PreferenceToggle
                checked={experience.soundsEnabled}
                disabled={updating === "sound"}
                label="Interaction sounds"
                onChange={updateSound}
              />
            </div>

            <div className="settings-control-row">
              <div>
                <strong>Interface motion</strong>
                <span>
                  Tactile transitions and completion feedback throughout the
                  app.
                </span>
              </div>
              <PreferenceToggle
                checked={experience.animationsEnabled}
                disabled={updating === "motion"}
                label="Interface motion"
                onChange={updateMotion}
              />
            </div>
          </div>

          <div className="settings-sound-controls">
            <label className="settings-volume-control">
              <span><strong>Master volume</strong><small>{Math.round(experience.soundVolume * 100)}%</small></span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(experience.soundVolume * 100)}
                disabled={!experience.soundsEnabled}
                onChange={(event) => updateSoundPreferences({ soundVolume: Number(event.target.value) / 100 })}
              />
            </label>
            <label className="settings-volume-control">
              <span><strong>Focus soundscape</strong><small>{Math.round(experience.soundscapeVolume * 100)}%</small></span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(experience.soundscapeVolume * 100)}
                disabled={!experience.soundsEnabled}
                onChange={(event) => updateSoundPreferences({ soundscapeVolume: Number(event.target.value) / 100 })}
              />
            </label>

            <div className="settings-sound-categories">
              {[
                ["Interface", "Navigation and quiet UI movement.", "interfaceSoundsEnabled"],
                ["Actions", "Saves, logs, completions, and restores.", "actionSoundsEnabled"],
                ["Celebrations", "Records, milestones, and level-ups.", "celebrationSoundsEnabled"],
              ].map(([label, description, key]) => (
                <button
                  key={key}
                  type="button"
                  className={experience[key as "interfaceSoundsEnabled" | "actionSoundsEnabled" | "celebrationSoundsEnabled"] ? "is-enabled" : ""}
                  disabled={!experience.soundsEnabled || updating === "sound-preferences"}
                  onClick={() => updateSoundPreferences({
                    [key]: !experience[key as "interfaceSoundsEnabled" | "actionSoundsEnabled" | "celebrationSoundsEnabled"],
                  })}
                >
                  <span>{label}</span><small>{description}</small><i />
                </button>
              ))}
            </div>
          </div>

          <div className="settings-sound-gallery">
            <div><span className="text-label">Sound gallery</span><strong>Approved Momentum motifs</strong></div>
            <div>
              {[
                ["Complete", "task-completed"], ["Chinese", "chinese-logged"],
                ["Athletics", "workout-completed"], ["Cooking", "meal-cooked"],
                ["Finance", "finance-transaction"], ["Library", "library-saved"],
                ["Focus", "focus-phase"], ["Level up", "level-up"],
              ].map(([label, cue]) => (
                <button key={cue} type="button" disabled={!experience.soundsEnabled} onClick={() => experience.previewFeedback(cue as Parameters<typeof experience.previewFeedback>[0])}>
                  <span>▶</span>{label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="settings-panel settings-ambience-panel">
          <div className="settings-panel-heading">
            <div>
              <span className="text-label">Presence</span>
              <h2>Current ambience</h2>
            </div>
            <span className="settings-panel-index">02</span>
          </div>

          <div className="settings-ambience-visual" aria-hidden="true">
            <span />
            <span />
          </div>

          <strong>{experience.ambience.label}</strong>
          <p>{experience.ambience.description}</p>

          <div className="settings-ambience-status">
            <span />
            Changes automatically with local time
          </div>

          {experience.reducedMotion && (
            <p className="settings-system-note">
              Your system currently requests reduced motion. Momentum honors
              that preference automatically.
            </p>
          )}
        </aside>

        <DataBackupPanel />
      </div>
    </section>
  );
}

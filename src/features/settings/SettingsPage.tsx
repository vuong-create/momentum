import { useState } from "react";

import useExperience from "../../experience/useExperience";

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
    "sound" | "motion" | null
  >(null);

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

          <div className="settings-feedback-preview">
            <div>
              <span>Completion cue</span>
              <small>A restrained two-note confirmation.</small>
            </div>
            <button
              type="button"
              disabled={!experience.soundsEnabled}
              onClick={() =>
                experience.previewFeedback("task-completed")
              }
            >
              Preview
            </button>
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
      </div>
    </section>
  );
}

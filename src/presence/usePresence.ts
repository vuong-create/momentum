import { useContext } from "react";

import { PresenceContext } from "./PresenceProvider";

export default function usePresence() {
  const context = useContext(PresenceContext);

  if (!context) {
    throw new Error(
      "usePresence must be used inside PresenceProvider."
    );
  }

  return context;
}
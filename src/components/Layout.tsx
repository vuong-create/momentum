import type { ReactNode } from "react";

import Navigation from "./Navigation";
import "../styles/app-shell.css";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="momentum-shell">
      <div className="momentum-console-field" aria-hidden="true">
        <svg preserveAspectRatio="none">
          <defs>
            <pattern
              id="momentum-console-dots"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="0.55" />
            </pattern>
            <pattern
              id="momentum-console-grid"
              width="108"
              height="108"
              patternUnits="userSpaceOnUse"
            >
              <path d="M108 0H0V108" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#momentum-console-dots)" />
          <rect width="100%" height="100%" fill="url(#momentum-console-grid)" />
        </svg>
        <span className="momentum-console-crosshair momentum-console-crosshair-top" />
        <span className="momentum-console-crosshair momentum-console-crosshair-bottom" />
        <small className="momentum-console-route">MOMENTUM / PERSONAL SYSTEM</small>
        <small className="momentum-console-status">LOCAL / SYSTEM READY</small>
      </div>

      <Navigation />

      <main className="momentum-main">
        <div className="momentum-content">
          {children}
        </div>
      </main>
    </div>
  );
}

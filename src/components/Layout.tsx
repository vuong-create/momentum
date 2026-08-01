import type { ReactNode } from "react";

import Navigation from "./Navigation";
import "../styles/app-shell.css";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="momentum-shell">
      <Navigation />

      <main className="momentum-main">
        <div className="momentum-content">
          {children}
        </div>
      </main>
    </div>
  );
}
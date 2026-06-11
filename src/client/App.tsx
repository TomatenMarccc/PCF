import { Info, Menu, PanelsTopLeft } from "lucide-react";
import { NavLink, Route, Routes } from "react-router-dom";

import { DetailPage } from "./pages/DetailPage";
import { InfoPage } from "./pages/InfoPage";
import { OverviewPage } from "./pages/OverviewPage";

export function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          P
        </div>
        <h1>PCF Overview</h1>
        <img className="bosch-logo" src="/bosch-logo.png" alt="Bosch" />
      </header>

      <aside className="sidebar" aria-label="Primary navigation">
        <button className="nav-icon menu-placeholder" aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <nav>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-icon${isActive ? " active" : ""}`
            }
            aria-label="Home"
            title="Home"
          >
            <PanelsTopLeft size={20} />
          </NavLink>
          <NavLink
            to="/info"
            className={({ isActive }) =>
              `nav-icon${isActive ? " active" : ""}`
            }
            aria-label="Information"
            title="Information"
          >
            <Info size={20} />
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/parts/:id" element={<DetailPage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route path="*" element={<OverviewPage />} />
        </Routes>
      </main>
    </div>
  );
}

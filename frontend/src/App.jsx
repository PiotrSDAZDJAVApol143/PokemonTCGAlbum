// src/App.jsx
import Navbar from "./components/Navbar";
import { Outlet, useLocation } from "react-router-dom";
import useTheme from "./hooks/useTheme";

export default function App() {
    const { themeMode, setThemeMode } = useTheme();
    const location = useLocation();

    // Deck tło 20%:
    // - na /deck
    // - oraz na /card/:id jeśli weszło się w podgląd karty z decka (state.view === "deck")
    const isDeckBg =
        location.pathname.startsWith("/deck") ||
        (location.pathname.startsWith("/card/") && location.state?.view === "deck");

    return (
        <div className={`app-shell ${isDeckBg ? "is-deck" : ""}`}>
            {/* WARSTWY TŁA */}
            <div className="app-bg" aria-hidden="true" />
            <div className="app-bg-tint" aria-hidden="true" />

            <Navbar themeMode={themeMode} setThemeMode={setThemeMode} />

            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}
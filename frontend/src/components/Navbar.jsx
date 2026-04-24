// Navbar.jsx
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { FaSignOutAlt, FaBars, FaSun, FaMoon } from "react-icons/fa";
import Logo from "../assets/Logo01.png";
import { useAuth } from "../context/AuthContext";

function NavSquare({
                       to,
                       children,
                       disabled,
                       onClick,
                       isActiveOverride,
                       end = false,
                       compact = false,
                   }) {
    const base =
        "relative inline-flex items-center justify-center w-full " +
        `${compact ? "h-12 rounded-xl text-sm" : "h-14 rounded-2xl text-base"} ` +
        "font-semibold select-none whitespace-nowrap px-2 " +
        "bg-gradient-to-br from-indigo-700 via-violet-600 to-slate-300 " +
        "text-white shadow-[0_6px_0_#1b1b3a] border border-black transition-all";

    const hover =
        "hover:scale-[1.02] hover:shadow-[0_8px_0_#1b1b3a] focus:outline-none focus:ring-2 focus:ring-violet-300";

    const disabledCls = "opacity-50 pointer-events-none";
    const activeCls = "text-yellow-100 ring-2 ring-slate-300 shadow-[0_8px_0_#1b1b3a]";

    const content = (
        <span
            className="relative z-10 drop-shadow-[0_1px_0_rgba(0,0,0,0.4)] text-center leading-tight"
            style={{ fontSize: compact ? "clamp(11px, 0.85vw, 14px)" : "clamp(12px, 0.9vw, 18px)" }}
        >
            {children}
        </span>
    );

    if (disabled) {
        return <div className={`${base} ${disabledCls}`}>{content}</div>;
    }

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={[base, hover, isActiveOverride ? activeCls : ""].join(" ")}
            >
                <span className="absolute inset-0 rounded-inherit bg-[radial-gradient(200px_80px_at_50%_-10px,rgba(255,255,255,0.45),transparent_70%)] opacity-60" />
                {content}
            </button>
        );
    }

    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                [base, hover, isActive || isActiveOverride ? activeCls : ""].join(" ")
            }
        >
            <span className="absolute inset-0 rounded-inherit bg-[radial-gradient(200px_80px_at_50%_-10px,rgba(255,255,255,0.45),transparent_70%)] opacity-60" />
            {content}
        </NavLink>
    );
}

function PokeTitle() {
    const stroke = {
        textShadow:
            "0 2px 0 #1b1b3a, 0 -2px 0 #1b1b3a, 2px 0 0 #1b1b3a, -2px 0 0 #1b1b3a," +
            " 2px 2px 0 #1b1b3a, -2px 2px 0 #1b1b3a, 2px -2px 0 #1b1b3a, -2px -2px 0 #1b1b3a",
    };

    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="text-center leading-[1.02]" style={stroke}>
                <div className="text-yellow-300 font-extrabold" style={{ fontSize: "clamp(16px, 1.35vw, 28px)" }}>
                    Pokemon TCG
                </div>
                <div className="text-yellow-300 font-extrabold" style={{ fontSize: "clamp(16px, 1.35vw, 28px)" }}>
                    Album APP
                </div>
            </div>
        </div>
    );
}

function ThemeToggle({ themeMode, setThemeMode }) {
    const trackRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [systemDark, setSystemDark] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = (e) => setSystemDark(e.matches);

        media.addEventListener?.("change", onChange);
        return () => media.removeEventListener?.("change", onChange);
    }, []);

    const isDark = themeMode === "dark" || (themeMode === "system" && systemDark);

    const setFromClientX = (clientX) => {
        const el = trackRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const middle = rect.left + rect.width / 2;
        setThemeMode(clientX >= middle ? "dark" : "light");
    };

    const onPointerDown = (e) => {
        e.preventDefault();
        setDragging(true);
        trackRef.current?.setPointerCapture?.(e.pointerId);
        setFromClientX(e.clientX);
    };

    const onPointerMove = (e) => {
        if (!dragging) return;
        e.preventDefault();
        setFromClientX(e.clientX);
    };

    const stopDrag = (e) => {
        if (!dragging) return;
        e.preventDefault();
        setDragging(false);
        trackRef.current?.releasePointerCapture?.(e.pointerId);
    };

    return (
        <div className="flex h-full w-full items-center justify-center">
            <div
                ref={trackRef}
                role="switch"
                aria-checked={isDark}
                aria-label="Przełącz motyw jasny lub ciemny"
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
                onClick={() => setThemeMode(isDark ? "light" : "dark")}
                className={[
                    "relative h-10 w-[88px] rounded-full border border-black/20 shadow-md cursor-pointer select-none overflow-hidden transition-colors duration-300",
                    isDark
                        ? "bg-gradient-to-r from-slate-800 via-sky-900 to-indigo-950"
                        : "bg-gradient-to-r from-cyan-300 via-sky-200 to-lime-200",
                ].join(" ")}
            >
                <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center pointer-events-none">
                    {isDark ? <FaMoon className="text-white/90 text-xs" /> : null}
                </div>

                <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center pointer-events-none">
                    {!isDark ? <FaSun className="text-amber-500 text-sm" /> : null}
                </div>

                <div
                    className={[
                        "absolute top-[3px] h-8 w-8 rounded-full border shadow transition-all duration-300",
                        isDark
                            ? "left-[53px] bg-slate-900 border-slate-700"
                            : "left-[3px] bg-cyan-400 border-cyan-300",
                    ].join(" ")}
                />
            </div>
        </div>
    );
}

export default function Navbar({ themeMode, setThemeMode }) {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const goAlbum = () => {
        navigate("/album", { state: { resetAlbum: Date.now() } });
        setOpen(false);
    };

    const goTo = (path) => {
        navigate(path);
        setOpen(false);
    };

    const handleLogout = () => {
        logout();
        setOpen(false);
        navigate("/home");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-black/10 app-glass-strong">
            <div className="mx-auto w-full">
                {/* DESKTOP */}
                <div className="relative hidden md:grid h-[100px] items-center"
                     style={{
                         gridTemplateColumns:
                             "5% 10% 10% 10% 10% 5% 5% 10% 10% 10% 5% 5% 5%",
                     }}
                >
                    {/* 1 */}<div />
                    {/* 2 */}<div className="h-full"><PokeTitle /></div>
                    {/* 3 */}
                    <div className="flex items-center justify-center px-1">
                        <NavSquare to="/" end>Home</NavSquare>
                    </div>
                    {/* 4 */}
                    <div className="flex items-center justify-center px-1">
                        <NavSquare to="/pokedex">Pokedex</NavSquare>
                    </div>
                    {/* 5 */}
                    <div className="flex items-center justify-center px-1">
                        <NavSquare
                            isActiveOverride={location.pathname.startsWith("/album")}
                            onClick={goAlbum}
                        >
                            Album
                        </NavSquare>
                    </div>

                    {/* 6 */}<div />
                    {/* 7 */}<div />

                    {/* 8 */}
                    <div className="flex items-center justify-center px-1">
                        <NavSquare to="/deck" disabled={!user}>Deck</NavSquare>
                    </div>
                    {/* 9 */}
                    <div className="flex items-center justify-center px-1">
                        <NavSquare to="/poke-game" disabled={!user}>Poke Game</NavSquare>
                    </div>
                    {/* 10 */}
                    <div className="flex items-center justify-center px-1">
                        {!user ? (
                            <NavSquare to="/login">Login</NavSquare>
                        ) : (
                            <NavSquare to="/account">Twoje konto</NavSquare>
                        )}
                    </div>

                    {/* 11 */}
                    <div className="flex items-center justify-center">
                        {user ? (
                            <button
                                type="button"
                                onClick={handleLogout}
                                title="Wyloguj się"
                                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 app-glass shadow hover:scale-105 transition"
                            >
                                <FaSignOutAlt className="app-text-primary text-xl" />
                            </button>
                        ) : (
                            <div className="h-12 w-12" aria-hidden />
                        )}
                    </div>

                    {/* 12 */}
                    <div className="flex items-center justify-center">
                        <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} />
                    </div>

                    {/* 13 */}<div />

                    {/* Logo absolutnie na środku całego navbaru */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="pointer-events-auto">
                            <Link to="/" className="flex items-center justify-center">
                                <img
                                    src={Logo}
                                    alt="Logo"
                                    className="max-h-[74px] w-auto object-contain select-none"
                                />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* MOBILE */}
                <div className="md:hidden flex items-center justify-between h-16 px-4">
                    <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 app-glass shadow-sm"
                        onClick={() => setOpen((o) => !o)}
                        aria-label="Open menu"
                    >
                        <FaBars className="app-text-primary" />
                    </button>

                    <Link to="/" className="h-full grid place-items-center">
                        <img src={Logo} alt="Logo" className="h-[90%] w-auto object-contain" />
                    </Link>

                    {user ? (
                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Wyloguj się"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 app-glass shadow-sm"
                        >
                            <FaSignOutAlt className="app-text-primary" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => goTo("/login")}
                            className="inline-flex h-10 px-4 items-center justify-center rounded-xl border border-black/10 app-glass shadow-sm font-semibold app-text-primary"
                        >
                            Login
                        </button>
                    )}
                </div>

                {open && (
                    <div className="md:hidden pb-4 px-4">
                        <div className="mb-3 flex justify-center">
                            <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} />
                        </div>

                        <nav className="grid grid-cols-2 gap-3">
                            <NavSquare compact onClick={() => goTo("/")}>Home</NavSquare>
                            <NavSquare compact onClick={() => goTo("/pokedex")}>Pokedex</NavSquare>
                            <NavSquare compact isActiveOverride={location.pathname.startsWith("/album")} onClick={goAlbum}>
                                Album
                            </NavSquare>
                            <NavSquare compact onClick={() => goTo("/deck")} disabled={!user}>
                                Deck
                            </NavSquare>
                            <NavSquare compact onClick={() => goTo("/poke-game")} disabled={!user}>
                                Poke Game
                            </NavSquare>
                            {user && (
                                <NavSquare compact onClick={() => goTo("/account")}>
                                    Twoje konto
                                </NavSquare>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
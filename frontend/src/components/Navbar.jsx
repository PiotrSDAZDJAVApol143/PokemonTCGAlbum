// Navbar.jsx
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaSignOutAlt, FaBars } from "react-icons/fa";
import Logo from "../assets/Logo01.png";
import { useAuth } from "../context/AuthContext";

/** Kwadratowy przycisk z zaokrągleniem, gradientem i stanem aktywnym */
function NavSquare({ to, children, disabled }) {
    const base =
        "relative inline-flex items-center justify-center " +
        "h-14 w-36 rounded-2xl font-semibold select-none " +
        // gradient: granat → fiolet → srebrny (metallic vibe)
        "bg-gradient-to-br from-indigo-700 via-violet-600 to-slate-300 " +
        "text-white shadow-[0_6px_0_#1b1b3a] border border-black transition-all";
    const hover =
        "hover:scale-105 hover:shadow-[0_10px_0_#1b1b3a] focus:outline-none focus:ring-2 focus:ring-violet-300";
    const disabledCls = "opacity-50 pointer-events-none";

    const content = (
        <span className="relative z-10 drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]">
      {children}
    </span>
    );

    if (disabled) return <div className={`${base} ${disabledCls}`}>{content}</div>;

    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                [
                    base,
                    hover,
                    // aktywny = lekko większy + inny kolor tekstu + subtelny ring
                    isActive ? "scale-110 text-yellow-100 ring-2 ring-slate-300" : "",
                ].join(" ")
            }
        >
            {/* metallic shine */}
            <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(200px_80px_at_50%_-10px,rgba(255,255,255,0.45),transparent_70%)] opacity-60" />
            {content}
        </NavLink>
    );
}
function NavSlot({ children }) {
    return (
        <div className="h-14 w-36 grid place-items-center overflow-visible">
            {children}
        </div>
    );
}

/** Tytuł w „pokemonowym” stylu (złoty + ciemna obwódka) */
function PokeTitle() {
    const line = "leading-tight";
    const stroke = {
        textShadow:
            "0 2px 0 #1b1b3a, 0 -2px 0 #1b1b3a, 2px 0 0 #1b1b3a, -2px 0 0 #1b1b3a," +
            " 2px 2px 0 #1b1b3a, -2px 2px 0 #1b1b3a, 2px -2px 0 #1b1b3a, -2px -2px 0 #1b1b3a",
    };
    return (
        <div className="hidden md:block mr-4">
            <div
                className={`text-yellow-300 font-extrabold text-xl ${line}`}
                style={stroke}
            >
                Pokemon TCG
            </div>
            <div
                className={`text-yellow-300 font-extrabold text-xl ${line}`}
                style={stroke}
            >
                Album APP
            </div>
        </div>
    );
}

export default function Navbar() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 w-full bg-gradient-to-b from-white to-slate-50/70 backdrop-blur border-b border-black/10">
            {/* Desktop: 5 stref – tytuł | lewa 3 | logo | prawa 3 | wyloguj */}
            <div className="mx-auto max-w-7xl px-4">
                <div className="hidden md:grid grid-cols-[auto,1fr,auto,1fr,auto] items-center h-23">
                    {/* 1) Tytuł */}
                    <PokeTitle/>

                    {/* 2) Lewy blok 3 przyciski */}
                    <nav className="flex items-center justify-end gap-4 pr-4">
                        <NavSlot><NavSquare to="/">Home</NavSquare></NavSlot>
                        <NavSlot><NavSquare to="/pokedex">Pokedex</NavSquare></NavSlot>
                        <NavSlot><NavSquare to="/album" disabled={!user}>Album</NavSquare></NavSlot>
                    </nav>

                    {/* 3) Logo w centrum (klik jak Home) */}
                    <div className="flex items-center justify-center h-full">
                        <Link to="/" className="h-full grid place-items-center">
                            <img
                                src={Logo}
                                alt="Logo"
                                className="h-[95%] w-auto object-contain select-none"
                            />
                        </Link>
                    </div>

                    {/* 4) Prawy blok 3 przyciski */}
                    <div className="flex items-center justify-start gap-4 pl-4">
                        <NavSlot><NavSquare to="/deck" disabled={!user}>Deck</NavSquare></NavSlot>
                        <NavSlot><NavSquare to="/poke-game" disabled={!user}>Poke&nbsp;Game</NavSquare></NavSlot>
                        {!user
                            ? <NavSlot><NavSquare to="/login">Login</NavSquare></NavSlot>
                            : <NavSlot><NavSquare to="/account">Twoje konto</NavSquare></NavSlot>}
                    </div>

                    {/* 5) Wyloguj skrajnie po prawej */}
                    <div className="flex items-center justify-end ">
                        {user ? (
                            <button
                                onClick={() => {
                                    logout();
                                    navigate("/home");
                                }}
                                title="Wyloguj się"
                                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-black bg-white shadow hover:scale-105 transition"
                            >
                                <FaSignOutAlt className="text-slate-800 text-2xl"/>
                            </button>
                        ) : (
                            // Placeholder utrzymujący układ
                            <div className="h-14 w-14" aria-hidden />
                        )}
                    </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden flex items-center justify-between h-16">
                    <button
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black bg-white shadow-sm"
                        onClick={() => setOpen((o) => !o)}
                        aria-label="Open menu"
                    >
                        <FaBars />
                    </button>

                    <Link to="/" className="h-full grid place-items-center">
                        <img src={Logo} alt="Logo" className="h-[90%] w-auto object-contain" />
                    </Link>

                    {user ? (
                        <button
                            onClick={() => {
                                logout();
                                navigate("/home");
                            }}
                            title="Wyloguj się"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black bg-white shadow-sm"
                        >
                            <FaSignOutAlt />
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            className="inline-flex h-10 px-4 items-center justify-center rounded-xl border border-black bg-white shadow-sm font-semibold"
                        >
                            Login
                        </Link>
                    )}
                </div>

                {open && (
                    <div className="md:hidden pb-4">
                        <nav className="grid grid-cols-2 gap-3">
                            <NavSquare to="/">Home</NavSquare>
                            <NavSquare to="/pokedex">Pokedex</NavSquare>
                            <NavSquare to="/album" disabled={!user}>
                                Album
                            </NavSquare>
                            <NavSquare to="/deck" disabled={!user}>
                                Deck
                            </NavSquare>
                            <NavSquare to="/poke-game" disabled={!user}>
                                Poke Game
                            </NavSquare>
                            {user && <NavSquare to="/account">Twoje konto</NavSquare>}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
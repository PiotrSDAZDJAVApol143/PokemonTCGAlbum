import {Link, useNavigate} from "react-router-dom";
import Logo from "../assets/Logo01.png";
import {FaSignOutAlt} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

// Lewy romb
function NavDiamondLeft({ to, label, disabled }) {
    return (
        <Link
            to={disabled ? "#" : to}
            tabIndex={disabled ? -1 : 0}
            className={`flex items-center justify-center w-40 h-16 bg-gradient-to-br from-blue-400 to-purple-600 text-white font-bold border-2 border-black shadow transition-all
                ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "hover:bg-purple-700"}
            `}
            style={{
                clipPath: "polygon(15% 0, 100% 0, 85% 100%, 0% 100%)",
                marginLeft: '10px',
                marginRight: '-18px',
                zIndex: 1
            }}
        >
            <span>{label}</span>
        </Link>
    );
}

// Prawy romb
function NavDiamondRight({ to, label, disabled }) {
    return (
        <Link
            to={disabled ? "#" : to}
            tabIndex={disabled ? -1 : 0}
            className={`flex items-center justify-center w-40 h-16 bg-gradient-to-br from-blue-400 to-purple-600 text-white font-bold border-2 border-black shadow transition-all
                ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "hover:bg-purple-700"}
            `}
            style={{
                clipPath: "polygon(100% 0, 100% 100%, 0 100%, 0 0)",
                marginLeft: '-14px',
                marginRight: '14px',
                zIndex: 1
            }}
        >
            <span className="block">{label}</span>
        </Link>
    );
}

export default function Navbar() {
    const { user, logout } = useAuth();     // <-- TO JEST WAŻNE!
    const navigate = useNavigate();
    return (
        <nav className="flex justify-center items-center w-full bg-white shadow" style={{ height: 81 }}>
            {/* Lewa część */}
            <div className="flex items-center">
                <NavDiamondLeft to="/" label="Home" />
                <NavDiamondLeft to="/pokedex" label="Pokedex" />
                <NavDiamondLeft to="/album" label="Album" disabled={!user} />
            </div>

            {/* Logo – wyższy z-index, by było nad przyciskami */}
            <div className="z-10 mx-[30px]">
                <img
                    src={Logo}
                    alt="Logo"
                    className="rounded-full border-1 border-gray-600 shadow bg-white"
                    style={{
                        width: 80,
                        height: 80,
                        objectFit: "contain",
                        position: 'relative',
                        top: 1
                    }}
                />
            </div>

            {/* Prawa część */}
            <div className="flex items-center">
                <NavDiamondRight to="/deck" label="Deck" disabled={!user} />
                <NavDiamondRight to="/poke-game" label="Poke Game" disabled={!user} />
                {!user ? (
                    <NavDiamondRight to="/login" label="Login" />
                ) : (
                    <>
                        <NavDiamondRight to="/account" label="Twoje konto" />
                        <button
                            onClick={() => { logout(); navigate("/home"); }}
                            className="ml-4 text-black text-2xl"
                            title="Wyloguj się"
                        >
                            <FaSignOutAlt />
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AlbumAllView from "./AlbumAllView";
import AlbumSetListView from "./AlbumSetListView";
import AlbumSetCardsView from "./AlbumSetCardsView";
import { useLocation, useNavigate } from "react-router-dom";
import AlbumUserAllView from "./AlbumUserAllView";
import AlbumUserSetListView from "./AlbumUserSetListView";
import AlbumUserSetCardsView from "./AlbumUserSetCardsView";

export default function Album() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Który widok?

    const [userSetCardsPage, setUserSetCardsPage] = useState(0);
    const [userSetCardsSearch, setUserSetCardsSearch] = useState("");

    const [step, setStep] = useState(null);
    const [selectedSet, setSelectedSet] = useState(null);

    const [setPageIdx, setSetPageIdx] = useState(0);
    const [setSearch, setSetSearch] = useState("");

    const [userAlbumPage, setUserAlbumPage] = useState(0);
    const [userAlbumSearch, setUserAlbumSearch] = useState("");

    // Do paginacji w AlbumAllView
    const [albumPage, setAlbumPage] = useState(0);
    const [albumSearch, setAlbumSearch] = useState("");

    function AlbumChoice({
                             title,
                             subtitle,
                             disabled = false,
                             onClick,
                             bg
                         }) {
        const [hover, setHover] = useState(false);

        // szybsze wybielanie przy wyjechaniu kursorem, wolniejsze “nabieranie kolorów”
        const duration = hover ? "duration-700" : "duration-150";
        return (
            <div
                className={`relative group flex-1 h-[60vh] rounded-2xl overflow-hidden shadow-xl
                  ring-1 ring-black/10`}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {/* TŁO */}
                <div
                    className={`absolute inset-0 bg-center bg-cover transition-all ${duration}
                    ${hover ? "grayscale-0 brightness-100 opacity-100"
                        : "grayscale brightness-125 opacity-70"}`}
                    style={{ backgroundImage: `url(${bg})` }}
                />

                {/* MGŁA / miękkie krawędzie (delikatna winieta + blend na środku) */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        boxShadow: "inset 0 0 140px 70px rgba(255,255,255,0.85)",
                    }}
                />
                {/* rozjaśnienie krawędzi wewnętrznych (żeby dwa panele się zlewały) */}
                <div
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
                    style={{
                        background:
                            "linear-gradient(to right, rgba(255,255,255,0.75), rgba(255,255,255,0))",
                    }}
                />
                <div
                    className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
                    style={{
                        background:
                            "linear-gradient(to left, rgba(255,255,255,0.75), rgba(255,255,255,0))",
                    }}
                />

                {/* TREŚĆ */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-2xl font-extrabold drop-shadow-sm text-gray-900">
                        {title}
                    </h2>

                    <button
                        className={`mt-4 px-10 py-3 rounded-xl text-lg font-bold transition
                      bg-white/90 hover:bg-white shadow
                      disabled:opacity-40 disabled:cursor-not-allowed`}
                        disabled={disabled}
                        onClick={onClick}
                    >
                        WYBIERZ
                    </button>

                    <div className="mt-3 font-semibold text-gray-800 drop-shadow-sm">
                        {subtitle}
                    </div>
                </div>
            </div>
        );
    }
        // Przechwytujemy stan przy powrocie z CardDetails
    useEffect(() => {
        // 1) RESET z Navbara ma priorytet
        if (location.state?.resetAlbum) {
            setStep(null);
            setSelectedSet(null);

            // opcjonalnie: reset paginacji/filtrów (zależy jak chcesz)
            setAlbumPage(0);
            setAlbumSearch("");
            setSetPageIdx(0);
            setSetSearch("");
            setUserAlbumPage(0);
            setUserAlbumSearch("");
            setUserSetCardsPage(0);
            setUserSetCardsSearch("");

            // wyczyść state, żeby reset nie odpalał się drugi raz
            navigate("/album", { replace: true, state: null });
            return;
        }

        // 2) POWRÓT z CardDetails (Twoja logika)
        const s = location.state?.step;
        if (!s) return;

        if (s === "set-cards") {
            setStep("set-cards");
            setSelectedSet(location.state.setId);
            setSetPageIdx(location.state.page ?? 0);
            setSetSearch(location.state.search ?? "");
        } else if (s === "all") {
            setStep("all");
            setAlbumPage(location.state.page ?? 0);
            setAlbumSearch(location.state.search ?? "");
        } else if (s === "user-all") {
            setStep("user-all");
            setUserAlbumPage(location.state.page ?? 0);
            setUserAlbumSearch(location.state.search ?? "");
        } else if (s === "user-set-cards") {
            setStep("user-set-cards");
            setSelectedSet(location.state.setId);
            setUserSetCardsPage(location.state.page ?? 0);
            setUserSetCardsSearch(location.state.search ?? "");
        }

        // opcjonalnie: wyczyść state po odtworzeniu widoku
        navigate("/album", { replace: true, state: null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);

    // Panel startowy (wybór przeglądu)
        if (!step) {
            return (
                <div className="px-10 py-12">
                    <div className="mx-auto max-w-40vh">
                        <div className="grid grid-cols-[1fr_2px_1fr] gap-8 items-stretch">

                            {/* LEWA KOLUMNA – wszystkie karty */}
                            <AlbumChoice
                                title="Wyświetl karty Pokemon TCG"
                                subtitle="Przeglądaj wszystkie oficjalne karty Pokemon"
                                bg="/album_all.png"            // <- wrzuć plik do /public
                                onClick={() => setStep("browse")}
                            />

                            {/* rozdzielacz */}
                            <div className="bg-gray-300 rounded-full" />

                            {/* PRAWA KOLUMNA – album użytkownika */}
                            <AlbumChoice
                                title="Wyświetl Twój Album Pokemon TCG"
                                subtitle="Podgląd Twojej kolekcji"
                                bg="/album_user.png"           // <- wrzuć plik do /public
                                disabled={!user}
                                onClick={() => user && setStep("user")}
                            />

                        </div>
                    </div>
                </div>
            );
        }

    // Przeglądanie — wybór typu przeglądu
    if (step === "browse") {
        return (
            <div className="flex flex-col items-center">
                <button className="mb-4 px-6 py-2 rounded bg-gray-200" onClick={() => setStep(null)}>← Powrót</button>
                <div className="flex gap-16 mt-10">
                    <div className="flex flex-col items-center">
                        <button className="border-2 rounded-lg px-10 py-6 font-bold text-xl hover:bg-gray-100 mb-2"
                                onClick={() => setStep("all")}>
                            Wyświetl wszystkie
                        </button>
                        <span>Wszystkie karty TCG</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button className="border-2 rounded-lg px-10 py-6 font-bold text-xl hover:bg-gray-100 mb-2"
                                onClick={() => setStep("sets")}>
                            Wyświetl karty serii
                        </button>
                        <span>Wg serii/setu</span>
                    </div>
                </div>
            </div>
        );
    }

    // Wszystkie karty — tu przekazujemy stan paginacji i filtru!
    if (step === "all") {
        return (
            <AlbumAllView
                goBack={() => setStep("browse")}
                page={albumPage}
                setPage={setAlbumPage}
                search={albumSearch}
                setSearch={setAlbumSearch}
            />
        );
    }

    // Przegląd po seriach — lista serii
    if (step === "sets") {
        return (
            <AlbumSetListView
                goBack={() => setStep("browse")}
                onSelectSet={(setId) => {
                    setSelectedSet(setId);
                    setStep("set-cards");
                }}
            />
        );
    }

    if (step === "set-cards") {
        return (
            <AlbumSetCardsView
                setId={selectedSet}
                goBack={() => setStep("sets")}
                page={setPageIdx}
                setPage={setSetPageIdx}
                search={setSearch}
                setSearch={setSetSearch}
            />
        );
    }

    // Widok albumu użytkownika
    if (step === "user") {
        // Panel wyboru dla Twojego Albumu
        return (
            <div className="flex flex-col items-center mt-10">
                <button className="mb-4 px-6 py-2 rounded bg-gray-200" onClick={() => setStep(null)}>← Powrót</button>
                <div className="flex gap-16">
                    <div className="flex flex-col items-center">
                        <button className="border-2 rounded-lg px-10 py-6 font-bold text-xl hover:bg-gray-100 mb-2"
                                onClick={() => setStep("user-all")}>
                            Wyświetl wszystkie Twoje karty
                        </button>
                        <span>Podgląd całej Twojej kolekcji</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button className="border-2 rounded-lg px-10 py-6 font-bold text-xl hover:bg-gray-100 mb-2"
                                onClick={() => setStep("user-sets")}>
                            Wyświetl wg serii/setu
                        </button>
                        <span>Twoje karty wg serii/setu</span>
                    </div>
                </div>
            </div>
        );
    }
    if (step === "user-all") {
        return (
            <AlbumUserAllView
                goBack={() => setStep("user")}
                page={userAlbumPage}
                setPage={setUserAlbumPage}
                search={userAlbumSearch}
                setSearch={setUserAlbumSearch}
            />
        );
    }
    if (step === "user-sets") {
        return (
            <AlbumUserSetListView
                goBack={() => setStep("user")}
                onSelectSet={(setId) => {
                    setSelectedSet(setId);
                    setStep("user-set-cards");
                }}
            />
        );
    }

    if (step === "user-set-cards") {
        return (
            <AlbumUserSetCardsView
                setId={selectedSet}
                goBack={() => setStep("user-sets")}
                page={userSetCardsPage}
                setPage={setUserSetCardsPage}
                search={userSetCardsSearch}
                setSearch={setUserSetCardsSearch}
            />
        );
    }
    return null;
}

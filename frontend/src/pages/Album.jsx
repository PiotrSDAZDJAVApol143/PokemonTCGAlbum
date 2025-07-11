import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AlbumAllView from "./AlbumAllView";
import AlbumSetListView from "./AlbumSetListView";
import AlbumSetCardsView from "./AlbumSetCardsView";
import AlbumUserView from "./AlbumUserView";
import { useLocation } from "react-router-dom";

export default function Album() {
    const { user } = useAuth();
    const location = useLocation();

    // Który widok?
    const [step, setStep] = useState(null);
    const [selectedSet, setSelectedSet] = useState(null);

    const [setPageIdx, setSetPageIdx] = useState(0);
    const [setSearch, setSetSearch] = useState("");

    // Do paginacji w AlbumAllView
    const [albumPage, setAlbumPage] = useState(0);
    const [albumSearch, setAlbumSearch] = useState("");

    // Przechwytujemy stan przy powrocie z CardDetails
    useEffect(() => {
        if (location.state?.step === "set-cards") {
            setStep("set-cards");
            setSelectedSet(location.state.setId);
            setSetPageIdx(location.state.page ?? 0);
            setSetSearch(location.state.search ?? "");
        }
        if (location.state?.step === "all") {
            setStep("all");
            setAlbumPage(location.state.page ?? 0);
            setAlbumSearch(location.state.search ?? "");
        }
    }, [location.state]);

    // Panel startowy (wybór przeglądu)
    if (!step) {
        return (
            <div className="flex justify-center gap-20 p-16">
                <div className="flex-1 flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-2">Wyświetl karty Pokemon TCG</h2>
                    <button className="border-2 rounded-[20px] px-16 py-4 text-xl font-bold hover:bg-gray-100 mb-2"
                            onClick={() => setStep("browse")}>
                        WYBIERZ
                    </button>
                    <span className="font-bold">Przeglądaj wszystkie oficjalne karty Pokemon</span>
                </div>
                <div className="w-[2px] bg-gray-400"></div>
                <div className="flex-1 flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-2">Wyświetl Twój Album Pokemon TCG</h2>
                    <button className="border-2 rounded-[20px] px-16 py-4 text-xl font-bold mb-2
                        disabled:opacity-40 disabled:cursor-not-allowed
                        hover:bg-gray-100"
                            disabled={!user}
                            onClick={() => user && setStep("user")}
                    >
                        WYBIERZ
                    </button>
                    <span className="font-bold">Podgląd Twojej kolekcji</span>
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
        return (
            <AlbumUserView
                goBack={() => setStep(null)}
            />
        );
    }

    // Fallback (nie powinien się wywołać)
    return null;
}

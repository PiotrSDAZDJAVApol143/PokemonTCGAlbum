// PokeGame.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDecks } from "../services/deckService.js";
import { useAutoDeckImage } from "../components/useAutoDeckImage";

const ARROW_SRC = "/slot_arrow.png"; // public/slot_arrow.png

// Wrzuć obrazki do public/status/*.png (albo zmień ścieżki)
const STATUS_IMG = {
    burned: "/status/burned.png",
    poisoned: "/status/poisoned.png",
    asleep: "/status/asleep.png",
    confused: "/status/confused.png",
    paralyzed: "/status/paralyzed.png",
};

function totalCardsInDeck(deck) {
    const cards = deck?.cards ?? [];
    return cards.reduce((sum, dc) => sum + (Number.isFinite(dc?.quantity) ? dc.quantity : 1), 0);
}

// Easing: szybki środek, wolny start/koniec
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function DeckImage({ deck, className }) {
    const { src, onError } = useAutoDeckImage(deck?.logoUrl, deck?.baseEnergy, deck?.secondaryEnergy);

    return <img src={src} onError={onError} alt={deck?.name ?? "deck"} className={className} draggable={false} />;
}

function ArrowImage({ side = "left" }) {
    const flip = side === "right" ? "scaleX(-1)" : "none";

    return (
        <div className="select-none flex items-center justify-center" style={{ transform: flip }} aria-hidden="true">
            <img src={ARROW_SRC} alt="" className="w-[90px] h-[90px] object-contain drop-shadow-sm" draggable={false} />
        </div>
    );
}

function RhombusPreview({ deck, variant = "top" }) {
    const skewDeg = variant === "top" ? -14 : 14;

    return (
        <div
            className="border-4 border-black bg-white overflow-hidden"
            style={{
                width: 180,
                height: 48,
                transform: `skewX(${skewDeg}deg)`,
                transformOrigin: "center",
                borderRadius: 6,
            }}
        >
            <div
                className="w-full h-full"
                style={{
                    transform: `skewX(${-skewDeg}deg)`,
                    transformOrigin: "center",
                }}
            >
                <DeckImage deck={deck} className="w-full h-full object-cover select-none" />
            </div>
        </div>
    );
}

/** ======== TREŚĆ: Special Conditions ======== */
function SpecialConditionsContent() {
    const Badge = ({ src, emoji, title, subtitle }) => (
        <div className="flex items-center gap-3 rounded-2xl border bg-white/80 backdrop-blur p-3 shadow-sm">
            <div className="w-14 h-14 rounded-xl border bg-white flex items-center justify-center overflow-hidden">
                {src ? (
                    <img src={src} alt={title} className="w-full h-full object-cover" draggable={false} />
                ) : (
                    <span className="text-2xl">{emoji}</span>
                )}
            </div>
            <div>
                <div className="text-lg font-extrabold leading-tight">{title}</div>
                <div className="text-sm text-gray-700">{subtitle}</div>
            </div>
        </div>
    );

    const Card = ({ emoji, img, title, children }) => (
        <div className="rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="text-2xl">{emoji}</span>
                <h3 className="text-xl font-extrabold">{title}</h3>
            </div>
            <div className="mt-3">{children}</div>
            {img ? (
                <div className="mt-4 flex justify-center">
                    <img
                        src={img}
                        alt={title}
                        className="w-[170px] h-[170px] object-contain drop-shadow"
                        draggable={false}
                    />
                </div>
            ) : null}
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="mb-5">
                <h2 className="text-3xl font-extrabold tracking-tight">
                    Specjalne kondycje <span className="text-base font-semibold text-gray-600">(Special Conditions)</span>
                </h2>

                <p className="mt-3 text-gray-800 leading-relaxed">
                    Niektóre ataki powodują u przeciwnika dodatkowe efekty:{" "}
                    <span className="font-semibold">Asleep</span> (uśpiony),{" "}
                    <span className="font-semibold">Confused</span> (oszołomiony),{" "}
                    <span className="font-semibold">Paralyzed</span> (sparaliżowany),{" "}
                    <span className="font-semibold">Poisoned</span> (otruty) lub{" "}
                    <span className="font-semibold">Burned</span> (podpalony). Te efekty nazywa się{" "}
                    <span className="font-semibold">Special Conditions</span>.
                </p>

                <div className="mt-4 rounded-2xl border bg-white/70 backdrop-blur px-4 py-3 text-sm text-gray-800">
                    <div className="font-extrabold mb-1">Najważniejsze zasady:</div>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            Special Conditions dotyczą <span className="font-semibold">tylko Aktywnego Pokemona</span> (nigdy Bencha).
                        </li>
                        <li>
                            <span className="font-semibold">Retreat</span> (wycofanie na Bench) zwykle <span className="font-semibold">leczy</span> Special Conditions.
                        </li>
                        <li>
                            <span className="font-semibold">Ewolucja</span> również zwykle <span className="font-semibold">zdejmuje</span> Special Conditions.
                        </li>
                    </ul>
                </div>

                {/* Szybkie kafle */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Badge
                        src={STATUS_IMG.burned}
                        emoji="🔥"
                        title="Burned (Podpalony)"
                        subtitle="Rzut monetą pomiędzy turami → przy tails 2 znaczniki obrażeń."
                    />
                    <Badge
                        src={STATUS_IMG.poisoned}
                        emoji="☠️"
                        title="Poisoned (Otruty)"
                        subtitle="Pomiędzy turami: 10 HP obrażeń."
                    />
                    <Badge
                        src={STATUS_IMG.asleep}
                        emoji="😴"
                        title="Asleep (Uśpiony)"
                        subtitle="Brak ataku i retreat; pomiędzy turami rzut monetą na pobudkę."
                    />
                    <Badge
                        src={STATUS_IMG.paralyzed}
                        emoji="⚡"
                        title="Paralyzed (Sparaliżowany)"
                        subtitle="Brak ataku i retreat; trwa dokładnie 1 turę."
                    />
                    <div className="md:col-span-2">
                        <Badge
                            src={STATUS_IMG.confused}
                            emoji="😵‍💫"
                            title="Confused (Dezorientacja)"
                            subtitle="Przed atakiem rzut monetą; przy tails Pokémon rani siebie (3 znaczniki obrażeń)."
                        />
                    </div>
                </div>
            </div>

            {/* Szczegóły */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card emoji="😴" img={STATUS_IMG.asleep} title="Asleep (uśpienie)">
                    <p className="text-gray-800 leading-relaxed">
                        Jeśli Pokémon jest <span className="font-semibold">uśpiony</span>, to{" "}
                        <span className="font-semibold">nie może ani atakować, ani się retreatować</span>.
                    </p>
                    <div className="mt-3 rounded-xl bg-gray-50 border px-3 py-2 text-sm text-gray-800">
                        <div className="font-bold mb-1">Pomiędzy turami:</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Właściciel śpiącego Pokemona rzuca monetą.</li>
                            <li>
                                <span className="font-semibold">Heads</span> → Pokémon się budzi.
                            </li>
                            <li>
                                <span className="font-semibold">Tails</span> → pozostaje uśpiony.
                            </li>
                        </ul>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                        <span className="font-semibold">Oznaczanie:</span> obrót karty Pokemona <span className="font-semibold">w lewo</span>.
                    </div>
                </Card>

                <Card emoji="😵‍💫" img={STATUS_IMG.confused} title="Confused (dezorientacja)">
                    <p className="text-gray-800 leading-relaxed">
                        Dezorientacja utrudnia wykonywanie ataków —{" "}
                        <span className="font-semibold">rzucasz monetą tuż przed atakiem</span>.
                    </p>
                    <div className="mt-3 rounded-xl bg-gray-50 border px-3 py-2 text-sm text-gray-800">
                        <div className="font-bold mb-1">Tuż przed atakiem:</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                <span className="font-semibold">Heads</span> → atak wykonuje się normalnie.
                            </li>
                            <li>
                                <span className="font-semibold">Tails</span> → atak nie wychodzi; Pokémon{" "}
                                <span className="font-semibold">rani sam siebie</span> (nałóż{" "}
                                <span className="font-semibold">3 znaczniki obrażeń</span>).
                            </li>
                        </ul>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                        <span className="font-semibold">Oznaczanie:</span> odwrócenie karty Pokemona <span className="font-semibold">do góry nogami</span>.
                    </div>
                </Card>

                <Card emoji="⚡" img={STATUS_IMG.paralyzed} title="Paralyzed (paraliż)">
                    <p className="text-gray-800 leading-relaxed">
                        Paraliż uniemożliwia <span className="font-semibold">atak</span> i <span className="font-semibold">retreat</span>.
                    </p>
                    <div className="mt-3 rounded-xl bg-gray-50 border px-3 py-2 text-sm text-gray-800">
                        <span className="font-semibold">Czas trwania:</span> dokładnie{" "}
                        <span className="font-semibold">jedną turę</span> (ustępuje tuż po jej zakończeniu).
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                        <span className="font-semibold">Oznaczanie:</span> obrót karty Pokemona <span className="font-semibold">w prawo</span>.
                    </div>
                </Card>

                <Card emoji="☠️" img={STATUS_IMG.poisoned} title="Poisoned (otruty)">
                    <p className="text-gray-800 leading-relaxed">
                        Otrute Pokemony tracą <span className="font-semibold">10 HP pomiędzy turami</span>.
                    </p>
                    <div className="mt-3 rounded-xl bg-gray-50 border px-3 py-2 text-sm text-gray-800">
                        <span className="font-semibold">Oznaczanie:</span> nałóż <span className="font-semibold">znacznik otrucia</span>.
                    </div>
                </Card>

                <div className="md:col-span-2">
                    <Card emoji="🔥" img={STATUS_IMG.burned} title="Burned (podpalenie)">
                        <p className="text-gray-800 leading-relaxed">
                            Burned działa podobnie do otrucia (obrażenia pomiędzy turami), ale zawiera dodatkowy rzut monetą.
                        </p>
                        <div className="mt-3 rounded-xl bg-gray-50 border px-3 py-2 text-sm text-gray-800">
                            <div className="font-bold mb-1">Pomiędzy turami:</div>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Właściciel podpalonego Pokemona rzuca monetą.</li>
                                <li>
                                    Jeśli wypadnie <span className="font-semibold">tails</span> → nałóż{" "}
                                    <span className="font-semibold">2 znaczniki obrażeń</span>.
                                </li>
                            </ul>
                        </div>
                        <div className="mt-3 text-sm text-gray-700">
                            <span className="font-semibold">Oznaczanie:</span> nałóż <span className="font-semibold">znacznik podpalenia</span>.
                        </div>
                    </Card>
                </div>
            </div>

            {/* Leczenie */}
            <div className="mt-6 rounded-2xl border bg-white/80 backdrop-blur p-5">
                <h3 className="text-2xl font-extrabold">Jak wyleczyć Pokémona ze specjalnych kondycji</h3>

                <p className="mt-2 text-gray-800 leading-relaxed">
                    Niektóre kondycje leczą się same (<span className="font-semibold">uśpienie</span> i{" "}
                    <span className="font-semibold">paraliż</span>), pozostałe mogą trwać długo. Najważniejsze metody leczenia:
                </p>

                <ul className="mt-3 list-disc pl-6 space-y-2 text-gray-800">
                    <li>
                        <span className="font-semibold">Retreat</span> – umieszczenie Pokemona na Benchu leczy go ze Special Conditions i innych efektów ataku.
                    </li>
                    <li>
                        <span className="font-semibold">Ewolucja</span> – działa podobnie (zwykle usuwa Special Conditions).
                    </li>
                    <li>
                        <span className="font-semibold">Trenery / Energie</span> – karty leczące (np. <span className="font-semibold">Life Herb</span>, <span className="font-semibold">Full Heal Energy</span>).
                    </li>
                    <li>
                        <span className="font-semibold">Poke-Body / ataki</span> – niektóre Pokemony mogą wyleczyć się same.
                    </li>
                </ul>
            </div>

            {/* Stackowanie */}
            <div className="mt-4 rounded-2xl border bg-white/80 backdrop-blur p-5">
                <h3 className="text-2xl font-extrabold">Czy Pokémon może mieć kilka Special Conditions?</h3>
                <p className="mt-2 text-gray-800 leading-relaxed">
                    Tak, ale z ograniczeniem: <span className="font-semibold">Asleep</span>,{" "}
                    <span className="font-semibold">Confused</span> i <span className="font-semibold">Paralyzed</span>{" "}
                    <span className="font-semibold">wykluczają się wzajemnie</span>. Natomiast Pokémon może być np.{" "}
                    <span className="font-semibold">uśpiony</span> i jednocześnie{" "}
                    <span className="font-semibold">otruty</span> oraz <span className="font-semibold">podpalony</span>
                    (bo to są znaczniki).
                </p>

                <div className="mt-3 text-sm text-gray-700">
                    <span className="font-semibold">Ściąga:</span> obrót karty = sleep/confuse/paralyze (tylko jedno), znaczniki = poison/burn (mogą się łączyć).
                </div>
            </div>
        </div>
    );
}

export default function PokeGame() {
    // null | "single" | "hot"
    const [mode, setMode] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * rulesView:
     * - "menu"      -> ekran wyboru trybu (kafle single/hot)
     * - "rulesMenu" -> menu tematów zasad
     * - "rulesTopic"-> ekran konkretnego tematu
     */
    const [rulesView, setRulesView] = useState("menu");
    const [rulesTopic, setRulesTopic] = useState(null); // string | null

    const [decks, setDecks] = useState([]);
    const [loadingDecks, setLoadingDecks] = useState(true);
    const [deckLoadError, setDeckLoadError] = useState("");

    // indeks "środkowej" talii
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [resultIndex, setResultIndex] = useState(null);

    // refs do animacji
    const rafRef = useRef(null);
    const startTimeRef = useRef(0);
    const lastStepRef = useRef(-1);

    useEffect(() => {
        if (location.state?.reopenSinglePlayer) {
            setMode("single");
        }
    }, [location.state?.reopenSinglePlayer]);

    useEffect(() => {
        let cancelled = false;

        setLoadingDecks(true);
        setDeckLoadError("");

        getDecks()
            .then((loadedDecks) => {
                if (cancelled) return;

                setDecks(Array.isArray(loadedDecks) ? loadedDecks : []);
            })
            .catch((e) => {
                if (cancelled) return;

                setDecks([]);
                setDeckLoadError(
                    e?.response?.data?.message ||
                    e?.response?.data ||
                    e?.message ||
                    "Nie udało się wczytać talii."
                );
            })
            .finally(() => {
                if (cancelled) return;
                setLoadingDecks(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // tylko talie z dokładnie 60 kart
    const eligibleDecks = useMemo(() => (decks || []).filter((d) => totalCardsInDeck(d) === 60), [decks]);
    const isOfflineDeckSource = useMemo(
        () => (decks || []).some((deck) => deck?.offlineSnapshot),
        [decks]
    );
    useEffect(() => {
        const n = eligibleDecks.length;

        if (n === 0) {
            setCurrentIndex(0);
            setResultIndex(null);
            return;
        }

        setCurrentIndex((idx) => {
            if (idx < 0) return 0;
            if (idx >= n) return n - 1;
            return idx;
        });
    }, [eligibleDecks.length]);

    // bezpieczne indeksy prev/next
    const prevIndex = useMemo(() => {
        const n = eligibleDecks.length;
        if (n === 0) return 0;
        return (currentIndex - 1 + n) % n;
    }, [eligibleDecks.length, currentIndex]);

    const nextIndex = useMemo(() => {
        const n = eligibleDecks.length;
        if (n === 0) return 0;
        return (currentIndex + 1) % n;
    }, [eligibleDecks.length, currentIndex]);

    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const startSpin = () => {
        const n = eligibleDecks.length;
        if (n === 0) return;
        if (isSpinning) return;

        setIsSpinning(true);
        setResultIndex(null);

        const target = Math.floor(Math.random() * n);
        const cycles = 7 + Math.floor(Math.random() * 4); // 7..10
        const delta = (target - currentIndex + n) % n;
        const totalSteps = cycles * n + delta;

        const durationMs = 4000;

        startTimeRef.current = performance.now();
        lastStepRef.current = -1;

        const startIdx = currentIndex;

        const tick = (now) => {
            const elapsed = now - startTimeRef.current;
            const t = Math.min(1, elapsed / durationMs);
            const eased = easeInOutCubic(t);

            const step = Math.floor(eased * totalSteps);

            if (step !== lastStepRef.current) {
                lastStepRef.current = step;
                const idx = (startIdx + step) % n;
                setCurrentIndex(idx);
            }

            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setCurrentIndex(target);
                setResultIndex(target);
                setIsSpinning(false);
            }
        };

        rafRef.current = requestAnimationFrame(tick);
    };

    const bgStyle = {
        backgroundImage: "url('/tlo.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
    };

    // ====== EKRAN: menu tematów zasad ======
    if (rulesView === "rulesMenu") {
        const items = [
            { key: "deal", title: "Zasady Rozdania", desc: "Setup gry: prize cards, starting hand, active/bench." },
            { key: "evolution", title: "Zasady Ewolucji", desc: "Kiedy można ewoluować, ograniczenia, Stage 1/2." },
            { key: "special", title: "Zasady Special Conditions", desc: "Poison/Burn/Sleep/Paralyze/Confuse." },
            { key: "attacksEnergy", title: "Zasady Ataków i Energii", desc: "Koszty energii, przydział 1/turowo, retreat." },
            { key: "prizesWin", title: "Nagrody i Warunki Wygranej", desc: "Prize cards, deck-out, brak Pokémonów w grze." },
        ];

        return (
            <div className="min-h-[90vh] w-full flex items-center justify-center" style={bgStyle}>
                <div className="w-full max-w-[980px] p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-3xl font-extrabold">Zasady Gry Pokémon TCG</div>
                        <button
                            type="button"
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                            onClick={() => setRulesView("menu")}
                        >
                            ← Wróć
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {items.map((it) => (
                            <button
                                key={it.key}
                                type="button"
                                className="rounded-2xl border bg-white/85 backdrop-blur-md shadow hover:shadow-md transition p-6 text-left"
                                onClick={() => {
                                    setRulesTopic(it.key);
                                    setRulesView("rulesTopic");
                                }}
                            >
                                <div className="text-xl font-bold mb-2">{it.title}</div>
                                <div className="text-sm text-gray-600">{it.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ====== EKRAN: konkretny temat zasad ======
    if (rulesView === "rulesTopic") {
        const titleMap = {
            deal: "Zasady Rozdania",
            evolution: "Zasady Ewolucji",
            special: "Zasady Special Conditions",
            attacksEnergy: "Zasady Ataków i Energii",
            prizesWin: "Nagrody i Warunki Wygranej",
        };

        const title = titleMap[rulesTopic] ?? "Zasady";

        return (
            <div className="min-h-[90vh] w-full flex items-center justify-center p-6" style={bgStyle}>
                <div className="w-full max-w-[1100px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-2xl font-extrabold">{title}</div>
                        <button
                            type="button"
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                            onClick={() => setRulesView("rulesMenu")}
                        >
                            ← Wróć
                        </button>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md border rounded-2xl shadow p-6">
                        {rulesTopic === "special" ? (
                            <SpecialConditionsContent />
                        ) : (
                            <div className="text-gray-800">
                                <div className="text-lg font-bold mb-2">Treść w przygotowaniu</div>
                                <div className="text-sm text-gray-700 leading-relaxed">
                                    Ten ekran jest gotowy – możesz tu wkleić treści dla: <span className="font-semibold">{title}</span>.
                                    <br />
                                    Jeśli chcesz, przygotuję Ci analogicznie wystylizowane zasady dla pozostałych tematów.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ====== UI: wybór trybu ======
    if (mode == null) {
        return (
            <div className="min-h-[90vh] w-full flex items-center justify-center" style={bgStyle}>
                <div className="w-full max-w-[900px] p-8">
                    <div className="text-3xl font-extrabold mb-6">PokeGame</div>

                    <div className="grid grid-cols-2 gap-6">
                        <button
                            type="button"
                            className="rounded-2xl border bg-white shadow hover:shadow-md transition p-6 text-left"
                            onClick={() => setMode("single")}
                        >
                            <div className="text-xl font-bold mb-2">Single-player</div>
                            <div className="text-sm text-gray-600">
                                Losowanie talii do gry z talii gotowych (dokładnie 60 kart).
                            </div>
                        </button>

                        <button
                            type="button"
                            className="rounded-2xl border bg-white/60 text-gray-400 cursor-not-allowed p-6 text-left"
                            disabled
                            title="W przyszłości"
                        >
                            <div className="text-xl font-bold mb-2">Hot-Seats</div>
                            <div className="text-sm">Tryb w przygotowaniu.</div>
                        </button>
                    </div>

                    {/* NOWY: przycisk na dole, na środku */}
                    <div className="mt-10 flex justify-center">
                        <button
                            type="button"
                            className="px-8 py-3 rounded-2xl border-4 border-black font-bold text-lg bg-white hover:bg-gray-50 shadow"
                            onClick={() => setRulesView("rulesMenu")}
                        >
                            Zasady Gry Pokemon TCG
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    const selectedDeck = eligibleDecks[currentIndex] ?? null;
    const canOpenDeckViewer = !isSpinning && resultIndex != null && selectedDeck?.id;

    const openDeckViewer = () => {
        if (!canOpenDeckViewer) return;

        navigate(`/poke-game/deck/${selectedDeck.id}`, {
            state: {
                from: "poke-game-single",
                selectedDeckId: selectedDeck.id,
            },
        });
    };
    // ====== UI: Single-player roulette ======
    return (
        <div className="min-h-[90vh] w-full flex items-center justify-center p-6" style={bgStyle}>
            <div className="w-full max-w-[820px]">
                <div className="flex items-center justify-between mb-6">
                    <div className="text-2xl font-extrabold">Single-player</div>
                    <button
                        type="button"
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                        onClick={() => setMode(null)}
                        disabled={isSpinning}
                        title={isSpinning ? "Poczekaj aż animacja się skończy" : "Wróć"}
                    >
                        ← Wróć
                    </button>
                </div>

                <div className="bg-white/70 backdrop-blur-md border rounded-2xl shadow p-6">
                    {isOfflineDeckSource && (
                        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 font-semibold">
                            Tryb offline: talie zostały wczytane z lokalnego snapshotu.
                            Możesz losować talię i otworzyć podgląd, ale edycja oraz zapis wyników wymagają backendu.
                        </div>
                    )}

                    {deckLoadError && (
                        <div className="mb-4 rounded-2xl border border-red-300 bg-red-50/90 px-4 py-3 text-sm text-red-800 font-semibold">
                            {deckLoadError}
                        </div>
                    )}
                    <div className="flex justify-center mb-5">
                        <button
                            type="button"
                            className="px-8 py-3 rounded-2xl border-4 border-black font-bold text-lg bg-white hover:bg-gray-50 disabled:opacity-50"
                            onClick={startSpin}
                            disabled={loadingDecks || isSpinning || eligibleDecks.length === 0}
                        >
                            Losuj talię do gry
                        </button>
                    </div>

                    {loadingDecks && <div className="text-center text-gray-700 mb-4">Ładowanie talii…</div>}
                    {!loadingDecks && eligibleDecks.length === 0 && (
                        <div className="text-center text-red-700 mb-4">
                            Brak talii gotowych do gry. Stwórz talię z dokładnie 60 kart.
                        </div>
                    )}

                    {eligibleDecks.length > 0 && (
                        <div className="flex items-center justify-center gap-6">
                            <ArrowImage side="left" />

                            <div className="flex flex-col items-center">
                                <div className="mb-2">
                                    <RhombusPreview deck={eligibleDecks[nextIndex]} variant="top" />
                                </div>

                                <div
                                    className="w-[260px] h-[260px] border-4 border-black bg-white flex items-center justify-center rounded-md overflow-hidden shadow-[0_14px_32px_rgba(0,0,0,.18)]">
                                    {canOpenDeckViewer ? (
                                        <button
                                            type="button"
                                            onClick={openDeckViewer}
                                            className="w-full h-full block cursor-pointer"
                                            title="Otwórz podgląd talii"
                                        >
                                            <DeckImage
                                                deck={eligibleDecks[currentIndex]}
                                                className="w-full h-full object-cover transition-transform hover:scale-[1.03]"
                                            />
                                        </button>
                                    ) : (
                                        <DeckImage
                                            deck={eligibleDecks[currentIndex]}
                                            className={`w-full h-full object-cover transition-transform ${
                                                isSpinning ? "scale-[1.02]" : "scale-100"
                                            }`}
                                        />
                                    )}
                                </div>

                                <div className="mt-2">
                                    <RhombusPreview deck={eligibleDecks[prevIndex]} variant="bottom"/>
                                </div>
                            </div>

                            <ArrowImage side="right"/>
                        </div>
                    )}

                    {eligibleDecks.length > 0 && (
                        <div className="mt-6 flex justify-center">
                            <div
                                className="w-full max-w-[520px] border-4 border-black rounded-[28px] px-6 py-3 text-center bg-white">
                                <div className="text-sm text-gray-600 mb-1">
                                    {isSpinning ? "Losowanie trwa…" : resultIndex != null ? "Wylosowano:" : "Gotowy do losowania"}
                                </div>
                                {selectedDeck?.offlineSnapshot && (
                                    <div className="text-xs text-amber-700 font-bold mb-1">
                                        Snapshot offline / read-only
                                    </div>
                                )}

                                {canOpenDeckViewer ? (
                                    <button
                                        type="button"
                                        onClick={openDeckViewer}
                                        className="text-xl font-extrabold hover:underline"
                                        title="Otwórz podgląd talii"
                                    >
                                        {eligibleDecks[currentIndex]?.name ?? "-"}
                                    </button>
                                ) : (
                                    <div className="text-xl font-extrabold">
                                        {eligibleDecks[currentIndex]?.name ?? "-"}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {eligibleDecks.length > 0 && (
                        <div className="mt-4 text-center text-xs text-gray-700">
                            Losowanie trwa 4 sekundy (rozpędzenie → szybki obrót → wyhamowanie → stop).
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
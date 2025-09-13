import { useEffect, useMemo, useState } from "react";

const BASE_PATH = "/deck_logos";

function norm(e) {
    if (!e) return "";
    return e
        .trim()
        .replace(/\s+/g, "")     // usuń spacje
        .replace(/[^A-Za-z]/g, "") // tylko litery
        .replace(/^./, c => c.toUpperCase()); // Fire, Water...
}

export function useAutoDeckImage(logoUrl, baseEnergy, secondaryEnergy) {
    const candidates = useMemo(() => {
        const e1 = norm(baseEnergy);
        const e2 = norm(secondaryEnergy);

        const list = [];

        // 1) duo (obie kolejności)
        if (e1 && e2) {
            list.push(`${BASE_PATH}/${e1}-${e2}.jpg`);
            list.push(`${BASE_PATH}/${e2}-${e1}.jpg`);
        }
        // 2) single
        if (e1) list.push(`${BASE_PATH}/${e1}.jpg`);
        if (e2) list.push(`${BASE_PATH}/${e2}.jpg`);

        // 3) to co deck ma zapisane
        if (logoUrl) list.push(logoUrl);

        // 4) fallback
        list.push("/deck_default.png");

        return Array.from(new Set(list)); // usuń duplikaty, zachowaj kolejność
    }, [logoUrl, baseEnergy, secondaryEnergy]);

    const [idx, setIdx] = useState(0);
    const [resolved, setResolved] = useState(candidates[0] || "/deck_default.png");

    useEffect(() => {
        setIdx(0);
        setResolved(candidates[0] || "/deck_default.png");
    }, [candidates]);

    const onError = () => {
        setIdx(i => {
            const next = i + 1;
            if (next < candidates.length) {
                setResolved(candidates[next]);
                return next;
            }
            return i;
        });
    };

    return { src: resolved, onError };
}
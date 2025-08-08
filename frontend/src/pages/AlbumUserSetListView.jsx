import {useState, useEffect} from "react";
import api from "../api";
import {useNavigate} from "react-router-dom";

export default function AlbumUserSetListView({goBack, onSelectSet}) {
    const [sets, setSets] = useState([]);

    useEffect(() => {
        api.get("/user-cards/sets",).then(res => setSets(res.data));
    }, []);


        return (
            <div>
                <button className="mb-4 px-6 py-2 rounded bg-gray-200" onClick={goBack}>← Powrót</button>
                <div className="text-3xl font-bold mb-8">Wybierz serię/set spośród swoich kart</div>
                <div className="grid grid-cols-5 gap-4">
                    {sets.map(set => (
                        <div
                            key={set.id}
                            className="flex flex-col items-center cursor-pointer hover:bg-gray-100 rounded-lg p-3"
                            onClick={() => onSelectSet(set.id)}
                        >
                            <img src={set.logoUrl} alt={set.name} className="h-16 mb-2"/>
                            <span className="font-bold text-xs">{set.name}</span>
                            <span className="text-xs text-gray-500">{set.series}</span>
                            <span className="mt-2 text-sm text-indigo-800 font-bold">
    {set.unlocked ?? "0"} / {set.total ?? "?"}
</span>
                        </div>
                    ))}
                </div>
            </div>
        );
}

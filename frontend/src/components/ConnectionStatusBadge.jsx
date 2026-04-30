import { useAuth } from "../context/AuthContext.jsx";

export default function ConnectionStatusBadge() {
    const { isOnline, backendUnavailable, offlineAuthMode } = useAuth();

    if (!isOnline) {
        return (
            <div className="px-3 py-2 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-bold shadow">
                OFFLINE
            </div>
        );
    }

    if (backendUnavailable || offlineAuthMode) {
        return (
            <div className="px-3 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shadow">
                BACKEND OFF
            </div>
        );
    }

    return (
        <div className="px-3 py-2 rounded-xl bg-green-100 border border-green-300 text-green-800 text-xs font-bold shadow">
            ONLINE
        </div>
    );
}
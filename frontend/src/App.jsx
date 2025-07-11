//src/App.jsx
import Navbar from './components/Navbar'
import { Outlet } from "react-router-dom"

export default function App() {
    return (
        <>
            <Navbar />
            <main className="p-8 bg-gray-100 min-h-screen">
                <Outlet />
            </main>
        </>
    );
}

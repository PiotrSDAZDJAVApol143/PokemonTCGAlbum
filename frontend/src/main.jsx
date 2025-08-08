// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import Pokedex from "./pages/Pokedex";
import Album from "./pages/Album";
import Deck from "./pages/Deck";
import PokeGame from "./pages/PokeGame";
import Login from "./pages/Login";
import "./index.css";
import {AuthProvider} from "./context/AuthContext.jsx";
import CardDetails from './pages/CardDetails';
import AlbumUserSetListView from "./pages/AlbumUserSetListView.jsx";
import AlbumUserSetCardsView from "./pages/AlbumUserSetCardsView.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <AuthProvider>
            <Routes>
                <Route path="/" element={<App/>}>
                    <Route index element={<Home/>}/>
                    <Route path="home" element={<Home/>}/>
                    <Route path="pokedex" element={<Pokedex/>}/>
                    <Route path="album" element={<Album/>}/>
                    <Route path="/album" element={<AlbumUserSetListView />} />
                    <Route path="/album/sets/:setId" element={<AlbumUserSetCardsView />} />
                    <Route path="/card/:cardId" element={<CardDetails />} />
                    <Route path="deck" element={<Deck/>}/>
                    <Route path="poke-game" element={<PokeGame/>}/>
                    <Route path="login" element={<Login/>}/>
                </Route>
            </Routes>
        </AuthProvider>
    </BrowserRouter>
);
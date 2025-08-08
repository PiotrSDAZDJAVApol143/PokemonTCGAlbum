import api from "./api";
export const getDecks = () => api.get("/user-decks/").then(res => res.data);

export const createDeck = (data) => api.post("/user-decks/", data).then(res => res.data);

export const updateDeck = (deckId, data) => api.put(`/user-decks/${deckId}`, data).then(res => res.data);

export const deleteDeck = (deckId) => api.delete(`/user-decks/${deckId}`);
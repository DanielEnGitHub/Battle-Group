// El hostname del browser se usa como host del servidor.
// Así funciona tanto en localhost como en LAN (el celular apunta al mismo host).
const hostname = window.location.hostname;

export const API_URL = `http://${hostname}:3001/api`;

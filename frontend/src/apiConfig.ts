const getHost = () => (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
const getProtocol = () => (typeof window !== 'undefined' ? window.location.protocol : 'http:');

export const API_BASE = (getProtocol() === 'https:' && typeof window !== 'undefined')
  ? `${window.location.origin}/digital-twin-api/api`
  : `http://${getHost()}:3001/api`;

export const SOCKET_BASE = (getProtocol() === 'https:' && typeof window !== 'undefined')
  ? `${window.location.origin}`
  : `http://${getHost()}:3001`;

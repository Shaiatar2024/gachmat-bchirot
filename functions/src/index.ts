import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { setUserRole } from './callables/setUserRole.js';
export { submitBet } from './callables/submitBet.js';
export { computeScores } from './callables/computeScores.js';

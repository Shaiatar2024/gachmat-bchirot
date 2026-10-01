import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();
// Match the Firestore database's region (me-west1 / Tel Aviv) so every
// callable and trigger runs next to the data instead of defaulting to the US.
setGlobalOptions({ region: 'me-west1' });

export { setUserRole } from './callables/setUserRole.js';
export { submitBet } from './callables/submitBet.js';
export { computeScores } from './callables/computeScores.js';

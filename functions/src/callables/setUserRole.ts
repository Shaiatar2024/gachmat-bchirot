import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';

/**
 * Admin-only: grants/revokes the `admin` custom claim. Same shape as
 * nfl-betting-pool's setUserRole — one deliberately narrow callable so the
 * admin claim is never settable by a plain Firestore write.
 */
export const setUserRole = onCall<{ uid: string; admin: boolean }>(async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin only.');
  }
  const { uid, admin } = request.data;
  if (!uid || typeof admin !== 'boolean') {
    throw new HttpsError('invalid-argument', 'uid and admin are required.');
  }
  await getAuth().setCustomUserClaims(uid, { admin });
  return { uid, admin };
});


import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

class AuthService {
  // Login with Firebase Auth
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()

      // Keep the Firestore profile's email in sync with Firebase Auth (see
      // _syncProfileEmail below for why this is needed).
      await this._syncProfileEmail(user, userData)

      return {
        token: await user.getIdToken(),
        user: {
          id: user.uid,
          email: user.email,
         fullName: userData?.fullName || '',
          phone: userData?.phone || '',
          role: userData?.role || '',
          purok: userData?.purok || '',
          photoURL: userData?.photoURL || '',
          createdAt: userData?.createdAt || new Date().toISOString()
        }
      }
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Register with Firebase Auth + Firestore
  async register(userData) {
    // TERMS & CONDITIONS: defense-in-depth check, mirroring RegisterPage's
    // own validation. This runs BEFORE createUserWithEmailAndPassword so a
    // Firebase Auth account is never created without terms acceptance —
    // preventing the "account created but Firestore profile rejected"
    // partial-account problem entirely, rather than trying to clean it up
    // after the fact.
    if (userData.termsAccepted !== true) {
      throw new Error('Please agree to the Terms & Conditions before creating your account.')
    }

    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      )
      const user = userCredential.user

      // Update display name
      await updateProfile(user, {
        displayName: userData.fullName
      })

      // Save additional data to Firestore
      // SECURITY: role is always forced to 'resident' at registration, even
      // if a caller passes something else. Elevated roles (Barangay Official /
      // BHW) can only be granted by an admin approving a Role Upgrade Request
      // — see roleUpgradeService.approveRequest().
      const userDataToSave = {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: 'resident',
        purok: userData.purok,
        createdAt: new Date().toISOString(),
        // Terms acceptance record (Step 8 — Terms & Conditions). Simple,
        // non-sensitive fields stored on the existing user profile document
        // rather than a new collection.
        termsAccepted: true,
        termsVersion: userData.termsVersion || '1.0',
        termsAcceptedAt: serverTimestamp()
      }

      await setDoc(doc(db, 'users', user.uid), userDataToSave)

      // NOTE: return the client-side createdAt, not the serverTimestamp()
      // sentinel used for the Firestore write (it isn't a plain usable
      // value until the write resolves server-side).
      return { 
        success: true, 
        user: {
          id: user.uid,
          ...userDataToSave,
          termsAcceptedAt: userDataToSave.createdAt
        }
      }
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      throw new Error('Failed to logout')
    }
  }

  // Get current user
  async getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe()
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            const userData = userDoc.data()

            // Keep the Firestore profile's email in sync with Firebase Auth
            // (see _syncProfileEmail below for why this is needed).
            await this._syncProfileEmail(user, userData)

            resolve({
              id: user.uid,
              email: user.email,
              fullName: userData?.fullName || '',
              phone: userData?.phone || '',
              role: userData?.role || '',
              purok: userData?.purok || '',
              photoURL: userData?.photoURL || '',
              createdAt: userData?.createdAt || new Date().toISOString()
            })
          } catch (error) {
            console.error('Error fetching user data:', error)
            resolve(null)
          }
        } else {
          resolve(null)
        }
      }, reject)
    })
  }

  // Check if authenticated
  isAuthenticated() {
    return !!auth.currentUser
  }

  // Update profile
  async updateProfile(userId, updates) {
    try {
      // SECURITY: role/status/review fields must never be settable through a
      // generic profile edit — that was effectively a self role-escalation
      // hole. Role changes only happen via the Role Upgrade Request approval
      // flow (see roleUpgradeService.approveRequest()).
      const { role: _role, status: _status, ...safeUpdates } = updates

      await updateDoc(doc(db, 'users', userId), safeUpdates)

      // Update display name in auth if fullName changed
      if (safeUpdates.fullName && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: safeUpdates.fullName
        })
      }

      return { success: true, user: safeUpdates }
    } catch (error) {
      throw new Error('Failed to update profile')
    }
  }

  // ✅ STEP 9 (Account Recovery — Change Email): Firebase Authentication is
  // the source of truth for the user's email. When a Change Email request
  // uses verifyBeforeUpdateEmail() below, Firebase does NOT update
  // auth.currentUser.email immediately — it only updates it once the user
  // opens the verification link sent to the new address. That means our
  // Firestore users/{uid}.email field can silently fall out of sync with
  // Firebase Auth for a while (or forever, if this tab never reloads).
  // This helper reconciles them: it runs every time we read the current
  // user (login + getCurrentUser), and if Firebase Auth's email differs
  // from the Firestore profile's email, it updates Firestore to match
  // Firebase Auth — never the other way around.
  async _syncProfileEmail(firebaseUser, userData) {
    if (!userData || !firebaseUser?.email) return
    if (userData.email === firebaseUser.email) return
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { email: firebaseUser.email })
      userData.email = firebaseUser.email
    } catch (error) {
      // Non-fatal — worst case the Firestore profile email is stale until
      // the next successful sync attempt. Firebase Auth itself (used for
      // actual login) is unaffected.
      console.error('Error syncing profile email:', error)
    }
  }

  // Change email (Step 9 — Account Recovery & Email Change)
  // Sensitive account operation, so this always re-authenticates the user
  // first, then sends a verification link to the NEW email address rather
  // than updating it immediately. The change is not final — and the
  // Firestore profile is not touched — until the user clicks that link.
  async changeEmail(currentPassword, newEmail) {
    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('The password you entered is incorrect.')
      }
      throw new Error(this.getErrorMessage(error.code))
    }

    try {
      await verifyBeforeUpdateEmail(user, newEmail)
      return { success: true }
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('User not authenticated')
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      
      // Re-authenticate
      await reauthenticateWithCredential(user, credential)
      
      // Update password
      await updatePassword(user, newPassword)
      return { success: true }
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect')
      }
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Helper: Convert Firebase error codes to user-friendly messages
  getErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Invalid password',
      'auth/email-already-in-use': 'This email address is already associated with another account.',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/requires-recent-login': 'For your security, please sign in again before changing your email.',
      'auth/operation-not-allowed': 'This operation is not currently allowed. Please contact an administrator.'
    }
    return messages[code] || 'An error occurred. Please try again.'
  }
}

export default new AuthService()


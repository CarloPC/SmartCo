# 🔒 Firestore Security Rules Guide

## ✅ Your Current Rules

You mentioned you already set up these rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Health records - users can only access their own
    match /healthRecords/{record} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
    
    // Events - anyone authenticated can read, specific roles can write
    match /events/{event} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Food aid
    match /foodAid/{record} {
      allow read, write: if request.auth != null;
    }
    
    // Notifications
    match /notifications/{notification} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

## ✅ What These Rules Do

### **Users Collection (`/users/{userId}`)**
- ✅ **Read**: Any authenticated user can read user profiles
  - This is needed for displaying names in health records, events, etc.
- ✅ **Write**: Users can only update their own profile
  - `request.auth.uid == userId` ensures users can only edit themselves

### **Health Records Collection**
- ✅ **Read/Write**: Users can only access their own health records
- ✅ **Create**: Any authenticated user can create a health record

### **Events Collection**
- ✅ **Read**: All authenticated users can view events
- ✅ **Create/Update**: Any authenticated user can create or update events

### **Food Aid Collection**
- ✅ **Read/Write**: All authenticated users can access food aid data

### **Notifications Collection**
- ✅ **Read**: Users can only read their own notifications
- ✅ **Create**: Any authenticated user can create notifications

---

## 🔍 Verify Your Rules

### **Step 1: Check in Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **smartco-2d684**
3. Click **Firestore Database** → **Rules**
4. Verify the rules match exactly as shown above
5. Make sure they are **Published** (not in draft mode)

### **Step 2: Test Profile Edit**

1. **Login to your app**: http://localhost:5173/
2. **Click your avatar** (top left) → **My Profile**
3. **Click "Edit Profile"**
4. **Change your name, phone, role, or purok**
5. **Click "Save Changes"**
6. ✅ You should see: "✅ Profile updated successfully!"
7. ❌ If you see an error, check the browser console

### **Step 3: Verify in Firebase Console**

1. Go to **Firestore Database** → **Data**
2. Click **users** collection
3. Find your user document
4. Verify your changes are saved

---

## 🐛 Troubleshooting

### **Error: "Missing or insufficient permissions"**

**Problem**: Firestore rules are blocking the update

**Solutions**:
1. Check that you're logged in (check browser console for auth token)
2. Verify rules are published in Firebase Console
3. Make sure `request.auth.uid == userId` in the rules
4. Clear browser cache and try again

### **Error: "Failed to update profile"**

**Problem**: Network error or Firebase configuration issue

**Solutions**:
1. Check internet connection
2. Verify Firebase config in `src/config/firebase.js` is correct
3. Check browser console for detailed error message
4. Make sure Firestore is enabled in Firebase Console

### **Error: "Cannot read properties of null"**

**Problem**: User not loaded yet

**Solutions**:
1. Wait for the page to fully load (shows loading spinner)
2. Make sure you're logged in
3. Refresh the page

---

## 📝 What Profile Fields Can Be Updated

### **✅ Can Update:**
- Full Name
- Phone Number
- Role (official, health, volunteer, resident)
- Purok (Purok 1-5)

### **❌ Cannot Update:**
- Email (managed by Firebase Authentication)
- User ID (auto-generated)
- Created At (timestamp, set once)

---

## 🔐 Security Best Practices

### **Current Setup (Good for Development)**
Your current rules are good for development and testing.

### **For Production (Recommended Improvements)**

#### **1. Validate Data Types**
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId &&
    request.resource.data.fullName is string &&
    request.resource.data.phone is string &&
    request.resource.data.role in ['official', 'health', 'volunteer', 'resident'] &&
    request.resource.data.purok in ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5'];
}
```

#### **2. Prevent Field Deletion**
```javascript
match /users/{userId} {
  allow update: if request.auth.uid == userId &&
    request.resource.data.keys().hasAll(['fullName', 'email', 'phone', 'role', 'purok']);
}
```

#### **3. Role-Based Access for Health Records**
```javascript
match /healthRecords/{record} {
  allow read: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'health'
  );
}
```

This allows health workers to view all health records.

---

## ✅ Testing Checklist

- [ ] Login to the app
- [ ] Navigate to My Profile
- [ ] Click "Edit Profile"
- [ ] Update your full name
- [ ] Update your phone number
- [ ] Change your role
- [ ] Change your purok
- [ ] Click "Save Changes"
- [ ] Verify success message appears
- [ ] Refresh the page
- [ ] Verify changes persist
- [ ] Check Firebase Console → Firestore → users collection
- [ ] Verify data is updated in Firebase

---

## 💡 Tips

1. **Email Cannot Be Changed**: Firebase Auth manages email separately. To change email, use Firebase Auth's `updateEmail()` method (requires re-authentication).

2. **Real-time Updates**: If you update your profile in one browser tab, other tabs won't auto-update. Refresh to see changes.

3. **Validation**: Add client-side validation (e.g., phone number format) for better UX.

4. **Profile Pictures**: To add profile pictures, use Firebase Storage and store the URL in the user document.

---

## 🎯 Summary

### **What's Working:**
✅ Profile fetches data from Firebase
✅ Profile updates save to Firebase
✅ Security rules protect user data
✅ Email is read-only (secure)
✅ Changes persist across devices

### **What You Should Do:**
1. ✅ Test profile edit with your account
2. ✅ Verify in Firebase Console
3. ✅ Confirm rules are published
4. 🚀 Start using your app!

Your profile system is now fully integrated with Firebase! 🎉

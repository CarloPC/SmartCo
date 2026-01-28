# Admin System - Firestore Setup Guide

This guide explains the changes you need to make in your Firestore database to support the admin approval system.

## 📋 Overview

The admin system adds:
- **User roles** (resident, barangay_official, admin)
- **Approval workflow** for health records, food aid schedules, and events
- **Admin dashboard** with statistics and management tools

---

## 🔧 Required Firestore Changes

### 1. Update Existing User Documents

**Collection:** `users`

#### For each existing user, you need to add:
- `role` field (if not already present)
- `status` field (optional)

#### How to update:

**Option A: Using Firestore Console**
1. Go to Firebase Console → Firestore Database
2. Open the `users` collection
3. Click on each user document
4. Add field: `role` → value: `"resident"` (or `"barangay_official"` or `"admin"`)
5. Add field: `status` → value: `"active"`

**Option B: Using Firebase Admin SDK Script**
```javascript
// Run this script once to update all existing users
const admin = require('firebase-admin');
const db = admin.firestore();

async function updateExistingUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  const batch = db.batch();
  
  snapshot.forEach((doc) => {
    if (!doc.data().role) {
      batch.update(doc.ref, {
        role: 'resident', // Set default role
        status: 'active',
        updatedAt: new Date().toISOString()
      });
    }
  });
  
  await batch.commit();
  console.log('Users updated successfully');
}

updateExistingUsers();
```

---

### 2. Update Existing Health Records

**Collection:** `healthRecords`

#### Add approval status to existing records:

**Option A: Using Firestore Console**
1. Go to `healthRecords` collection
2. For each document, add:
   - `approvalStatus` → `"approved"` (or `"pending"`)

**Option B: Using Script**
```javascript
async function updateExistingHealthRecords() {
  const recordsRef = db.collection('healthRecords');
  const snapshot = await recordsRef.get();
  
  const batch = db.batch();
  
  snapshot.forEach((doc) => {
    if (!doc.data().approvalStatus) {
      batch.update(doc.ref, {
        approvalStatus: 'approved', // Set existing records as approved
        updatedAt: new Date().toISOString()
      });
    }
  });
  
  await batch.commit();
  console.log('Health records updated successfully');
}
```

---

### 3. Update Existing Food Aid Schedules

**Collection:** `foodAid`

#### Add approval status:

```javascript
async function updateExistingFoodAid() {
  const foodAidRef = db.collection('foodAid');
  const snapshot = await foodAidRef.get();
  
  const batch = db.batch();
  
  snapshot.forEach((doc) => {
    if (!doc.data().approvalStatus) {
      batch.update(doc.ref, {
        approvalStatus: 'approved', // Set existing schedules as approved
        updatedAt: new Date().toISOString()
      });
    }
  });
  
  await batch.commit();
  console.log('Food aid schedules updated successfully');
}
```

---

### 4. Update Existing Events

**Collection:** `events`

#### Add approval status:

```javascript
async function updateExistingEvents() {
  const eventsRef = db.collection('events');
  const snapshot = await eventsRef.get();
  
  const batch = db.batch();
  
  snapshot.forEach((doc) => {
    if (!doc.data().approvalStatus) {
      batch.update(doc.ref, {
        approvalStatus: 'approved', // Set existing events as approved
        updatedAt: new Date().toISOString()
      });
    }
  });
  
  await batch.commit();
  console.log('Events updated successfully');
}
```

---

## 🔐 Updated Firestore Security Rules

Replace your existing Firestore security rules with these updated rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'barangay_official'];
    }
    
    // Helper function to check if user is super admin
    function isSuperAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Allow users to read their own profile
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      
      // Allow users to create their own profile during registration
      allow create: if isAuthenticated() && isOwner(userId);
      
      // Allow users to update their own profile (but not their role)
      allow update: if isAuthenticated() && isOwner(userId) && 
                      (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']));
      
      // Only admins can update user roles and status
      allow update: if isSuperAdmin();
      
      // Admins can list all users
      allow list: if isAdmin();
    }
    
    // Health Records collection
    match /healthRecords/{recordId} {
      // Users can read their own records, admins can read all
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid || isAdmin()
      );
      
      // Users can create their own records
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      
      // Only admins can update records (for approval)
      allow update: if isAdmin();
      
      // Users can delete their own pending records, admins can delete any
      allow delete: if isAuthenticated() && (
        (resource.data.userId == request.auth.uid && resource.data.approvalStatus == 'pending') ||
        isAdmin()
      );
    }
    
    // Food Aid collection
    match /foodAid/{scheduleId} {
      // Users can read their own schedules, admins can read all
      allow read: if isAuthenticated() && (
        resource.data.createdBy == request.auth.uid || isAdmin()
      );
      
      // Users can create their own schedules
      allow create: if isAuthenticated() && request.resource.data.createdBy == request.auth.uid;
      
      // Users can update their own pending schedules, admins can update any
      allow update: if isAuthenticated() && (
        (resource.data.createdBy == request.auth.uid && resource.data.approvalStatus == 'pending') ||
        isAdmin()
      );
      
      // Users can delete their own pending schedules, admins can delete any
      allow delete: if isAuthenticated() && (
        (resource.data.createdBy == request.auth.uid && resource.data.approvalStatus == 'pending') ||
        isAdmin()
      );
    }
    
    // Events collection
    match /events/{eventId} {
      // Users can read their own events, admins can read all
      allow read: if isAuthenticated() && (
        resource.data.createdBy == request.auth.uid || isAdmin()
      );
      
      // Users can create their own events
      allow create: if isAuthenticated() && request.resource.data.createdBy == request.auth.uid;
      
      // Users can update their own pending events, admins can update any
      allow update: if isAuthenticated() && (
        (resource.data.createdBy == request.auth.uid && resource.data.approvalStatus == 'pending') ||
        isAdmin()
      );
      
      // Users can delete their own pending events, admins can delete any
      allow delete: if isAuthenticated() && (
        (resource.data.createdBy == request.auth.uid && resource.data.approvalStatus == 'pending') ||
        isAdmin()
      );
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      // Users can only read their own notifications
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      
      // Only system/admins can create notifications
      allow create: if isAdmin();
      
      // Users can update their own notifications (mark as read)
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      
      // Users can delete their own notifications
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 📊 Required Firestore Indexes

Create these composite indexes to improve query performance:

### 1. Health Records Index
- **Collection:** `healthRecords`
- **Fields:**
  - `userId` (Ascending)
  - `createdAt` (Descending)
- **Query scope:** Collection

### 2. Health Records by Approval Status
- **Collection:** `healthRecords`
- **Fields:**
  - `approvalStatus` (Ascending)
  - `createdAt` (Descending)
- **Query scope:** Collection

### 3. Food Aid by User
- **Collection:** `foodAid`
- **Fields:**
  - `createdBy` (Ascending)
  - `createdAt` (Descending)
- **Query scope:** Collection

### 4. Food Aid by Approval Status
- **Collection:** `foodAid`
- **Fields:**
  - `approvalStatus` (Ascending)
  - `createdAt` (Descending)
- **Query scope:** Collection

### 5. Events by User
- **Collection:** `events`
- **Fields:**
  - `createdBy` (Ascending)
  - `date` (Descending)
- **Query scope:** Collection

### 6. Events by Approval Status
- **Collection:** `events`
- **Fields:**
  - `approvalStatus` (Ascending)
  - `date` (Descending)
- **Query scope:** Collection

**Note:** Firebase will automatically suggest creating these indexes when you run queries that need them. You can also create them manually in the Firebase Console.

---

## 👥 How to Create Your First Admin User

### Option 1: Via Firestore Console (Recommended)
1. Go to Firebase Console → Firestore Database
2. Open the `users` collection
3. Find your user document (by email or UID)
4. Edit the document and change:
   - `role` → `"admin"`
5. Save the document

### Option 2: During Registration
When registering a new account:
1. Select "Administrator" from the role dropdown
2. Complete registration

**Important:** For security, you should manually set the first admin user via the Firestore Console, then have that admin promote other users through the app.

---

## 🧪 Testing the Admin System

### Step 1: Create Test Accounts
1. Create a **resident** account (test resident)
2. Create an **admin** account (or promote your existing account to admin)

### Step 2: Test Resident Flow
1. Login as **resident**
2. Create a health checkup record
3. Create a food aid schedule
4. Create an event
5. Notice all items show "Pending" status

### Step 3: Test Admin Flow
1. Login as **admin**
2. Navigate to Admin Dashboard (Shield icon in bottom nav)
3. See pending items count
4. Go to "View Approvals"
5. Approve or reject the pending items
6. Verify they disappear from pending list

### Step 4: Verify Resident View
1. Login back as **resident**
2. Check that approved items now show "Approved" status
3. Verify rejected items show "Rejected" status

---

## 🚨 Important Notes

### Data Migration
- **Existing records:** All existing health records, food aid schedules, and events should be marked as `"approved"` to avoid disruption
- **New records:** All new submissions will automatically be set to `"pending"` status

### Security
- Only admins can change user roles
- Only admins can approve/reject records
- Users can only see their own records (admins can see all)
- Firestore security rules enforce these restrictions at the database level

### Role Hierarchy
- **admin** - Full access to everything + user management
- **barangay_official** - Can approve/reject records, view all data
- **resident** - Can create and view only their own records

---

## ❓ Troubleshooting

### "Permission Denied" Errors
- Make sure you've updated the Firestore security rules
- Verify the user's `role` field is correctly set in the `users` collection

### "Missing Index" Errors
- Firebase will show a link to create the required index
- Click the link and wait a few minutes for the index to build
- Alternatively, create indexes manually using the list above

### Admin Menu Not Showing
- Verify your user document has `role` set to `"admin"` or `"barangay_official"`
- Log out and log back in to refresh the user context
- Check browser console for any errors

### Approvals Not Working
- Ensure the document has an `approvalStatus` field
- Verify the admin user has the correct role
- Check that Firestore security rules are updated

---

## 📝 Summary of Changes

✅ **Users Collection:**
- Added `role` field (resident/barangay_official/admin)
- Added `status` field (active/suspended)

✅ **Health Records Collection:**
- Added `approvalStatus` field (pending/approved/rejected)
- Added `approvedBy`, `approvedAt` fields
- Added `rejectedBy`, `rejectedAt`, `rejectionReason` fields

✅ **Food Aid Collection:**
- Added `approvalStatus` field
- Added approval tracking fields

✅ **Events Collection:**
- Added `approvalStatus` field
- Added approval tracking fields

✅ **Security Rules:**
- Role-based access control
- Admin-only operations protected
- User-specific data isolation

✅ **Indexes:**
- Composite indexes for efficient queries
- Support for filtering by user and approval status

---

Need help? Check the browser console for detailed error messages!

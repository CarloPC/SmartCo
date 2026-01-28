# Firestore Indexes Setup

This document explains how to set up required Firestore indexes for the SmartCo application.

## Why Indexes Are Needed

Firebase Firestore requires composite indexes when you use multiple query constraints together (like `where` + `orderBy`). The app has fallback logic to work without indexes, but performance is better with them.

## Required Indexes

### Health Records Collection

**Collection:** `healthRecords`

**Index 1:** Query health records by user with ordering
- Field: `userId` (Ascending)
- Field: `createdAt` (Descending)

### Events Collection

**Collection:** `events`

**Index 1:** Query events by date
- Field: `date` (Ascending)

## How to Create Indexes

### Option 1: Automatic (Recommended)

1. Open your browser's Developer Console (F12)
2. Try to use the Health page or Events page
3. If an index is missing, you'll see an error message with a link
4. Click the link to automatically create the index in Firebase Console
5. Wait a few minutes for the index to build

### Option 2: Manual

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `smartco-2d684`
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Enter the collection name and fields as listed above
6. Click **Create**
7. Wait for the index to build (status will change from "Building" to "Enabled")

## Verification

After creating indexes:
1. Refresh the Health page
2. Click the refresh button in the header
3. Check browser console for any errors
4. Records should now display properly

## Troubleshooting

### Records not showing:
1. Open browser console (F12)
2. Look for log messages starting with:
   - `Creating health record for userId:`
   - `Health records found:`
   - `Health alerts found:`
3. Check that `userId` matches between creating and fetching records
4. Verify you're logged in with the same account

### Index errors:
- If you see "requires an index" error, follow the link in the error message
- Indexes can take 2-5 minutes to build
- Clear browser cache and refresh after index builds

### Performance:
- Without indexes: App fetches all records and sorts in memory (works but slower)
- With indexes: Firestore does efficient sorted queries (faster, recommended)

# Tab Room Association Implementation

## Overview
This document describes the implementation of tab system where each tab is associated with a room, and tab data is preserved when switching between tabs.

## Key Features

1. **Room-Associated Tabs**: Each tab can be associated with a specific room
2. **Unique Tab Keys**: Each tab instance has a unique key (e.g., `/test-indications-1`, `/test-indications-2`)
3. **Tab Label Format**: `Tab Name - RoomCode - DepartmentCode`
4. **Data Persistence**: Each tab maintains its own data when switching between tabs
5. **Multiple Instances**: Users can open multiple instances of the same page with different rooms

## Implementation Details

### 1. Updated Stores

#### `tabs.ts`
- Added `roomId`, `roomCode`, `departmentCode` to `TabItem`
- Changed `openTab` to return unique tab key
- Added `tabCounter` for generating unique keys
- Added `updateTabRoom` function to update room info for a tab
- Tab keys are now unique: `path-counter` format

#### `current-room.ts`
- Added `currentRoomCode` and `currentDepartmentCode` fields
- Updated `setRoom` to accept these additional fields

### 2. Updated Components

#### `dashboard-layout.tsx`
- Modified tab opening logic to create new tab instances for `/test-indications`
- Each new tab gets current room info when created
- Tab labels show room and department codes
- Tab switching preserves data by using unique keys

#### `room-picker-dialog.tsx`
- Updated to save `roomCode` and `departmentCode` when selecting a room

#### `test-indications-table.tsx`
- Gets room info from current tab instead of global store
- Each tab maintains its own form state
- Displays room info at the top of the form
- Save button uses tab's room info

## Usage Flow

1. **Select Room**: User clicks "Chọn phòng" button to select a working room
2. **Open Tab**: User navigates to "Chỉ định xét nghiệm" from menu
   - A new tab is created with format: `Chỉ định xét nghiệm - R001 - DEPT001`
   - Tab is associated with the selected room
3. **Work in Tab**: User enters data in the form
4. **Switch Room**: User can select a different room
5. **Open Another Tab**: Opening "Chỉ định xét nghiệm" again creates a new tab with the new room
6. **Switch Between Tabs**: Data in each tab is preserved when switching

## Tab Behavior

### Dashboard Tab
- Always uses the same tab (no room association)
- Cannot be closed
- Key: `/dashboard`

### Test Indications Tab
- Creates new instance for each navigation
- Associated with current room at creation time
- Can have multiple instances with different rooms
- Key format: `/test-indications-{counter}`

### Other Pages
- Reuse existing tab if one exists for that path
- Single instance per path
- Key format: `{path}-{counter}` (only one per path)

## Data Storage

Tab data is stored in the tabs store using the unique tab key:
```typescript
tabData: {
  '/test-indications-1': { serviceReqCode: '...', ... },
  '/test-indications-2': { serviceReqCode: '...', ... },
}
```

## Benefits

1. **Multiple Workflows**: Users can work with multiple patients/rooms simultaneously
2. **No Data Loss**: Switching tabs doesn't lose entered data
3. **Clear Context**: Tab label shows which room it's for
4. **Flexibility**: Can open same page multiple times with different contexts


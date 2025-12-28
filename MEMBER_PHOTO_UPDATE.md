# Member Photo Update Feature

## Overview
Added the ability to update/change member photos when editing member information through the member update dialog.

## Features Added

### 1. **Photo Display in Update Dialog**
- Shows current member photo (80x80px) centered at top of dialog
- Displays initials with colored background if no photo exists
- Professional circular design with border

### 2. **Change Photo Functionality**
- "Change Photo" link opens file picker
- Supports JPG and PNG images
- Automatically compresses image to max 300KB
- Live preview updates in dialog

### 3. **Remove Photo Option**
- "Remove Photo" button appears if member has an existing photo
- Resets display back to member's initials
- Can be used to delete unwanted photos during update

### 4. **Photo Persistence**
- New photo data stored in `App._updatePhotoData` during editing
- Photo included when saving member updates
- Falls back to existing photo if no new photo selected
- Original photo preserved if update cancelled

## Implementation Details

### Global Variables Added
```javascript
App._updatePhotoData = null;        // Stores new photo during update
App._currentUpdateMemberId = null;  // Tracks which member is being updated
App._currentUpdateMember = null;    // Reference to current member data
```

### New Functions

#### `previewUpdateMemberPhoto(event)`
- Handles file selection from update dialog
- Validates file type (image only)
- Compresses image to max 300KB
- Updates preview display in real-time

#### `removeUpdateMemberPhoto()`
- Clears the new photo selection
- Resets display to original or initials
- Clears file input

### Modified Functions

#### `updateMember(id)` - Enhanced
- Added photo section at top of dialog
- Shows circular avatar (80x80px)
- Includes file input with hidden styling
- Handles photo in save process
- Cleans up temporary data on save/cancel

## User Flow

1. Click "Update Info" on member card
2. Update dialog opens showing:
   - Current member photo/initials
   - "Change Photo" link
   - Name, email, phone fields
   - "Remove Photo" button (if photo exists)
3. User can:
   - Click "Change Photo" to upload new image
   - See live preview of new photo
   - Click "Remove Photo" to delete current photo
   - Cancel to discard changes
4. Click "Save Changes" to persist updates including photo

## Styling

- **Avatar Container**: 80x80px, circular, with border
- **Change Photo Link**: Blue, underlined, cursor pointer
- **Remove Photo Button**: Danger red button
- **Responsive**: Works on all screen sizes

## File Handling

- Maximum file size: Automatically compressed to ≤300KB
- Supported formats: JPG, PNG, WebP
- Data URI: Stored as base64 data URL for offline compatibility
- No external storage required

## Validation

✓ File type validation (images only)
✓ File size management (auto-compress)
✓ Data persistence (during edit session)
✓ Clean data removal (on cancel)
✓ Backward compatible (keeps existing photos)

## Testing Checklist

- [ ] Upload new photo for member without photo
- [ ] Replace existing photo with new one
- [ ] Remove photo from member
- [ ] Cancel dialog and verify photo unchanged
- [ ] Verify photo displays in member card after update
- [ ] Verify photo displays in member table after update
- [ ] Check browser console for "Update photo preview loaded" message

# Custom Notifications System - Migration Guide

## Overview
This project now uses a custom JavaScript notification system instead of SweetAlert2. The custom system provides:

- **Toast Notifications** - Auto-dismissing notifications for quick feedback
- **Modal Dialogs** - Interactive dialogs for confirmations, alerts, and prompts
- **Zero External Dependencies** - No CDN reliance, all inline styles
- **Better Performance** - Lighter weight and faster loading
- **Backward Compatible** - Uses `Swal` object for drop-in replacement

## Features

### Toast Notifications (Auto-dismiss)
Appear in the top-right corner and automatically close after 5 seconds.

```javascript
// Success toast
Swal.success('Member Added', 'John Doe has been registered');

// Error toast
Swal.error('Error', 'Failed to save member');

// Warning toast
Swal.warning('Warning', 'This action cannot be undone');

// Info toast
Swal.info('Info', 'Update completed successfully');
```

### Modal Dialogs (Requires Interaction)
Full-screen modals that block interaction with the page.

```javascript
// Simple alert
await Swal.fire({
    title: 'Success',
    html: 'Loan created successfully',
    icon: 'success',
    confirmButtonText: 'OK'
});

// Confirmation dialog
const result = await Swal.fire({
    title: 'Delete Member?',
    html: 'This action cannot be undone',
    icon: 'warning',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    showCancelButton: true
});

if (result.isConfirmed) {
    // User clicked Delete
}
```

### Convenience Methods

```javascript
// Confirm dialog - returns boolean
const confirmed = await Swal.confirm('Delete this?', 'This cannot be undone');

// Prompt dialog - returns input value or null
const name = await Swal.prompt('Enter name', 'Please type your name');
if (name) {
    console.log('User entered:', name);
}
```

## Configuration Options

For `Swal.fire()` method:

```javascript
{
    title: 'Dialog Title',           // Main heading
    html: 'Message content',         // Can include HTML
    icon: 'info',                    // success, error, warning, info, question
    confirmButtonText: 'OK',         // Text for confirm button
    cancelButtonText: 'Cancel',      // Text for cancel button
    showCancelButton: true,          // Show cancel button
    input: 'text',                   // input, textarea, email, password, number, date
    inputPlaceholder: 'Enter...',    // Placeholder for input field
    didOpen: (modal) => { },         // Callback when dialog opens
    willClose: (result) => { }       // Callback before closing
}
```

## File Locations

- **Main Component**: `js/custom-notifications.js`
- **Styles**: Injected automatically on initialization
- **Global Instance**: `window.Swal` (backward compatible with SweetAlert)

## Migration from SweetAlert2

### Before (SweetAlert)
```javascript
Swal.fire({
    title: 'Delete?',
    text: 'Confirm deletion',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Delete'
}).then((result) => {
    if (result.isConfirmed) {
        // Delete action
    }
});
```

### After (Custom Notifications)
```javascript
const result = await Swal.fire({
    title: 'Delete?',
    html: 'Confirm deletion',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete'
});

if (result.isConfirmed) {
    // Delete action
}
```

## Toast Notification Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `success` | ✓ | Green | Successful operations |
| `error` | ✕ | Red | Error messages |
| `warning` | ⚠ | Orange | Warnings |
| `info` | ℹ | Blue | Information |
| `question` | ? | Purple | Confirmations/Questions |

## Responsive Behavior

The notification system is fully responsive:

- **Desktop**: Notifications appear top-right with 400px max width
- **Mobile**: Notifications span full width with 10px margins
- **Modal Dialogs**: Automatically scale to fit screen
- **Touch-friendly**: Larger buttons on mobile devices

## Performance Benefits

1. **No CDN Dependency**: System works offline
2. **Smaller Bundle**: ~8KB vs SweetAlert's ~50KB+
3. **Faster Loading**: No external CSS or JS files
4. **Better Performance**: Native animations, no jQuery dependencies
5. **Service Worker Compatible**: Works with offline mode

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support (iOS Safari, Chrome Mobile, etc.)

## Examples in Use

### Recording a Payment
```javascript
try {
    // Save payment logic
    Swal.success('Payment Recorded', 'UGX 50,000 payment recorded');
} catch (error) {
    Swal.error('Error', error.message);
}
```

### Confirming Deletion
```javascript
const confirmed = await Swal.confirm(
    'Delete Member?',
    'This will remove all member data including loans and savings'
);

if (confirmed) {
    // Delete member
    Swal.success('Deleted', 'Member has been removed');
}
```

### Getting User Input
```javascript
const memberName = await Swal.prompt(
    'New Member Name',
    'Enter the full name of the new member'
);

if (memberName) {
    // Save new member
}
```

## Backward Compatibility

All existing code using `Swal.fire()` will continue to work. The custom system handles:

- ✓ `Swal.fire()` - Main dialog method
- ✓ `Swal.success()`, `Swal.error()`, etc. - Toast methods
- ✓ Async/await with `.fire()`
- ✓ `isConfirmed`, `isDenied`, `isDismissed` properties
- ✓ `input` field handling

## Customization

To customize colors or styles, edit `js/custom-notifications.js` and modify the CSS sections:

```css
.custom-toast.success {
    border-left-color: #10b981;  /* Change success color */
    background: #f0fdf4;
    color: #065f46;
}
```

## Troubleshooting

**Notifications not appearing?**
- Ensure `custom-notifications.js` is loaded before other scripts
- Check browser console for errors

**Dialogs not blocking interaction?**
- Verify the overlay div is present in DOM
- Check z-index values if other elements are layered on top

**Styling issues?**
- Clear browser cache and do a hard refresh
- Check for CSS conflicts with other stylesheets

## API Reference

### Toast Methods
```javascript
Swal.toast(title, message, type, duration)
Swal.success(title, message)
Swal.error(title, message)
Swal.warning(title, message)
Swal.info(title, message)
```

### Dialog Methods
```javascript
await Swal.fire(config)
await Swal.confirm(title, message, confirmText, cancelText)
await Swal.prompt(title, message, placeholder, confirmText, cancelText)
```

### Return Values
```javascript
{
    isConfirmed: boolean,  // User clicked confirm
    isDenied: boolean,     // User clicked cancel
    isDismissed: boolean,  // User dismissed (same as isDenied)
    value: string          // Input value (for prompts)
}
```

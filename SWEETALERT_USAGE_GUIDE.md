# SweetAlert2 Integration Guide

This guide shows how to use the SweetAlert2 library for notifications and user feedback in the SACCO application.

## Setup

SweetAlert2 is already integrated into your application through the `SweetAlertUI` global object. It's available in all JavaScript files.

- **CSS**: `vendor/sweetalert/themes/bootstrap-5.css` (Bootstrap 5 themed)
- **JS**: `vendor/sweetalert/src/sweetalert2.js`
- **Integration**: `js/sweetalert-integration.js` (Wrapper class)

## Basic Notifications

### Success Notification
```javascript
SweetAlertUI.success('Payment Recorded', 'UGX 50,000 payment recorded successfully');
```

### Error Notification
```javascript
SweetAlertUI.error('Payment Failed', 'Unable to process payment. Please try again.');
```

### Warning Notification
```javascript
SweetAlertUI.warning('Low Balance', 'Savings balance is below 100,000 UGX');
```

### Info Notification
```javascript
SweetAlertUI.info('System Update', 'Data backup completed successfully');
```

## Dialogs with User Interaction

### Confirmation Dialog
```javascript
const confirmed = await SweetAlertUI.confirm(
    'Delete Member?',
    'Are you sure you want to delete this member? This action cannot be undone.',
    'Delete',
    'Cancel'
);

if (confirmed) {
    // Handle confirmation
}
```

### Prompt Dialog
```javascript
const amount = await SweetAlertUI.prompt(
    'Enter Amount',
    'How much would you like to save?',
    'e.g., 50000',
    'Save',
    'Cancel',
    'number'
);

if (amount) {
    // Use the entered amount
}
```

### Modal Dialog
```javascript
const confirmed = await SweetAlertUI.modal(
    'Loan Details',
    '<strong>Loan ID:</strong> L-001<br><strong>Amount:</strong> UGX 500,000<br><strong>Term:</strong> 12 months',
    'Approve',
    true,
    'Reject'
);
```

## Domain-Specific Notifications

### Payment Recorded
```javascript
SweetAlertUI.paymentRecorded('John Doe', 150000);
// Output: "💳 Payment Recorded - Payment of UGX 150,000 recorded for John Doe"
```

### Loan Created
```javascript
SweetAlertUI.loanCreated('Jane Smith', 500000, 45833);
// Output: "💰 Loan Created - Loan of UGX 500,000 created for Jane Smith
//          Monthly Payment: UGX 45,833"
```

### Saving Recorded
```javascript
SweetAlertUI.savingRecorded('Alice Johnson', 75000);
// Output: "🏦 Saving Recorded - Saving of UGX 75,000 recorded for Alice Johnson"
```

### Withdrawal Recorded
```javascript
SweetAlertUI.withdrawalRecorded('Bob Wilson', 100000);
// Output: "💸 Withdrawal Recorded - Withdrawal of UGX 100,000 recorded for Bob Wilson"
```

### Member Added
```javascript
SweetAlertUI.memberAdded('David Brown', 'MEM-12345');
// Output: "👤 Member Added - New member David Brown (ID: MEM-12345) has been registered"
```

### Loan Overdue Alert
```javascript
SweetAlertUI.loanOverdue('Emma Davis', 5, 45833);
// Output: "⚠️ Loan Overdue - Loan payment for Emma Davis is 5 days overdue
//          Amount: UGX 45,833"
```

### Payment Due Soon
```javascript
SweetAlertUI.paymentDueSoon('Frank Miller', 3, 50000);
// Output: "📅 Payment Due Soon - Payment for Frank Miller is due in 3 day(s)
//          Amount: UGX 50,000"
```

### Multiple Overdue Payments
```javascript
SweetAlertUI.paymentsOverdue(5, 250000);
// Output: "🔴 Overdue Payments Alert - 5 payment(s) overdue with total amount of UGX 250,000"
```

## Data Operations

### Export Success
```javascript
SweetAlertUI.exportConfirmation('sacco_export_2024.json');
```

### Backup Success
```javascript
SweetAlertUI.backupConfirmation('backup_2024_01_15.json');
```

### Restore Success
```javascript
SweetAlertUI.restoreConfirmation(156); // 156 items restored
```

## Advanced Features

### Error with Details
```javascript
SweetAlertUI.errorWithDetails(
    'Payment Processing Failed',
    'There was an error processing your payment.',
    'Error Code: ERR_PAYMENT_001<br>Details: Network timeout'
);
```

### Loading Dialog
```javascript
SweetAlertUI.loading('Processing...', 'Please wait while we process your request');

// Later, when done:
SweetAlertUI.closeLoading();
```

### Milestone Achievement
```javascript
SweetAlertUI.milestoneAchieved(
    'Congratulations!',
    'You have successfully processed 1000 transactions!'
);
```

## Notification Parameters

### Position Options
- `'top'` - Top of screen
- `'top-start'` - Top left
- `'top-end'` - Top right (default)
- `'center'` - Center of screen
- `'bottom'` - Bottom of screen
- `'bottom-start'` - Bottom left
- `'bottom-end'` - Bottom right

### Duration Options
- `0` - No auto-close (user must dismiss)
- `5000` - 5 seconds (default for most notifications)
- Custom milliseconds

### Input Types (for prompts)
- `'text'` - Text input (default)
- `'email'` - Email input
- `'number'` - Number input
- `'textarea'` - Multi-line text

## Integration with Form Submissions

### Example: Saving Payment
```javascript
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show loading
    SweetAlertUI.loading('Recording Payment...', 'Please wait');

    try {
        // Process payment
        const result = await processPayment(formData);

        // Close loading
        SweetAlertUI.closeLoading();

        // Show success
        SweetAlertUI.paymentRecorded(memberName, amount);

        // Reset form
        e.target.reset();
    } catch (error) {
        // Close loading
        SweetAlertUI.closeLoading();

        // Show error
        SweetAlertUI.errorWithDetails(
            'Payment Recording Failed',
            error.message,
            error.details
        );
    }
});
```

## Styling and Customization

The SweetAlert2 is styled with the Bootstrap 5 theme, which integrates seamlessly with your application's design. You can customize colors and appearance by:

1. Modifying `vendor/sweetalert/themes/bootstrap-5.css`
2. Or using custom SweetAlert2 configuration in your code

## Best Practices

1. **Use domain-specific methods** for consistency (e.g., `paymentRecorded()` instead of generic `success()`)
2. **Always await confirmation dialogs** to handle user responses
3. **Show loading dialogs** during long operations
4. **Use appropriate icons** - match the notification type to the icon
5. **Keep messages brief** - users should understand at a glance
6. **Use HTML formatting** for emphasis when needed: `<strong>text</strong>`, `<br>`, etc.

## Comparison with Previous System

| Feature | Previous (CustomNotification) | New (SweetAlert2) |
|---------|-------------------------------|-------------------|
| Toast Notifications | ✓ | ✓ |
| Modal Dialogs | ✓ | ✓ |
| Confirmation | ✓ | ✓ |
| Loading States | ✗ | ✓ |
| Rich HTML Content | Limited | ✓ |
| Timer Progress Bar | ✗ | ✓ |
| Keyboard Navigation | Limited | ✓ |
| Mobile Responsive | ✓ | ✓ |
| Bootstrap 5 Themed | ✗ | ✓ |

## Troubleshooting

### SweetAlert not working
- Check that `vendor/sweetalert/src/sweetalert2.js` is loaded
- Verify that `js/sweetalert-integration.js` is loaded after SweetAlert2
- Check browser console for errors

### Styling issues
- Ensure `vendor/sweetalert/themes/bootstrap-5.css` is loaded
- Check that no CSS is overriding the default styles

### Dialogs not responding to input
- Make sure your code properly awaits the Promise
- Check for JavaScript errors in the console

## Migration from Old System

If using the old `CustomNotification` (Swal) class:

### Old Way
```javascript
Swal.fire({
    title: 'Success',
    html: 'Payment recorded',
    icon: 'success',
    position: 'top-end',
    timer: 5000
});
```

### New Way (Recommended)
```javascript
SweetAlertUI.paymentRecorded('John Doe', 50000);
```

Both systems work side-by-side for backward compatibility, but the new `SweetAlertUI` provides better features and consistency.

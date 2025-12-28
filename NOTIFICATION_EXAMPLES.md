# Custom Notifications - Practical Examples

## Quick Reference Examples

### 1. Success Notification (Auto-dismiss)
```javascript
// Simple toast notification
Swal.success('Success!', 'Member has been registered successfully');

// Toast closes automatically after 5 seconds
```

**Visual**: Green toast in top-right corner with checkmark icon

---

### 2. Error Notification
```javascript
// Error toast
Swal.error('Failed!', 'Unable to save the member. Please try again.');

// Toast closes automatically after 5 seconds
```

**Visual**: Red toast with X icon

---

### 3. Confirmation Dialog (Requires Click)
```javascript
// Confirm before deleting
const result = await Swal.fire({
    title: 'Delete Member?',
    html: 'This action will remove the member and all associated data.',
    icon: 'warning',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    showCancelButton: true
});

if (result.isConfirmed) {
    // Proceed with deletion
    deleteMember(memberId);
    Swal.success('Deleted', 'Member has been removed');
} else {
    console.log('Deletion cancelled');
}
```

**Visual**: Modal dialog with warning icon, two buttons

---

### 4. Information Alert
```javascript
// Simple info dialog
await Swal.fire({
    title: 'Notice',
    html: 'Your loan application has been approved!',
    icon: 'info',
    confirmButtonText: 'OK'
});
```

**Visual**: Blue modal with info icon, single OK button

---

### 5. Input Prompt
```javascript
// Get user input
const result = await Swal.fire({
    title: 'Enter Member ID',
    html: 'Please provide the member ID to look up',
    input: 'text',
    inputPlaceholder: 'e.g., MEM-001',
    confirmButtonText: 'Search',
    cancelButtonText: 'Cancel',
    showCancelButton: true
});

if (result.isConfirmed) {
    const memberId = result.value;
    console.log('Searching for:', memberId);
    // Search for member
} else {
    console.log('Search cancelled');
}
```

**Visual**: Modal with text input field

---

### 6. Multi-line Input (Textarea)
```javascript
// Get longer text input
const result = await Swal.fire({
    title: 'Add Note',
    html: 'Add a note about this member:',
    input: 'textarea',
    inputPlaceholder: 'Type your note here...',
    confirmButtonText: 'Save Note',
    cancelButtonText: 'Cancel',
    showCancelButton: true
});

if (result.isConfirmed) {
    const note = result.value;
    saveMemberNote(memberId, note);
    Swal.success('Saved', 'Note has been added');
}
```

**Visual**: Modal with large text area

---

## Real-World Implementation Examples

### Example 1: Member Registration Form
```javascript
document.getElementById('memberForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const formData = {
            name: document.getElementById('memberName').value,
            email: document.getElementById('memberEmail').value,
            phone: document.getElementById('memberPhone').value
        };
        
        // Validate
        if (!formData.name || !formData.email) {
            Swal.warning('Validation Error', 'Please fill all required fields');
            return;
        }
        
        // Save member
        await saveMember(formData);
        
        // Success notification
        Swal.success('Success!', 'Member registered successfully');
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        Swal.error('Failed!', error.message);
    }
});
```

---

### Example 2: Delete Confirmation
```javascript
function deleteLoan(loanId) {
    Swal.fire({
        title: 'Delete Loan?',
        html: 'Are you sure you want to delete this loan? This action cannot be undone.',
        icon: 'question',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Keep',
        showCancelButton: true
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await removeLoan(loanId);
                Swal.success('Deleted', 'Loan has been removed');
                refreshLoansList();
            } catch (error) {
                Swal.error('Error', 'Failed to delete loan');
            }
        }
    });
}
```

---

### Example 3: Payment Recording
```javascript
async function recordPayment() {
    try {
        const loanId = document.getElementById('paymentLoan').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const date = document.getElementById('paymentDate').value;
        
        if (!loanId || !amount || !date) {
            Swal.warning('Please fill all fields');
            return;
        }
        
        // Save payment
        const payment = await savePayment({ loanId, amount, date });
        
        // Show success toast
        Swal.success(
            'Payment Recorded',
            `UGX ${amount.toLocaleString()} payment recorded`
        );
        
        // Clear form
        document.getElementById('paymentForm').reset();
        
        // Refresh payments list
        refreshPaymentsList();
        
    } catch (error) {
        Swal.error('Error', error.message);
    }
}
```

---

### Example 4: Loan Status Approval
```javascript
async function approveLoan(loanId) {
    const result = await Swal.fire({
        title: 'Approve Loan?',
        html: 'Review the loan details before approving. This cannot be changed later.',
        icon: 'question',
        confirmButtonText: 'Approve',
        cancelButtonText: 'Review Again',
        showCancelButton: true
    });
    
    if (result.isConfirmed) {
        try {
            await updateLoanStatus(loanId, 'approved');
            Swal.success('Approved!', 'Loan has been approved');
            refreshLoans();
        } catch (error) {
            Swal.error('Failed', 'Could not approve loan');
        }
    }
}
```

---

### Example 5: Export with Confirmation
```javascript
async function exportData() {
    // Confirm export
    const result = await Swal.fire({
        title: 'Export All Data?',
        html: 'This will download all members, loans, and payments as JSON.',
        icon: 'info',
        confirmButtonText: 'Export',
        cancelButtonText: 'Cancel',
        showCancelButton: true
    });
    
    if (!result.isConfirmed) return;
    
    try {
        // Show loading toast
        Swal.info('Exporting...', 'Please wait while your data is being prepared');
        
        // Export
        const data = await getAllData();
        downloadJSON(data, 'sacco-data.json');
        
        // Success
        Swal.success('Done!', 'Data exported successfully');
        
    } catch (error) {
        Swal.error('Export Failed', error.message);
    }
}
```

---

### Example 6: Member Lookup with Input
```javascript
async function lookupMember() {
    const result = await Swal.fire({
        title: 'Find Member',
        html: 'Enter member ID or name to search:',
        input: 'text',
        inputPlaceholder: 'e.g., MEM-001 or John Doe',
        confirmButtonText: 'Search',
        cancelButtonText: 'Cancel',
        showCancelButton: true
    });
    
    if (!result.isConfirmed) return;
    
    const query = result.value?.trim();
    if (!query) {
        Swal.warning('Please enter a search term');
        return;
    }
    
    try {
        const member = await searchMember(query);
        if (member) {
            Swal.fire({
                title: member.name,
                html: `
                    <div style="text-align: left;">
                        <p><strong>ID:</strong> ${member.id}</p>
                        <p><strong>Email:</strong> ${member.email}</p>
                        <p><strong>Phone:</strong> ${member.phone}</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'OK'
            });
        } else {
            Swal.warning('Not Found', 'No member matches your search');
        }
    } catch (error) {
        Swal.error('Search Error', error.message);
    }
}
```

---

### Example 7: Bulk Operations
```javascript
async function deleteSeveralLoans(loanIds) {
    // Confirm bulk deletion
    const result = await Swal.fire({
        title: 'Delete Multiple Loans?',
        html: `You are about to delete <strong>${loanIds.length} loans</strong>. This cannot be undone.`,
        icon: 'warning',
        confirmButtonText: 'Delete All',
        cancelButtonText: 'Cancel',
        showCancelButton: true
    });
    
    if (!result.isConfirmed) return;
    
    try {
        // Show progress
        Swal.info('Deleting...', 'Processing your request');
        
        // Delete all
        for (const id of loanIds) {
            await deleteLoan(id);
        }
        
        // Success
        Swal.success(
            'Completed!',
            `${loanIds.length} loans have been deleted`
        );
        
        refreshLoans();
    } catch (error) {
        Swal.error('Error', 'Some deletions failed: ' + error.message);
    }
}
```

---

### Example 8: Async Operations with Loading
```javascript
async function processLoanApplication(loanId) {
    try {
        // Show confirmation first
        const result = await Swal.fire({
            title: 'Process Application?',
            html: 'Review the application details before proceeding.',
            icon: 'question',
            confirmButtonText: 'Process',
            cancelButtonText: 'Cancel',
            showCancelButton: true
        });
        
        if (!result.isConfirmed) return;
        
        // Show processing toast
        Swal.info('Processing', 'Please wait...');
        
        // Long operation
        await processApplication(loanId);
        
        // Success
        Swal.success(
            'Success!',
            'Loan application has been processed successfully'
        );
        
    } catch (error) {
        Swal.error('Processing Failed', error.message);
    }
}
```

---

## Comparison: Old vs New Syntax

### Before (SweetAlert2)
```javascript
Swal.fire({
    title: 'Delete?',
    text: 'Are you sure?',
    icon: 'warning',
    showCancelButton: true
}).then((result) => {
    if (result.isConfirmed) {
        // Delete
    }
});
```

### After (Custom)
```javascript
const result = await Swal.fire({
    title: 'Delete?',
    html: 'Are you sure?',
    icon: 'warning',
    showCancelButton: true
});

if (result.isConfirmed) {
    // Delete
}
```

**Key differences:**
- Use `html` instead of `text`
- Can use `async/await` for cleaner code
- Same API, easier to read

---

## Tips & Best Practices

1. **Use toasts for quick feedback** - Auto-dismiss notifications for success/error
2. **Use modals for confirmations** - Require user to click for dangerous operations
3. **Keep messages concise** - Users read notifications quickly
4. **Use appropriate icons** - warning for dangerous, info for neutral, success for done
5. **Test on mobile** - Ensure dialogs display correctly on small screens

---

## CSS Customization

To change colors, edit `js/custom-notifications.js`:

```javascript
// Success toast color
.custom-toast.success {
    border-left-color: #10b981;  /* Green */
    background: #f0fdf4;
    color: #065f46;
}

// Error toast color
.custom-toast.error {
    border-left-color: #ef4444;  /* Red */
    background: #fef2f2;
    color: #7f1d1d;
}
```

---

## Performance Notes

- No external dependencies - works offline
- Auto-cleanup of dismissed notifications
- CSS animations are GPU-accelerated
- Modal overlay is removed from DOM when closed
- Supports high-frequency notifications without memory leaks

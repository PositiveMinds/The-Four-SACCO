// Choices.js Initialization Module
// Enhances all select fields with Choices.js for better UX

const ChoicesInit = {
     // Store instances for later manipulation
     instances: {},
     // Flag to disable Choices.js if it's causing issues
     useNativeSelect: false,

     // Initialize Choices.js on all select elements
     init() {
         // Define which selects should be enhanced with Choices.js
         const selectorsToEnhance = [
             '#memberSearch',
             '#loanSearch',
             '#activityMemberFilter',
             '#reportMember',
             '#loanMember',
             '#paymentLoan',
             '#transactionMemberSelect',
             '#savingMember',
             '#withdrawalMember'
         ];

         selectorsToEnhance.forEach(selector => {
             const element = document.querySelector(selector);
             if (element) {
                 this.initializeChoices(element, selector);
             }
         });
     },

    // Initialize a single Choices instance
    initializeChoices(element, selector) {
        try {
            // Skip Choices.js initialization if it's causing issues
            if (this.useNativeSelect) {
                console.log('Using native select for', selector);
                return;
            }

            const choices = new Choices(element, {
                allowHTML: false,
                searchEnabled: true,
                searchChoices: true,
                removeItemButton: false,
                shouldSort: true,
                sorter: (a, b) => {
                    return a.label.localeCompare(b.label);
                },
                // Styling options
                itemSelectText: 'Press to select',
                noResultsText: 'No results found',
                noChoicesText: 'No choices to choose from',
                addItemText: (value) => `Press Enter to add <b>"${value}"</b>`,
                maxItemCount: -1,
                textDirection: 'ltr',
                classNames: {
                    containerOuter: 'choices choices-enhanced',
                    containerInner: 'choices__inner',
                    input: 'choices__input',
                    inputCloned: 'choices__input--cloned',
                    list: 'choices__list',
                    listItems: 'choices__list--multiple',
                    listSingle: 'choices__list--single',
                    listDropdown: 'choices__list--dropdown',
                    item: 'choices__item',
                    itemSelectable: 'choices__item--selectable',
                    itemDeletable: 'choices__item--deletable',
                    itemChoice: 'choices__item--choice',
                    placeholder: 'choices__placeholder',
                    group: 'choices__group',
                    groupHeading: 'choices__heading',
                    button: 'choices__button',
                    activeState: 'is-active',
                    focusState: 'is-focused',
                    openState: 'is-open',
                    disabledState: 'is-disabled',
                    selectedState: 'is-selected',
                    loadingState: 'is-loading',
                    notice: 'choices__notice',
                    addChoice: 'choices__button',
                    noResults: 'choices__no-results',
                    noChoices: 'choices__no-choices'
                },
                // Placeholder text
                placeholderValue: this.getPlaceholder(selector),
                // Searchable
                searchResultLimit: 15,
                searchFloor: 1,
                // Keyboard
                fuseOptions: {
                    threshold: 0.4
                },
                // Pass options to the flipper
                flipPlacement: true
            });

            this.instances[selector] = choices;
            console.log('Choices.js initialized for', selector);
        } catch (error) {
            console.warn('Failed to initialize Choices.js for', selector, '- using native select instead');
            this.useNativeSelect = true;
        }
    },

    // Get appropriate placeholder text for each selector
    getPlaceholder(selector) {
        const placeholders = {
            '#memberSearch': 'Search members...',
            '#loanSearch': 'Search loans...',
            '#activityMemberFilter': 'Filter by member...',
            '#reportMember': 'Select a member...',
            '#loanMember': 'Select member...',
            '#paymentLoan': 'Select loan...',
            '#transactionMemberSelect': 'Choose a member...',
            '#savingMember': 'Select member...',
            '#withdrawalMember': 'Select member...'
        };
        return placeholders[selector] || 'Select an option...';
    },

    // Method to update choices dynamically
    updateChoices(selector, options) {
        if (this.instances[selector]) {
            const choices = this.instances[selector];
            choices.setChoices(options, 'value', 'label', true);
        }
    },

    // Method to get selected value(s)
    getValue(selector) {
        if (this.instances[selector]) {
            const choices = this.instances[selector];
            return choices.getValue();
        }
        return null;
    },

    // Method to set value programmatically
    setValue(selector, value) {
        if (this.instances[selector]) {
            const choices = this.instances[selector];
            choices.setValue([{ value: value }]);
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => ChoicesInit.init(), 500);
    });
} else {
    setTimeout(() => ChoicesInit.init(), 500);
}

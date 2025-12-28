// IndexedDB Management Module
// Replaces localStorage with IndexedDB for better storage capacity

const IndexedDBManager = {
    dbName: 'SACCODatabase',
    dbVersion: 1,
    db: null,

    // Initialize the database
    async init() {
        return new Promise((resolve, reject) => {
            // Test if IndexedDB is available and working
            try {
                const testRequest = indexedDB.open('__test__');
                testRequest.onerror = () => {
                    console.warn('IndexedDB not available, using localStorage fallback');
                    this.useLocalStorageFallback = true;
                    resolve(null);
                };
                testRequest.onsuccess = () => {
                    const testDb = testRequest.result;
                    testDb.close();
                    
                    // IndexedDB is available, proceed with normal initialization
                    const request = indexedDB.open(this.dbName, this.dbVersion);

                    request.onerror = () => {
                        console.error('Database failed to open:', request.error);
                        console.warn('Falling back to localStorage');
                        this.useLocalStorageFallback = true;
                        resolve(null);
                    };

                    request.onsuccess = () => {
                        this.db = request.result;
                        console.log('Database opened successfully');
                        this.useLocalStorageFallback = false;
                        resolve(this.db);
                    };

                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;

                        // Create object stores if they don't exist
                        const stores = [
                            'members',
                            'loans',
                            'payments',
                            'savings',
                            'withdrawals',
                            'auditLog',
                            'userRole'
                        ];

                        stores.forEach(storeName => {
                            if (!db.objectStoreNames.contains(storeName)) {
                                db.createObjectStore(storeName);
                                console.log(`Created object store: ${storeName}`);
                            }
                        });
                    };
                };
            } catch (error) {
                console.warn('IndexedDB not available:', error);
                this.useLocalStorageFallback = true;
                resolve(null);
            }
        });
    },

    // Get data from IndexedDB
    async get(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }

            const storeName = this.getStoreName(key);
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onerror = () => {
                console.error(`Error reading ${key}:`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    },

    // Set data in IndexedDB
    async set(key, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }

            const storeName = this.getStoreName(key);
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value, key);

            request.onerror = () => {
                console.error(`Error writing ${key}:`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(true);
            };
        });
    },

    // Delete a key from IndexedDB
    async delete(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }

            const storeName = this.getStoreName(key);
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = () => {
                console.error(`Error deleting ${key}:`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(true);
            };
        });
    },

    // Clear all data from IndexedDB
    async clear() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }

            const stores = [
                'members',
                'loans',
                'payments',
                'savings',
                'withdrawals',
                'auditLog',
                'userRole'
            ];

            let completed = 0;
            stores.forEach(storeName => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onerror = () => {
                    console.error(`Error clearing ${storeName}:`, request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    completed++;
                    if (completed === stores.length) {
                        console.log('All stores cleared');
                        resolve(true);
                    }
                };
            });
        });
    },

    // Get all keys and values from a store
    async getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => {
                console.error(`Error getting all from ${storeName}:`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    },

    // Determine which store a key belongs to
    getStoreName(key) {
        const storeMap = {
            'members': 'members',
            'loans': 'loans',
            'payments': 'payments',
            'savings': 'savings',
            'withdrawals': 'withdrawals',
            'auditLog': 'auditLog',
            'userRole': 'userRole'
        };
        return storeMap[key] || 'members';
    }
};

// Make IndexedDBManager globally available
window.IndexedDBManager = IndexedDBManager;

// Initialize IndexedDB immediately when the script loads (not waiting for DOMContentLoaded)
IndexedDBManager.init()
    .then(() => {
        console.log('IndexedDB initialized successfully');
        window.IndexedDBReady = true;
        // Dispatch event to notify other scripts
        window.dispatchEvent(new Event('indexeddbready'));
    })
    .catch(err => {
        console.error('Failed to initialize IndexedDB:', err);
        window.IndexedDBReady = false;
        alert('Warning: IndexedDB not available. Some features may not work properly.');
    });

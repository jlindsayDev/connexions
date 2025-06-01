export const indexed_database = () => {
    const request = window.indexedDB.open("MyTestDatabase", 3);
    let db;

    request.onerror = (_event) => {
        // Do something with request.error!
    };
    request.onsuccess = (_event) => {
        // Do something with request.result!
    };

    request.onsuccess = (_event) => {
        // Start a new transaction
        db = request.result;
    };
};

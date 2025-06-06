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

// https://gist.github.com/JamesMessinger/a0d6389a5d0e3a24814b
// const createExample = () => {
//     // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
//     var indexedDB =
//         window.indexedDB ||
//         window.mozIndexedDB ||
//         window.webkitIndexedDB ||
//         window.msIndexedDB ||
//         window.shimIndexedDB;

//     // Open (or create) the database
//     var open = indexedDB.open("MyDatabase", 1);

//     // Create the schema
//     open.onupgradeneeded = () => {
//         var db = open.result;
//         var store = db.createObjectStore("MyObjectStore", { keyPath: "id" });
//         var index = store.createIndex("NameIndex", ["name.last", "name.first"]);
//     };

//     open.onsuccess = () => {
//         // Start a new transaction
//         var db = open.result;
//         var tx = db.transaction("MyObjectStore", "readwrite");
//         var store = tx.objectStore("MyObjectStore");
//         var index = store.index("NameIndex");

//         // Add some data
//         store.put({ id: 12345, name: { first: "John", last: "Doe" }, age: 42 });
//         store.put({
//             id: 67890,
//             name: { first: "Bob", last: "Smith" },
//             age: 35,
//         });

//         // Query the data
//         var getJohn = store.get(12345);
//         var getBob = index.get(["Smith", "Bob"]);

//         getJohn.onsuccess = () => {
//             console.log(getJohn.result.name.first); // => "John"
//         };

//         getBob.onsuccess = () => {
//             console.log(getBob.result.name.first); // => "Bob"
//         };

//         // Close the db when the transaction is done
//         tx.oncomplete = () => {
//             db.close();
//         };
//     };
// };

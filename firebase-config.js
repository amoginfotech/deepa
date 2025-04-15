// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA5Kqq0KJwDUPb2Jh1swSb5VO-WouqBwLw",
    authDomain: "algoprime-3726e.firebaseapp.com",
    projectId: "algoprime-3726e",
    storageBucket: "algoprime-3726e.firebasestorage.app",
    messagingSenderId: "864830117471",
    appId: "1:864830117471:web:575abc2925990a96b46dea",
    measurementId: "G-9FQTN8FD27"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');

    // Initialize Firestore
    window.db = firebase.firestore();
    console.log('Firestore initialized successfully');

    // Test database connection
    window.db.collection('properties').get()
        .then(() => {
            console.log('Successfully connected to Firestore');
            document.dispatchEvent(new Event('firestoreReady'));
        })
        .catch(error => {
            console.error('Error connecting to Firestore:', error);
            if (error.code === 'permission-denied') {
                console.error('Firebase Security Rules are preventing access. Please check your Firestore rules in Firebase Console.');
                alert('Access to database denied. Please ensure you have proper permissions.');
            } else if (error.code === 'not-found') {
                console.error('Collection or document not found. Please check if the collection exists.');
            } else {
                console.error('Unexpected error:', error.message);
            }
        });
} catch (error) {
    console.error('Error initializing Firebase:', error);
}
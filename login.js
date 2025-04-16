// Initialize Firebase Authentication
const auth = firebase.auth();

// Login form submission handler
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Sign in with email and password
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Redirect to home page after successful login
            window.location.href = 'home.html';
        })
        .catch((error) => {
            alert(error.message);
        });
});

// Check authentication state on page load
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, check if on home page
        if (window.location.pathname.includes('home.html')) {
            // Allow access to home page
        } else {
            // Redirect to home page
            window.location.href = 'home.html';
        }
    } else {
        // User is signed out, redirect to login page
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
        // Show login form
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('logoutButton').style.display = 'none';
    }
});

// Logout button handler
document.getElementById('logoutButton').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        alert(error.message);
    });
});
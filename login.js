// Initialize Firebase Authentication
const auth = firebase.auth();

// Session timeout variables
let timeoutTimer;
const SESSION_TIMEOUT = 300000; // 3 minutes

// Reset timer on user activity
function resetTimer() {
    clearTimeout(timeoutTimer);
    timeoutTimer = setTimeout(logoutUser, SESSION_TIMEOUT);
}

// Logout function
function logoutUser() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        alert(error.message);
    });
}

// Setup activity listeners
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetTimer);
});

// Initialize timer on page load
resetTimer();

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
        if (window.location.pathname.includes('home.html') || window.location.pathname.includes('view-property.html') || window.location.pathname.includes('view-rent.html') || window.location.pathname.includes('view-tenant.html')) {
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
    logoutUser();
});
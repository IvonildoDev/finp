// This file contains the main JavaScript logic for the finance tracker application.
// It initializes the application, handles routing, and manages user sessions.

document.addEventListener("DOMContentLoaded", function() {
    // Initialize the application
    initApp();

    // Function to initialize the application
    function initApp() {
        // Check if user is logged in
        if (isUserLoggedIn()) {
            // Redirect to dashboard if logged in
            window.location.href = "dashboard.html";
        } else {
            // Redirect to login if not logged in
            window.location.href = "login.html";
        }
    }

    // Function to check if user is logged in
    function isUserLoggedIn() {
        return localStorage.getItem("user") !== null;
    }

    // Add event listeners for navigation or other functionalities as needed
});
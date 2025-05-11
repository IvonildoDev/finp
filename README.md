# Finance Tracker

## Overview
The Finance Tracker is a web application designed to help users manage their finances effectively. It allows users to log in, track their income and expenses, and visualize their financial data through charts. The application stores user data locally in the browser's local storage, ensuring that no external database is required.

## Features
- User authentication with login and registration functionality.
- Dashboard displaying the user's financial balance and transaction history.
- Ability to add income and expenses.
- Visual representation of financial data through interactive charts.
- Responsive design for optimal viewing on various devices.

## Project Structure
```
finance-tracker
├── index.html          # Main entry point of the application
├── login.html          # User login page
├── dashboard.html      # User dashboard displaying financial data
├── css
│   ├── style.css       # General styles for the application
│   ├── login.css       # Styles specific to the login page
│   └── dashboard.css    # Styles specific to the dashboard page
├── js
│   ├── app.js          # Main JavaScript file for application logic
│   ├── auth.js         # User authentication functions
│   ├── transactions.js  # Functions for managing transactions
│   ├── charts.js       # Functions for rendering charts
│   └── storage.js      # Local storage management
├── assets
│   └── icons
│       ├── income.svg   # Icon representing income
│       ├── expense.svg  # Icon representing expenses
│       └── user.svg     # Icon representing user accounts
└── README.md           # Project documentation
```

## Setup Instructions
1. Clone the repository to your local machine.
2. Open the `index.html` file in your web browser to start using the application.
3. Use the login page to create an account or log in to an existing account.

## Usage
- After logging in, users can add transactions for income and expenses.
- The dashboard will display the current balance and a history of transactions.
- Charts will visualize the financial data for better insights.

## Technologies Used
- HTML
- CSS
- JavaScript
- Local Storage for data persistence

## License
This project is open-source and available for anyone to use and modify.
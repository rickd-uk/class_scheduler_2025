# Teacher Class Scheduler

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) A full-stack application designed to help teachers manage their class schedules, textbooks, templates, and days off efficiently. Built with Vue.js, Express, PostgreSQL, and Docker.

## Overview

This project provides a robust solution for teachers needing to organize their complex schedules. Originally a client-side tool, it has been re-architected into a modern full-stack application featuring:

* **Intuitive Interface**: A clean, two-column layout built with Vue.js for easy navigation and management.
* **Reliable Backend**: An Express.js API server handling business logic and data validation.
* **Persistent Storage**: A PostgreSQL database ensuring data integrity and persistence.
* **Containerized Environment**: Docker support for simplified setup and consistent development/deployment.

## Features

* **🗓️ Weekly & Daily Scheduling**: View and manage regular weekly schedules and specific daily plans.
* **📚 Resource Management**: Easily add, edit, and delete Classes, Textbooks, and School Year details.
* **📄 Template System**: Create, apply, and manage reusable schedule templates (e.g., "Standard Week", "Exam Week").
* **🚫 Days Off & Exceptions**: Mark specific days off (holidays, personal days) and handle daily schedule exceptions or modifications.
* **🔐 User Authentication**: Secure login and registration for multi-user support.
* **✨ Modern UI**: Responsive design built with Vue 3 and the Composition API.
* **🐳 Dockerized**: Includes `docker-compose.yml` for easy local setup of the frontend, backend, and database.

## Tech Stack

* **Frontend**:
    * [Vue.js](https://vuejs.org/) (v3) with Composition API
    * [Vuex](https://vuex.vuejs.org/) (v4) for State Management
    * [Vue Router](https://router.vuejs.org/) (v4) for Routing
    * [Axios](https://axios-http.com/) for API Communication
    * [Vite](https://vitejs.dev/) for Frontend Tooling
    * CSS (with variables for theming)
* **Backend**:
    * [Node.js](https://nodejs.org/)
    * [Express.js](https://expressjs.com/) Framework
    * [PostgreSQL](https://www.postgresql.org/) Database
    * [Sequelize](https://sequelize.org/) ORM (or your chosen ORM/driver like `pg`)
    * [bcrypt](https://www.npmjs.com/package/bcrypt) for Password Hashing
    * [JSON Web Tokens (JWT)](https://jwt.io/) for Authentication
* **Development**:
    * [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
    * [Git](https://git-scm.com/) for Version Control

## Setup Instructions 🚀

Detailed instructions for setting up the development environment (using Docker or running services individually) can be found in the setup guide:

➡️ **[SETUP.md](./SETUP.md)**

## Usage

1.  **Start the Application**: Follow the instructions in `SETUP.md` to get the application running (preferably using `docker-compose up`).
2.  **Access the App**: Open your browser to the frontend URL (e.g., `http://localhost:5173`).
3.  **Register/Login**: Create a new user account or log in with existing credentials.
4.  **Manage Resources**: Use the panels in the left column to add/edit classes, textbooks, school year info, and days off.
5.  **Manage Schedules**:
    * Use the "Templates" tab to create or apply schedule templates.
    * Use the "Weekly Schedule" tab to view and edit the regular weekly plan.
    * Use the "Daily Schedule" tab to view the schedule for a specific date, including any applied exceptions or days off.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

*(Optional: Add more specific contribution guidelines here or link to a CONTRIBUTING.md file)*

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` file for more information.

*(Optional: Create a LICENSE file with the MIT license text if you haven't already)*

---

*Happy Scheduling!* 🍎


# Teacher Class Scheduler: Setup Instructions

This document provides instructions on how to set up and run the Teacher Class Scheduler application locally using Docker.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

1.  **Git**: For cloning the repository. ([Download Git](https://git-scm.com/downloads))
2.  **Docker**: For running the application containers (includes Docker Engine and Docker Compose). ([Download Docker](https://www.docker.com/products/docker-desktop/))
3.  **Node.js & Yarn (Optional)**: Required only if you plan to run the client or server *outside* of Docker. We recommend Node.js LTS version. ([Download Node.js](https://nodejs.org/)) ([Install Yarn](https://classic.yarnpkg.com/en/docs/install))

## Getting Started

1.  **Clone the Repository**:
    Open your terminal or command prompt and clone the project repository:
    ```bash
    git clone <your-repository-url>
    cd <repository-directory-name>
    ```
    Replace `<your-repository-url>` with the actual URL of your Git repository and `<repository-directory-name>` with the name of the folder created by cloning.

## Environment Setup

The application uses environment variables for configuration (database credentials, API ports, etc.). You need to create `.env` files based on the provided examples.

1.  **Backend (`server`) Environment**:
    * Navigate to the `server` directory: `cd server`
    * Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    * **Edit `.env`**: Open the newly created `.env` file in a text editor. Review and adjust the variables, especially the `DATABASE_URL` or individual database connection variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`). The default values in `.env.example` should typically work with the provided Docker Compose setup.

2.  **Frontend (`client`) Environment**:
    * Navigate to the `client` directory: `cd ../client` (assuming you were in `server`)
    * Copy the example environment file:
        ```bash
        cp .env.example .env.development.local
        ```
        *(Note: Vite typically uses `.env.[mode].local` for local overrides)*
    * **Edit `.env.development.local`**: Open the file. The primary variable is usually `VITE_API_URL`. Ensure it points to where your backend server will be running (e.g., `http://localhost:3000` if the server runs on port 3000 locally or via Docker). The example file likely has the correct default for the Docker setup.

## Running the Application with Docker Compose

This is the recommended method for local development as it sets up the frontend, backend, and database containers together.

1.  **Navigate to the Project Root**: Make sure you are in the main project directory (the one containing the `docker-compose.yml` file and the `client` and `server` subdirectories).
    ```bash
    cd .. # If you were in the client directory
    ```

2.  **Build and Start Containers**: Run the following command:
    ```bash
    docker-compose up --build -d
    ```
    * `--build`: Forces Docker to rebuild the images if the Dockerfiles or related code have changed.
    * `-d`: Runs the containers in detached mode (in the background).

3.  **Accessing the Application**:
    * **Frontend**: Open your web browser and navigate to `http://localhost:<CLIENT_PORT>` (e.g., `http://localhost:5173` if you used the default Vite port). Check the `docker-compose.yml` file or Vite output for the exact port.
    * **Backend API**: The API will be accessible usually on `http://localhost:<SERVER_PORT>` (e.g., `http://localhost:3000`). The frontend is configured via `VITE_API_URL` to talk to this.

4.  **Viewing Logs (Optional)**:
    ```bash
    docker-compose logs -f # View logs for all services
    docker-compose logs -f client # View logs for the client service only
    docker-compose logs -f server # View logs for the server service only
    ```
    Press `Ctrl+C` to stop viewing logs.

5.  **Stopping the Application**:
    ```bash
    docker-compose down
    ```
    This stops and removes the containers defined in the `docker-compose.yml` file. Add `-v` if you also want to remove the database volume (data will be lost).

## Running Services Individually (Optional - Without Docker)

If you prefer not to use Docker, you can run the frontend and backend services directly. You will need to manage the PostgreSQL database separately (install it locally or use a cloud service).

1.  **Setup PostgreSQL**: Install PostgreSQL locally or ensure you have connection details for an existing instance. Create the necessary database and user. Update the `.env` file in the `server` directory with the correct connection details.

2.  **Run Backend (Express Server)**:
    * Navigate to the `server` directory: `cd server`
    * Install dependencies: `yarn install` (or `npm install`)
    * Run database migrations (if applicable - add specific command here)
    * Start the server: `yarn dev` (or `npm run dev`, check `server/package.json` for the correct script)

3.  **Run Frontend (Vue Client)**:
    * Open a **new terminal window**.
    * Navigate to the `client` directory: `cd client`
    * Install dependencies: `yarn install`
    * Ensure `VITE_API_URL` in `client/.env.development.local` points to your running backend (e.g., `http://localhost:3000`).
    * Start the Vite development server: `yarn dev`

4.  **Accessing the Application**: Open your browser to the URL provided by the Vite development server (usually `http://localhost:5173`).

## Troubleshooting

* **Port Conflicts**: If Docker or local services fail to start due to port conflicts, check which application is using the required port and stop it, or change the port mapping in `docker-compose.yml` or your `.env` files.
* **Database Connection Issues**: Double-check the `DATABASE_URL` or individual connection variables in `server/.env`. Ensure the database container is running (`docker ps`) or your local PostgreSQL instance is active.
* **Vite Cache Issues**: If the frontend shows errors like `Failed to resolve import`, try stopping the Vite server (`Ctrl+C`), restarting it with `yarn dev --force`, and doing a hard refresh in the browser (Ctrl+Shift+R or Cmd+Shift+R).
* **Docker Build Errors**: Check the output during the `docker-compose up --build` step for specific errors in the Dockerfiles or during dependency installation within the containers.



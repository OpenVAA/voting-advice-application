# Quick start

1. Make sure you have `yarn` 4 and `docker` installed and that the latter is running.
2. Install dependencies for all workspaces:
   ```bash
   yarn install
   ```
3. Make a copy of the root `.env.example` file and rename the copy as `.env`.
4. Build and run development Docker images for the entire stack:
   ```bash
   yarn dev
   ```
5. Once the process is complete, your database should be filled with mock data unless you edited that part of the `.env` file.
6. See the app live at http://localhost:1337/
7. Access the backend at http://localhost:5173/
   - Username `admin`
   - Password `admin`

- If you run into errors, try checking the tips related to Docker in [Troubleshooting](troubleshooting.md#troubleshooting).

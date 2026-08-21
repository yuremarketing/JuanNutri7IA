# Project Rules

## Credentials & Authentication
Whenever you need an authorization token, API key, or credentials (such as a GitHub token) to perform actions like pushing code, deploying, or accessing third-party services, **ALWAYS check the `.env` file first**. Do not ask the user for credentials before verifying if they already exist in `.env`.

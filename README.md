# Decentralized Skill Verification System Canister

**Decentralized Skill Verification System** is a decentralized platform that allows users to add their profiles, claim skills, have them verified by peers, and build a decentralized reputation. This project enables users to create accounts, add skills to their profiles, and receive ratings and comments and ratings from others.

## Features

### User Management

- **Create Users**: Users can create their profiles with a unique name and age.
- **Retrieve User Profiles**: Fetch user profiles to view their skills and verification status.
- **Update User Profiles**: Users can update their name and age.
- **Delete Users**: Users can be deleted from the system.

### Skill Management

- **Add Skills**: Users can add multiple skills to their profiles.
- **Verify Skills**: Other users can verify skills by providing a rating (1-5) and a comment.
- **Remove Skills**: Users can remove specific skills from their profiles.
- **Get All Skills**: Retrieve all skills associated with a user.

## Technology Stack

- **TypeScript**: Type-safe JavaScript for easier code management.
- **Azle**: A framework for developing canisters on the Internet Computer using TypeScript.
- **Express**: Minimal web framework for building REST APIs.
- **Internet Computer**: Decentralized cloud infrastructure for scalable web applications.

## Installation

To set up and run the project locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/skill-verification-system.git
   ```

2. **Install dependencies**: Navigate to the project folder and install Node.js packages:
   ```bash
   cd skill-verification-system
   npm install
   ```
   _If you encounter an error when importing body and validationResult from express-validator, you can do *```npm install express-validator```*_


3. **Start the Internet Computer locally**: Use DFX to start the local Internet Computer network:
   ```bash
   dfx start --host 127.0.0.1:8000 --clean --background
   ```

4. **Deploy the canister**: Deploy the canister code to the local IC instance:
   ```bash
   dfx deploy
   ```

## Usage

### Accessing the Canister

Once the canister is deployed, you can make API requests to interact with the skill verification system. Follow these steps to get the URL and start using it:

1. **Get the deployed canister's ID**:
   ```bash
   dfx canister id skill_verification_system
   ```

2. **Replace the canister ID in the following URL format**:
   ```bash
   http://<CANISTER_ID>.localhost:8000
   ```

   **Example CANISTER_ID (bkyz2-fmaaa-aaaaa-qaaaq-cai)**
   ```
   http://bkyz2-fmaaa-aaaaa-qaaaq-cai.localhost:8000
   ```

## API Endpoints

### 1. Create a User

- **Method**: `POST`
- **Endpoint**: `/users`
- **Description**: Creates a new user profile.

  **Request Body**:
  ```json
  {
    "name": "Alice",
    "age": 30
  }
  ```

  **Example**
  ```bash
  curl -X POST http://<CANISTER_ID>.localhost:8000/users -H "Content-Type: application/json" -d '{"name": "Alice", "age": 30}'
  ```

### 2. Add Skill(s) to a User's Profile

- **Method**: `POST`
- **Endpoint**: `/users/:id/skills`
- **Description**: Adds one or multiple skills to a user's profile.

  **Request Body**:
  ```json
  {
    "skills": [
      {"name": "JavaScript"},
      {"name": "TypeScript"}
    ]
  }
  ```

  **Example**
  ```bash
  curl -X POST http://<CANISTER_ID>.localhost:8000/users/<USER_ID>/skills -H "Content-Type: application/json" -d '{"skills": [{"name": "JavaScript"}, {"name": "TypeScript"}]}'
  ```

### 3. Verify a Skill by Rating It

- **Method**: `POST`
- **Endpoint**: `/users/:userId/skills/:skillName/verify`
- **Description**: Verifies a skill by providing a rating and comment.

  **Request Body**:
  ```json
  {
    "userId": "<VERIFIER_USER_ID>",
    "score": 5,
    "comment": "Excellent knowledge of JavaScript!"
  }
  ```

  **Example**
  ```bash
  curl -X POST http://<CANISTER_ID>.localhost:8000/users/<USER_ID>/skills/JavaScript/verify -H "Content-Type: application/json" -d '{"userId": "<VERIFIER_USER_ID>", "score": 5, "comment": "Excellent knowledge of JavaScript!"}'
  ```

### 4. Retrieve a User's Profile

- **Method**: `GET`
- **Endpoint**: `/users/:id`
- **Description**: Retrieves a user's profile, including their skills and verification status.

  **Example**
  ```bash
  curl -X GET http://<CANISTER_ID>.localhost:8000/users/<USER_ID>
  ```

### 5. Get All Users

- **Method**: `GET`
- **Endpoint**: `/users`
- **Description**: Retrieves a list of all user profiles.

  **Example**
  ```bash
  curl -X GET http://<CANISTER_ID>.localhost:8000/users
  ```

### 6. Delete a User by ID

- **Method**: `DELETE`
- **Endpoint**: `/users/:id`
- **Description**: Deletes a user profile by ID.

  **Example**
  ```bash
  curl -X DELETE http://<CANISTER_ID>.localhost:8000/users/<USER_ID>
  ```

### 7. Update User Profile

- **Method**: `PUT`
- **Endpoint**: `/users/:id`
- **Description**: Updates a user's profile.

  **Request Body**:
  ```json
  {
    "name": "Alice Updated",
    "age": 31
  }
  ```

  **Example**
  ```bash
  curl -X PUT http://<CANISTER_ID>.localhost:8000/users/<USER_ID> -H "Content-Type: application/json" -d '{"name": "Alice Updated", "age": 31}'
  ```

### 8. Get All Skills for a User

- **Method**: `GET`
- **Endpoint**: `/users/:id/skills`
- **Description**: Retrieves all skills for a specific user.

  **Example**
  ```bash
  curl -X GET http://<CANISTER_ID>.localhost:8000/users/<USER_ID>/skills
  ```

### 9. Remove a Skill from a User's Profile

- **Method**: `DELETE`
- **Endpoint**: `/users/:id/skills/:skillName`
- **Description**: Removes a specific skill from the user's profile.

  **Example**
  ```bash
  curl -X DELETE http://<CANISTER_ID>.localhost:8000/users/<USER_ID>/skills/JavaScript
  ```

## Contributions

I welcome contributions to this project! If you’d like to get involved, please follow these steps:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make your modifications.
4. Submit a pull request.

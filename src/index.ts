import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit'; // Rate limiting package

/**
 * `usersStorage` - a key-value data structure used to store user profiles.
 * {@link StableBTreeMap} is used for storing user profiles with efficient lookups.
 */
class User {
    id: string;
    name: string;
    age: number; // Added age property
    skills: Skill[];
}

class Skill {
    name: string;
    verified: boolean;
    ratings: Rating[];
}

class Rating {
    userId: string;
    score: number; // Rating score (1-5)
    comment: string;
    createdAt: Date;
}

const usersStorage = StableBTreeMap<string, User>(0);
const app = express();
app.use(express.json());

// Rate limiting middleware for sensitive routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});

app.use(limiter);

/**
 * Error handling middleware
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.message);
    res.status(500).json({ error: err.message });
});

/**
 * Utility function to get the current date from the IC timestamp.
 */
function getCurrentDate(): Date {
    const timestamp = Number(ic.time());
    return new Date(timestamp / 1000_000); // Convert from nanoseconds to milliseconds
}

/**
 * Validates user input data using express-validator.
 */
const userInputValidator = [
    body('name').isString().withMessage('Name is required and must be a string.'),
    body('age').isInt({ min: 0 }).withMessage('Age is required and must be a positive integer.')
];

/**
 * Validates skill input data using express-validator.
 */
const skillInputValidator = [
    body('skills.*.name').isString().withMessage('Skill name is required and must be a string.')
];

/**
 * Create a new user
 */
app.post("/users", userInputValidator, (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user: User = {
            id: uuidv4(),
            skills: [],
            ...req.body
        };

        usersStorage.insert(user.id, user);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
});

/**
 * Add multiple skills to a user's profile
 */
app.post("/users/:id/skills", skillInputValidator, (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id;
        const user = usersStorage.get(userId).Some;

        if (!user) {
            return res.status(404).send(`User with id=${userId} not found`);
        }

        const skills: Skill[] = req.body.skills; // Expecting an array of skills
        if (!Array.isArray(skills)) {
            return res.status(400).json({ error: 'Skills must be an array.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        skills.forEach(skill => {
            user.skills.push({
                name: skill.name,
                verified: false,
                ratings: []
            });
        });

        usersStorage.insert(userId, user);
        res.status(201).json(user.skills);
    } catch (error) {
        next(error);
    }
});

/**
 * Middleware for validating rating input using express-validator
 */
const validateRatingInput = [
    body('userId').isString().withMessage('User ID is required and must be a string.'),
    body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be an integer between 1 and 5.'),
    body('comment').optional().isString().withMessage('Comment must be a string.')
];

/**
 * Verify a skill by rating it
 */
app.post("/users/:userId/skills/:skillName/verify", validateRatingInput, (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.params.userId;
        const skillName = req.params.skillName;
        const user = usersStorage.get(userId).Some;

        if (!user) {
            return res.status(404).send(`User with id=${userId} not found`);
        }

        // Check if the verifier exists
        const verifierId = req.body.userId;
        const verifier = usersStorage.get(verifierId).Some; // Check if verifier exists

        if (!verifier) {
            return res.status(404).send(`Verifier with id=${verifierId} not found`);
        }

        const skill = user.skills.find(s => s.name === skillName);
        if (!skill) {
            return res.status(404).send(`Skill ${skillName} not found for user ${userId}`);
        }

        // Check for existing rating
        const existingRating = skill.ratings.find(r => r.userId === verifierId);
        if (existingRating) {
            return res.status(400).send(`User ${verifierId} has already rated the skill ${skillName}.`);
        }

        const rating: Rating = {
            userId: verifierId,
            score: req.body.score,
            comment: req.body.comment,
            createdAt: getCurrentDate()
        };

        skill.ratings.push(rating);
        skill.verified = skill.ratings.length > 0; // Mark as verified if there are ratings
        usersStorage.insert(userId, user);
        res.status(200).json(skill);
    } catch (error) {
        next(error);
    }
});

/**
 * Get a user's profile
 */
app.get("/users/:id", (req: Request, res: Response) => {
    const userId = req.params.id;
    const user = usersStorage.get(userId).Some;

    if (!user) {
        return res.status(404).send(`User with id=${userId} not found`);
    }
    res.json(user);
});

/**
 * Get all users
 */
app.get("/users", (req: Request, res: Response) => {
    const users = usersStorage.items(); // Use items() to get all users
    res.json(users);
});

/**
 * Delete a user by ID
 */

app.delete("/users/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id;
        const user = usersStorage.get(userId).Some;

        if (!user) {
            return res.status(404).send(`User with id=${userId} not found`);
        }

        usersStorage.remove(userId); // Assuming remove() deletes the user
        res.status(204).send(); // No content
    } catch (error) {
        next(error);
    }
});

/**
 * Update user profile
 */

app.put("/users/:id", userInputValidator, (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.params.id;
        const user = usersStorage.get(userId).Some;

        if (!user) {
            return res.status(404).send(`User with id=${userId} not found`);
        }

        const updatedUser: User = {
            ...user,
            ...req.body
        };

        usersStorage.insert(userId, updatedUser);
        res.status(200).json(updatedUser);
    } catch (error) {
        next(error);
    }
});

/**
 * Get all skills for a user
 */
app.get("/users/:id/skills", (req: Request, res: Response) => {
    const userId = req.params.id;
    const user = usersStorage.get(userId).Some;

    if (!user) {
        return res.status(404).send(`User with id=${userId} not found`);
    }
    res.json(user.skills);
});

/**
 * Remove a skill from a user's profile
 */
app.delete("/users/:id/skills/:skillName", (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id;
        const skillName = req.params.skillName;
        const user = usersStorage.get(userId).Some;

        if (!user) {
            return res.status(404).send(`User with id=${userId} not found`);
        }

        const skillIndex = user.skills.findIndex(s => s.name === skillName);
        if (skillIndex === -1) {
            return res.status(404).send(`Skill ${skillName} not found for user ${userId}`);
        }

        // Remove the skill from the array
        user.skills.splice(skillIndex, 1);
        
        // Update the user in storage
        usersStorage.insert(userId, user);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

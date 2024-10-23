import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express, { Request, Response, NextFunction } from 'express';

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
 * Validates user input data.
 */
function validateUserInput(user: Partial<User>): string[] {
    const errors: string[] = [];
    if (!user.name || typeof user.name !== 'string') {
        errors.push('Name is required and must be a string.');
    }
    if (user.age === undefined || typeof user.age !== 'number') {
        errors.push('Age is required and must be a number.');
    }
    return errors;
}

/**
 * Validates skill input data.
 */
function validateSkillInput(skill: Partial<Skill>): string[] {
    const errors: string[] = [];
    if (!skill.name || typeof skill.name !== 'string') {
        errors.push('Skill name is required and must be a string.');
    }
    return errors;
}

/**
 * Create a new user
 */
app.post("/users", (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validateUserInput(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

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
app.post("/users/:id/skills", (req: Request, res: Response, next: NextFunction) => {
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

        const errors = skills.map(validateSkillInput).flat();
        if (errors.length > 0) {
            return res.status(400).json({ errors });
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
 * Verify a skill by rating it
 */
app.post("/users/:userId/skills/:skillName/verify", (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.userId;
        const skillName = req.params.skillName;
        const user = usersStorage.get(userId).Some;

        if (!user) {
            return res.status(404).send(`User with id=${userId} not found`);
        }

        const skill = user.skills.find(s => s.name === skillName);
        if (!skill) {
            return res.status(404).send(`Skill ${skillName} not found for user ${userId}`);
        }

        const rating = {
            userId: req.body.userId,
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
app.put("/users/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id;
        const user = usersStorage.get(userId).Some;

        if (!user) {
            return res.status(404).send(`User with id=${userId} not found`);
        }

        const errors = validateUserInput(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
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

        user.skills.splice(skillIndex, 1); // Remove the skill
        usersStorage.insert(userId, user);
        res.status(204).send(); // No content
    } catch (error) {
        next(error);
    }
});

/**
 * Start the server and handle any startup errors
 */
export default Server(() => {
    return app.listen(3000, () => {
        console.log('Skill Verification Server started on port 3000');
    });
});

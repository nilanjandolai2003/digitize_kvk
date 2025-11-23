// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const  AuditLog  = require('../models/AuditLog');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 1500 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Validation middleware
const validateRegister = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email'),
    body('password')
        .isLength({ min: 6 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must be at least 6 characters and contain uppercase, lowercase, and number'),
    body('kvkName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('KVK name must be less than 100 characters')
];

const validateLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
            issuer: 'kvk-system',
            audience: 'kvk-users'
        }
    );
};

// Register new user
router.post('/register', authLimiter, validateRegister, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, email, password, role = 'user', kvkName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.username === username 
                    ? 'Username already exists' 
                    : 'Email already exists'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            role,
            kvkName
        });

        await user.save();

        // Log the registration
        await new AuditLog({
            action: 'CREATE',
            resourceType: 'USER',
            resourceId: user._id,
            userId: user._id,
            userEmail: user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { action: 'user_registration' }
        }).save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    kvkName: user.kvkName
                },
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login user
router.post('/login', authLimiter, validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // Find user by username or email
        const user = await User.findOne({
            $or: [{ username }, { email: username }],
            isActive: true
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Log the login
        await new AuditLog({
            action: 'LOGIN',
            resourceType: 'USER',
            resourceId: user._id,
            userId: user._id,
            userEmail: user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { login_time: new Date() }
        }).save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    kvkName: user.kvkName,
                    lastLogin: user.lastLogin
                },
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

// Update user profile
router.put('/profile', auth, [
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email'),
    body('kvkName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('KVK name must be less than 100 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, kvkName } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }

        // Update user
        const oldData = { email: user.email, kvkName: user.kvkName };
        if (email) user.email = email;
        if (kvkName !== undefined) user.kvkName = kvkName;

        await user.save();

        // Log the update
        await new AuditLog({
            action: 'UPDATE',
            resourceType: 'USER',
            resourceId: user._id,
            userId: user._id,
            userEmail: user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            changes: { from: oldData, to: { email, kvkName } }
        }).save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// Change password
router.put('/change-password', auth, [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must be at least 6 characters and contain uppercase, lowercase, and number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Log the password change
        await new AuditLog({
            action: 'UPDATE',
            resourceType: 'USER',
            resourceId: user._id,
            userId: user._id,
            userEmail: user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { action: 'password_change' }
        }).save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

// Refresh token
router.post('/refresh', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('username email role kvkName');
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            data: { 
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    kvkName: user.kvkName
                },
                token 
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token'
        });
    }
});

// Logout
router.post('/logout', auth, async (req, res) => {
    try {
        // Log the logout
        await new AuditLog({
            action: 'LOGOUT',
            resourceType: 'USER',
            resourceId: req.user.userId,
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { logout_time: new Date() }
        }).save();

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

// Get all users (admin only)
router.get('/users', auth, async (req, res) => {
    try {
        // Check if user is admin
        const currentUser = await User.findById(req.user.userId);
        if (currentUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const { page = 1, limit = 10, search = '', role = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = {};
        if (search) {
            searchQuery.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { kvkName: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) {
            searchQuery.role = role;
        }

        const [users, total] = await Promise.all([
            User.find(searchQuery)
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip),
            User.countDocuments(searchQuery)
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Update user status (admin only)
router.put('/users/:id/status', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.userId);
        if (currentUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const { isActive } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await new AuditLog({
            action: 'UPDATE',
            resourceType: 'USER',
            resourceId: user._id,
            userId: req.user.userId,
            userEmail: currentUser.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            changes: { status: isActive ? 'activated' : 'deactivated' }
        }).save();

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: { user }
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
});

module.exports = router;
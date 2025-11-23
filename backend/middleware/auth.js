// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.header('x-auth-token') ||
                     req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
            
            // Check if user still exists and is active
            const user = await User.findById(decoded.userId).select('username email role kvkName isActive');
            
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive'
                });
            }

            req.user = {
                userId: decoded.userId,
                username: user.username,
                email: user.email,
                role: user.role,
                kvkName: user.kvkName
            };
            
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Token is not valid'
            });
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                 req.header('x-auth-token') ||
                 req.cookies?.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
            const user = await User.findById(decoded.userId).select('username email role kvkName isActive');
            
            if (user && user.isActive) {
                req.user = {
                    userId: decoded.userId,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    kvkName: user.kvkName
                };
            }
        } catch (error) {
            // Ignore token errors for optional auth
        }
    }
    
    next();
};

module.exports = { auth, authorize, optionalAuth };
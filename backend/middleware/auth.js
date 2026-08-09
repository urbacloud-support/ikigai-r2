import jwt from 'jsonwebtoken';

export const requireAuth = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized: No token provided' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = decoded; // Contains { id, email, role }

            // If roles are specified, check if the user has one of them
            if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
                return res.status(403).json({ error: `Forbidden: Requires one of roles [${allowedRoles.join(', ')}]` });
            }

            next();
        } catch (error) {
            console.error('Auth Error:', error.message);
            return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        }
    };
};

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const ejs = require('ejs');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Database setup
const db = new sqlite3.Database('./database.db');

// Create tables if they don't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            is_admin INTEGER DEFAULT 0,
            profile_pic TEXT
        )
    `);
    
    // Add initial admin user if none exists
    db.get("SELECT * FROM users WHERE is_admin = 1", (err, row) => {
        if (!row) {
            const adminPassword = crypto.randomBytes(8).toString('hex');
            db.run(
                "INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)",
                ["admin", adminPassword]
            );
            console.log(`Admin created with password: ${adminPassword}`);
        }
    });
});

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Session middleware
app.use(session({
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    }
}));

// CSRF middleware
app.use((req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(16).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect(req.session.user.is_admin ? '/admin' : '/user');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", 
        [username, password], (err, user) => {
            if (err || !user) {
                return res.render('login', { error: 'Invalid credentials' });
            }
            
            req.session.user = user;
            res.redirect(user.is_admin ? '/admin' : '/user');
    });
});

app.get('/user', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    if (req.session.user.is_admin) return res.redirect('/admin');
    
    res.render('user-dashboard', { user: req.session.user });
});

app.get('/admin', (req, res) => {
    if (!req.session.user || !req.session.user.is_admin) {
        return res.redirect('/login');
    }
    
    db.all("SELECT id, username, is_admin, profile_pic FROM users", (err, users) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        
        res.render('admin-dashboard', { 
            user: req.session.user,
            users: users 
        });
    });
});

app.post('/update-profile', (req, res) => {
    if (!req.session.user) return res.status(403).send('Unauthorized');
    
    // CSRF protection
    if (req.headers['x-csrf-token'] !== req.session.csrfToken) {
        return res.status(403).send('CSRF token mismatch');
    }
    
    const profilePic = req.body.profile_pic;
    
    db.run(
        "UPDATE users SET profile_pic = ? WHERE id = ?",
        [profilePic, req.session.user.id],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error updating profile');
            }
            
            req.session.user.profile_pic = profilePic;
            res.redirect('/user');
        }
    );
});

app.post('/promote-user', (req, res) => {
    if (!req.session.user || !req.session.user.is_admin) {
        return res.status(403).send('Unauthorized');
    }
    
    // CSRF protection
    if (req.headers['x-csrf-token'] !== req.session.csrfToken) {
        return res.status(403).send('CSRF token mismatch');
    }
    
    const userId = parseInt(req.body.user_id); // Ensure numeric ID
    
    if (isNaN(userId)) {
        return res.status(400).send('Invalid user ID');
    }
    
    db.run(
        "UPDATE users SET is_admin = 1 WHERE id = ?",
        [userId],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error promoting user');
            }
            res.redirect('/admin');
        }
    );
});

app.get('/profile/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    const userId = req.params.id;
    
    db.get(
        "SELECT id, username, profile_pic FROM users WHERE id = ?",
        [userId],
        (err, user) => {
            if (err || !user) {
                return res.status(404).send('User not found');
            }
            
            // Set proper content-type for SVG
            if (user.profile_pic && user.profile_pic.includes('<svg')) {
                res.setHeader('Content-Type', 'image/svg+xml');
                return res.send(user.profile_pic);
            }
            
            res.render('profile', { 
                currentUser: req.session.user,
                viewedUser: user 
            });
        }
    );
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
    console.log(`Web Pentesting Lab running on http://localhost:${port}`);
});
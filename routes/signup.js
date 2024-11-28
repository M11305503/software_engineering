const express = require('express');
const app = express.Router();

app.get('/', (req, res) => {
    res.render('signup/index');
});

app.post('/', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
        return res.status(400).send('所有欄位都是必填的');
    }

    try {
        // Insert plain text password into database
        const result = await req.app.connection.query(
            `INSERT INTO users (first_name, last_name, email, password) 
             VALUES (?, ?, ?, ?)`,
            [first_name, last_name, email, password] // Store plain text password
        );

        console.log('Insert result:', result); // For debugging
        res.redirect('/users'); // Redirect to user list after registration
    } catch (error) {
        console.error('Error during signup:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('電子郵件已存在');
        }
        res.status(500).send('註冊失敗');
    }
});

module.exports = app;

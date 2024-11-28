const express = require('express');
const app = express.Router();

// 獲取所有用戶（帶分頁）
app.get('/', async function (req, res) {
    const page = parseInt(req.query.page) || 1; // 預設第1頁
    const limit = parseInt(req.query.limit) || 25; // 預設每頁25筆
    const offset = (page - 1) * limit;

    try {
        const [countResult] = await req.app.connection.query("SELECT COUNT(*) AS total FROM users");
        const totalUsers = countResult[0].total;
        const totalPages = Math.ceil(totalUsers / limit);

        const maxVisiblePages = 5; // 最多顯示的頁碼數量
        let pages = [];

        if (totalPages <= maxVisiblePages) {
            // 如果總頁數小於等於限制數量，全部顯示
            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            // 省略部分頁碼
            if (page <= Math.ceil(maxVisiblePages / 2)) {
                pages = [...Array(maxVisiblePages - 1).keys()].map(i => i + 1);
                pages.push('...');
                pages.push(totalPages);
            } else if (page > totalPages - Math.floor(maxVisiblePages / 2)) {
                pages.push(1);
                pages.push('...');
                pages.push(...Array.from({ length: maxVisiblePages - 1 }, (_, i) => totalPages - maxVisiblePages + i + 2));
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(...Array.from({ length: maxVisiblePages - 4 }, (_, i) => page - Math.floor((maxVisiblePages - 4) / 2) + i));
                pages.push('...');
                pages.push(totalPages);
            }
        }

        const [data] = await req.app.connection.query(
            "SELECT user_id, first_name, last_name, email, password FROM users LIMIT ? OFFSET ?",
            [limit, offset]
        );

        res.render('users/index', {
            data: data,
            currentPage: page,
            totalPages: totalPages,
            pages: pages,
            hasPrevious: page > 1,
            hasNext: page < totalPages,
            previousPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null,
            limit: limit,
            partials: { row: 'users/row' }
        });
    } catch (err) {
        console.error("Error fetching users: ", err);
        res.status(500).send({ message: '查詢用戶失敗', error: err.sqlMessage });
    }
});

// 添加新用戶
app.post('/', async function (req, res) {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
        return res.status(400).send('所有欄位都是必填的');
    }

    try {
        const [result] = await req.app.connection.query(
            "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)",
            [first_name, last_name, email, password]
        );

        res.render('users/row', {
            user_id: result.insertId,
            first_name: first_name,
            last_name: last_name,
            email: email,
            password: password
        });
    } catch (err) {
        console.error("Error adding user: ", err);
        res.status(500).send({ message: '新增用戶失敗', error: err.sqlMessage });
    }
});

// 刪除用戶
app.delete('/:user_id', async function (req, res) {
    try {
        await req.app.connection.query("DELETE FROM users WHERE user_id = ?", [req.params.user_id]);
        res.send("");
    } catch (err) {
        console.error("Error deleting user: ", err);
        res.status(500).send({ message: '刪除用戶失敗', error: err.sqlMessage });
    }
});

// 獲取單個用戶
app.get('/:user_id', async function (req, res) {
    try {
        const [data] = await req.app.connection.query(
            "SELECT first_name, last_name, email, password FROM users WHERE user_id = ?",
            [req.params.user_id]
        );

        if (data.length === 0) {
            return res.status(404).send({ message: '用戶未找到' });
        }

        res.render('users/edit', {
            user_id: req.params.user_id,
            first_name: data[0].first_name,
            last_name: data[0].last_name,
            email: data[0].email,
            password: data[0].password
        });
    } catch (err) {
        console.error("Error fetching user: ", err);
        res.status(500).send({ message: '查詢用戶失敗', error: err.sqlMessage });
    }
});

// 更新用戶
app.put('/:user_id', async function (req, res) {
    const { first_name, last_name, email, password } = req.body;
    const { user_id } = req.params;

    if (!first_name || !last_name || !email || !password) {
        return res.status(400).send('所有欄位都是必填的');
    }

    try {
        await req.app.connection.query(
            "UPDATE users SET first_name = ?, last_name = ?, email = ?, password = ? WHERE user_id = ?",
            [first_name, last_name, email, password, user_id]
        );

        const [updatedData] = await req.app.connection.query(
            "SELECT user_id, first_name, last_name, email, password FROM users WHERE user_id = ?",
            [user_id]
        );

        res.render('users/row', {
            user_id: updatedData[0].user_id,
            first_name: updatedData[0].first_name,
            last_name: updatedData[0].last_name,
            email: updatedData[0].email,
            password: updatedData[0].password
        });
    } catch (err) {
        console.error("Error updating user: ", err);
        res.status(500).send({ message: '更新用戶失敗', error: err.sqlMessage });
    }
});

module.exports = app;

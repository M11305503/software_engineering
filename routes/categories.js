const express = require('express');
const app = express.Router();

// 獲取所有分類
app.get('/', async function (req, res) {
    const SQL = "SELECT category_id, description FROM categories";
    try {
        const [data] = await req.app.connection.query(SQL);
        res.render('categories/index', {
            data: data,
            partials: { row: 'categories/row' }
        });
    } catch (err) {
        console.error("Error fetching data: ", err);
        res.status(500).send(err.sqlMessage);
    }
});

// 動態設置 AUTO_INCREMENT
async function setAutoIncrement(req) {
    const SQL_MAX_ID = "SELECT MAX(category_id) + 1 AS next_id FROM categories";
    const SQL_SET_INCREMENT = "ALTER TABLE categories AUTO_INCREMENT = ?";
    try {
        const [results] = await req.app.connection.query(SQL_MAX_ID);
        const nextId = results[0]?.next_id || 1;
        await req.app.connection.query(SQL_SET_INCREMENT, [nextId]);
        console.log(`AUTO_INCREMENT set to ${nextId}`);
    } catch (err) {
        console.error("Error setting AUTO_INCREMENT:", err);
        throw err;
    }
}

// 添加新分類
app.post('/', async function (req, res) {
    const description = req.body.description?.trim();

    if (!description) {
        return res.status(400).send('Description is required');
    }

    try {
        await setAutoIncrement(req);
        const SQL = "INSERT INTO categories (description) VALUES (?)";
        const [data] = await req.app.connection.query(SQL, [description]);
        res.render('categories/row', {
            category_id: data.insertId,
            description: description
        });
    } catch (err) {
        console.error("Error adding data: ", err);
        res.status(500).send(err.sqlMessage);
    }
});

// 刪除分類
app.delete('/:category_id', async function (req, res) {
    const SQL = "DELETE FROM categories WHERE category_id = ?";
    try {
        await req.app.connection.query(SQL, [req.params.category_id]);
        res.send("");
    } catch (err) {
        console.error("Error deleting data: ", err);
        res.status(500).send(err.sqlMessage);
    }
});

// 獲取單個分類
app.get('/:category_id', async function (req, res) {
    const SQL = "SELECT description FROM categories WHERE category_id = ?";
    try {
        const [data] = await req.app.connection.query(SQL, [req.params.category_id]);
        res.render('categories/edit', {
            category_id: req.params.category_id,
            description: data[0]?.description
        });
    } catch (err) {
        console.error("Error fetching data: ", err);
        res.status(500).send(err.sqlMessage);
    }
});

// 更新分類
app.put('/:category_id', async function (req, res) {
    const SQL_UPDATE = "UPDATE categories SET description = ? WHERE category_id = ?";
    const SQL_FETCH = "SELECT category_id, description FROM categories WHERE category_id = ?";
    const { description } = req.body;
    const { category_id } = req.params;

    if (!description) {
        return res.status(400).send('Description is required');
    }

    try {
        await req.app.connection.query(SQL_UPDATE, [description, category_id]);
        const [data] = await req.app.connection.query(SQL_FETCH, [category_id]);
        res.render('categories/row', {
            category_id: data[0]?.category_id,
            description: data[0]?.description
        });
    } catch (err) {
        console.error("Error updating data: ", err);
        res.status(500).send(err.sqlMessage);
    }
});

module.exports = app;

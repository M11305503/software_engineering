const express = require('express');
const app = express.Router();

// 通用 SQL 執行函數
async function doSQL(req, SQL, params) {
    if (!req.app.connection) {
        throw new Error('資料庫連線尚未初始化');
    }
    return req.app.connection.query(SQL, params);
}

// 獲取所有分類
app.get(['/', '/index'], async function (req, res) {
    const SQL = "SELECT category_id, description FROM categories";
    try {
        const [data] = await doSQL(req, SQL, []);
        res.render('products/index', { types: data });
    } catch (err) {
        console.error("Error fetching data: ", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 獲取指定類別的產品列表
app.get("/typedList", async function (req, res) {
    const SQL = "SELECT product_id, title, price FROM products WHERE category_id = ?";
    try {
        const [data] = await doSQL(req, SQL, [req.query.category_id]);
        res.render('products/list', { products: data });
    } catch (err) {
        console.error("Error fetching data: ", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 搜索產品頁面
app.get("/search", function (req, res) {
    res.render('products/search');
});

// 搜索結果
app.get("/searchResult", async function (req, res) {
    const keyword = `%${req.query.keyword.trim()}%`;
    const SQL = "SELECT product_id, title, price FROM products WHERE title LIKE ?";
    try {
        const [data] = await doSQL(req, SQL, [keyword]);
        res.render('products/list', { products: data });
    } catch (err) {
        console.error("Error searching products: ", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 新增產品頁面
app.get('/add', async function (req, res) {
    const SQL = "SELECT category_id, description FROM categories";
    try {
        const [data] = await doSQL(req, SQL, []);
        res.render('products/add', { types: data });
    } catch (err) {
        console.error("Error fetching categories: ", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 新增產品
app.post('/', async function (req, res) {
    const SQL = "INSERT INTO products (category_id, title, price) VALUES (?, ?, ?)";
    const { category_id, title, price } = req.body;

    if (!category_id || !title || !price) {
        return res.status(400).send('所有字段都是必需的');
    }

    try {
        const [data] = await doSQL(req, SQL, [category_id, title, price]);
        res.send(`Product ${title} added with ID ${data.insertId}`);
    } catch (err) {
        console.error("Error adding product: ", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 刪除產品
app.delete('/:product_id', async function (req, res) {
    const SQL = "DELETE FROM products WHERE product_id = ?";
    try {
        await doSQL(req, SQL, [req.params.product_id]);
        res.send("");
    } catch (err) {
        console.error("Error deleting product: ", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 獲取單個產品
app.get('/edit/:product_id', async function (req, res) {
    const SQL = "SELECT title, price FROM products WHERE product_id = ?";
    try {
        const [data] = await doSQL(req, SQL, [req.params.product_id]);
        if (data.length > 0) {
            res.send(`
                <tr>
                    <td>
                        <input type="text" name="title" value="${data[0].title}" required>
                    </td>
                    <td>
                        <input type="number" name="price" value="${data[0].price}" step="0.01" required>
                    </td>
                    <td>
                        <button hx-put="/products/${req.params.product_id}" 
                                hx-include="closest tr" 
                                hx-target="closest tr" 
                                hx-swap="outerHTML" 
                                class="btn btn-success btn-sm">
                            <i class="bi bi-check-lg"></i>
                        </button>
                    </td>
                </tr>
            `);
        } else {
            res.status(404).send("Product not found");
        }
    } catch (err) {
        console.error("Error fetching product: ", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 更新產品
app.put("/:product_id", async function (req, res) {
    const SQL = "UPDATE products SET title = ?, price = ? WHERE product_id = ?";
    const { title, price } = req.body;

    if (!title || !price) {
        return res.status(400).send('Title and price are required');
    }

    try {
        await doSQL(req, SQL, [title, price, req.params.product_id]);
        const SQL_SELECT = "SELECT product_id, title, price FROM products WHERE product_id = ?";
        const [data] = await doSQL(req, SQL_SELECT, [req.params.product_id]);
        if (data.length > 0) {
            res.send(`
                <tr>
                    <td>
                    <span class="btn btn-danger" hx-delete="/products/{{product_id}}" hx-target="closest tr">
                            <i class="bi bi-trash3-fill"></i>
                        </span>
                    ${data[0].product_id}
                    </td>
                    <td>${data[0].title}</td>
                    <td>$${data[0].price}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" 
                                hx-get="/products/edit/${data[0].product_id}" 
                                hx-target="closest tr" 
                                hx-swap="outerHTML">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                    </td>
                    <td>
                        <button class="btn btn-info btn-sm">
                            <i class="bi bi-arrow-right-circle"></i> Details
                        </button>
                    </td>
                </tr>
            `);
        } else {
            res.status(404).send("Product not found");
        }
    } catch (err) {
        console.error("Error updating product: ", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

module.exports = app;

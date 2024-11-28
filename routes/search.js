const express = require('express');
const app = express.Router();

// 通用 SQL 執行函數
async function doSQL(req, SQL, params) {
    if (!req.app.connection) {
        throw new Error('資料庫連線尚未初始化');
    }
    return req.app.connection.query(SQL, params);
}

// 獲取所有唯一的類別資料
app.get(['/', '/index'], async function (req, res) {
    const SQL = `
        SELECT DISTINCT 
            p.category_id, 
            c.description AS category_description 
        FROM 
            products p
        LEFT JOIN 
            categories c ON p.category_id = c.category_id
        ORDER BY 
            p.category_id
    `;
    try {
        const [data] = await doSQL(req, SQL, []);
        res.render('search/index', { types: data });
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 根據 category_id 獲取產品資料
app.get("/typedList", async function (req, res) {
    const SQL = "SELECT product_id, title, category_id, price FROM products WHERE category_id = ?";
    try {
        const [data] = await doSQL(req, SQL, [req.query.category_id]);
        res.render('search/products_list', {
            products: data,
            partials: { row: 'search/products_row' },
        });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 搜索產品頁面
app.get("/search", function (req, res) {
    res.render('search/search');
});

// 搜索結果
app.get("/searchResult", async function (req, res) {
    const keyword = `%${req.query.keyword.trim()}%`;
    const SQL = "SELECT product_id, title, category_id, price FROM products WHERE title LIKE ?";
    try {
        const [data] = await doSQL(req, SQL, [keyword]);
        res.render('search/products_list', {
            products: data,
            partials: { row: 'search/products_row' },
        });
    } catch (err) {
        console.error("Error fetching search results:", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 價格輸入頁面
app.get("/price", function (req, res) {
    res.render('search/price');
});

// 根據價格範圍獲取產品資料
app.get("/pricefilter", async function (req, res) {
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);

    if (isNaN(minPrice) || isNaN(maxPrice)) {
        return res.status(400).send("Invalid input parameters");
    }

    const SQL = `
        SELECT product_id, title, category_id, price 
        FROM products 
        WHERE CAST(price AS DECIMAL(10, 2)) BETWEEN ? AND ?
        ORDER BY CAST(price AS DECIMAL(10, 2)) ASC
    `;
    try {
        const [data] = await doSQL(req, SQL, [minPrice, maxPrice]);
        res.render('search/products_list', {
            products: data,
            partials: { row: 'search/products_row' },
        });
    } catch (err) {
        console.error("Error fetching products by price range:", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 依使用者查找頁面
app.get("/owner", function (req, res) {
    res.render('search/owner');
});

// 根據輸入的 seller_id 和關聯的 product_id 獲取產品資料
app.get("/ownerResult", async function (req, res) {
    const sellerId = `%${req.query.keyword.trim()}%`; // 使用模糊匹配
    const SQL = `
        SELECT DISTINCT
            t.seller_id, 
            p.product_id, 
            p.title, 
            p.category_id, 
            p.price 
        FROM 
            products p
        INNER JOIN 
            trans_combined t ON p.product_id = t.product_id
        WHERE 
            t.seller_id LIKE ?
        ORDER BY 
            p.product_id
    `;
    try {
        const [data] = await doSQL(req, SQL, [sellerId]);
        if (data.length === 0) {
            res.send("No results found for the given seller ID.");
        } else {
            res.render('search/owner_list', {
                products: data,
                partials: { row: 'search/owner_row' },
            });
        }
    } catch (err) {
        console.error("Error fetching products by owner:", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

// 更新產品資料
app.put("/:product_id", async function (req, res) {
    const SQL_UPDATE = "UPDATE products SET title = ?, category_id = ?, price = ? WHERE product_id = ?";
    const SQL_FETCH = "SELECT product_id, title, category_id, price FROM products WHERE product_id = ?";

    try {
        if (req.body.action === "update") {
            await doSQL(req, SQL_UPDATE, [
                req.body.title, req.body.category_id, req.body.price, req.params.product_id,
            ]);
        }
        const [data] = await doSQL(req, SQL_FETCH, [req.params.product_id]);
        res.render('search/products_row', {
            product_id: data[0].product_id,
            title: data[0].title,
            category_id: data[0].category_id,
            price: data[0].price,
        });
    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).send(err.sqlMessage || '資料庫錯誤');
    }
});

module.exports = app;

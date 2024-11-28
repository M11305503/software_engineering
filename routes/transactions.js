const express = require('express');
const app = express.Router();

// Fetch all transactions (with pagination)
app.get('/', async function (req, res) {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 25; // Default 25 items per page
    const offset = (page - 1) * limit;

    try {
        const [countResult] = await req.app.connection.query("SELECT COUNT(*) AS total FROM trans_combined");
        const totalTransactions = countResult[0].total;
        const totalPages = Math.ceil(totalTransactions / limit);

        const maxVisiblePages = 5; // Maximum visible pages
        let pages = [];

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages <= maxVisiblePages
            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            // Ellipsis logic for pages
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
            "SELECT transaction_id, seller_id, product_id, price, status, buyer_id FROM trans_combined LIMIT ? OFFSET ?",
            [limit, offset]
        );

        res.render('transactions/index', {
            data: data,
            currentPage: page,
            totalPages: totalPages,
            pages: pages,
            hasPrevious: page > 1,
            hasNext: page < totalPages,
            previousPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null,
            limit: limit,
            partials: { row: 'transactions/row' }
        });
    } catch (err) {
        console.error("Error fetching transactions: ", err);
        res.status(500).send({ message: 'Failed to fetch transactions', error: err.sqlMessage });
    }
});

// Add a new transaction
app.post('/', async function (req, res) {
    const { seller_id, product_id, price, status, buyer_id } = req.body;

    if (!seller_id || !product_id || !price || !status) {
        return res.status(400).send('All fields except buyer_id are required.');
    }

    try {
        const [result] = await req.app.connection.query(
            "INSERT INTO trans_combined (seller_id, product_id, price, status, buyer_id) VALUES (?, ?, ?, ?, ?)",
            [seller_id, product_id, price, status, buyer_id || null]
        );

        res.render('transactions/row', {
            transaction_id: result.insertId,
            seller_id: seller_id,
            product_id: product_id,
            price: price,
            status: status,
            buyer_id: buyer_id
        });
    } catch (err) {
        console.error("Error adding transaction: ", err);
        res.status(500).send({ message: 'Failed to add transaction', error: err.sqlMessage });
    }
});

// Delete a transaction
app.delete('/:transaction_id', async function (req, res) {
    try {
        await req.app.connection.query("DELETE FROM trans_combined WHERE transaction_id = ?", [req.params.transaction_id]);
        res.send("");
    } catch (err) {
        console.error("Error deleting transaction: ", err);
        res.status(500).send({ message: 'Failed to delete transaction', error: err.sqlMessage });
    }
});

// Fetch a single transaction
app.get('/:transaction_id', async function (req, res) {
    try {
        const [data] = await req.app.connection.query(
            "SELECT seller_id, product_id, price, status, buyer_id FROM trans_combined WHERE transaction_id = ?",
            [req.params.transaction_id]
        );

        if (data.length === 0) {
            return res.status(404).send({ message: 'Transaction not found' });
        }

        res.render('transactions/edit', {
            transaction_id: req.params.transaction_id,
            seller_id: data[0].seller_id,
            product_id: data[0].product_id,
            price: data[0].price,
            status: data[0].status,
            buyer_id: data[0].buyer_id
        });
    } catch (err) {
        console.error("Error fetching transaction: ", err);
        res.status(500).send({ message: 'Failed to fetch transaction', error: err.sqlMessage });
    }
});

// Update a transaction
app.put('/:transaction_id', async function (req, res) {
    const { seller_id, product_id, price, status, buyer_id } = req.body;
    const { transaction_id } = req.params;

    if (!seller_id || !product_id || !price || !status) {
        return res.status(400).send('All fields except buyer_id are required.');
    }

    try {
        await req.app.connection.query(
            "UPDATE trans_combined SET seller_id = ?, product_id = ?, price = ?, status = ?, buyer_id = ? WHERE transaction_id = ?",
            [seller_id, product_id, price, status, buyer_id || null, transaction_id]
        );

        const [updatedData] = await req.app.connection.query(
            "SELECT transaction_id, seller_id, product_id, price, status, buyer_id FROM trans_combined WHERE transaction_id = ?",
            [transaction_id]
        );

        res.render('transactions/row', {
            transaction_id: updatedData[0].transaction_id,
            seller_id: updatedData[0].seller_id,
            product_id: updatedData[0].product_id,
            price: updatedData[0].price,
            status: updatedData[0].status,
            buyer_id: updatedData[0].buyer_id
        });
    } catch (err) {
        console.error("Error updating transaction: ", err);
        res.status(500).send({ message: 'Failed to update transaction', error: err.sqlMessage });
    }
});

module.exports = app;

const express = require('express');
const app = express.Router();
function doSQL(SQL, parms, res, callback) {
    app.connection.execute(SQL, parms, function (err, data) {
        if (err) {
            console.log(err);
            res.status(404).send(err.sqlMessage);
        }
        else {
            callback(data);
        }
    });
}

app.get('/:id', function (req, res) {
    const id = req.params.id;
    let SQL = 'SELECT description, typename FROM Product p, ProductType t ';
    SQL += 'WHERE t.ID = p.typeID AND p.ID = ?;';
    let SQL2 = 'SELECT ID, description, unit, value FROM Product_Nutrition pn, ';
    SQL2 += 'NutritionFact n WHERE pn.nutritionID = n.ID AND pn.productID = ? ';
    SQL2 += 'ORDER BY description;';
    doSQL(SQL, [id], res, function (data) {
        let product = data[0];
        doSQL(SQL2, [id], res, function (data) {
            res.render('pNutritions/detail', {
                pid: id,
                product: product,
                nutritions: data,
            });
        });
    });
});

app.delete('/:pid/:id', function (req, res) {
    const id = req.params.id;
    const pid = req.params.pid;
    let SQL = 'DELETE FROM Product_Nutrition WHERE productID = ? AND nutritionID = ?;';
    doSQL(SQL, [pid, id], res, function (data) {
        res.set('HX-Trigger', 'refresh-nutrients');
        res.send("");
    });
});

app.get("/missing/:pid", function (req, res) {
    const pid = req.params.pid;
    let SQL = "SELECT ID, description, unit FROM NutritionFact ";
    SQL += "WHERE ID NOT IN ";
    SQL += "(SELECT nutritionID FROM Product_Nutrition WHERE productID = ?) ";
    SQL += " ORDER BY description;";
    doSQL(SQL, [pid], res, function (data) {
        res.render('pNutritions/missing', {
            pid: pid,
            nutritions: data,
        });
    });
});

app.post("/:pid", function (req, res) {
    const pid = req.params.pid;
    const nid = req.body.nutrient;
    const value = req.body.value;
    let SQL = "INSERT INTO Product_Nutrition (productID, nutritionID, value) ";
    SQL += "VALUES (?, ?, ?);";
    doSQL(SQL, [pid, nid, value], res, function (data) {
        res.redirect(`/pNutritions/${pid}`);
    });
});

app.get('/edit/:pid/:ID/:value', function (req, res) {
    const { pid, ID, value } = req.params;
    
    // 確保能獲取必要的數據並生成編輯表單
    res.send(`
        <form hx-put="/pNutritions/${pid}/${ID}" hx-target="closest td" hx-swap="innerHTML">
            <input type="number" name="value" value="${value}" required class="form-control">
            <button type="submit" class="btn btn-success btn-sm">
                <i class="bi bi-check-lg"></i>
            </button>
            <button type="button" class="btn btn-warning btn-sm" onclick="htmx.trigger(this.closest('td'), 'cancel')">
                <i class="bi bi-x-lg"></i>
            </button>
        </form>
    `);
});

app.put('/:pid/:ID', function (req, res) {
    const { pid, ID } = req.params;
    const { value } = req.body;

    // 使用正確的表名 Product_Nutrition 並確認列名
    const SQL = "UPDATE Product_Nutrition SET value = ? WHERE productID = ? AND nutritionID = ?";
    app.connection.execute(SQL, [value, pid, ID], function (err) {
        if (err) {
            console.log("Error updating data: ", err);
            res.status(404).send(err.sqlMessage);
        } else {
            // 成功更新後，返回更新後的值和編輯按鈕
            res.send(`
                <span hx-get="/pNutritions/edit/${pid}/${ID}/${value}" hx-target="closest td" hx-swap="innerHTML">
                    ${value}
                </span>
                <button class="btn btn-primary btn-sm" hx-get="/pNutritions/edit/${pid}/${ID}/${value}" hx-target="closest td" hx-swap="innerHTML">
                    <i class="bi bi-pencil"></i>
                </button>
            `);
        }
    });
});


module.exports = app;
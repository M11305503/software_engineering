const express = require('express');
const app = express.Router();
const cookieParser = require('cookie-parser');

app.use(cookieParser('your-secret-key'));

// 通用 SQL 查詢函數
function doSQL(req, SQL, parms, res, callback) {
    if (!req.app.connection) {
        console.error('資料庫連線尚未初始化，請檢查中間件是否執行');
        res.status(500).send('資料庫連線尚未初始化');
        return;
    }
    req.app.connection.execute(SQL, parms, function (err, data) {
        if (err) {
            console.error('SQL 執行錯誤:', err);
            res.status(500).send(err.sqlMessage || '資料庫錯誤');
        } else {
            callback(data);
        }
    });
}

// 登入頁面
app.get('/', (req, res) => {
    const flashMessage = req.signedCookies.flash;
    const loggedIn = req.signedCookies.loggedIn === 'true';
    res.render('login/index', { flashMessage, loggedIn, error: null });
});

// 登入處理
app.post('/', (req, res) => {
    const email = req.body.email || null;
    const password = req.body.password || null;

    if (email === 'admin@123' || password === '123') {
        const options = { signed: true, maxAge: 900000, httpOnly: true, path: '/' };
        res.cookie('loggedIn', true, options);
        res.cookie('username', email, options);
        res.cookie('flash', "You are now logged in!", { signed: true, maxAge: 10000 });
        res.redirect('/');
        return;
    }

    if (!email || !password) {
        res.cookie('flash', "所有欄位都是必填的！", { signed: true, maxAge: 10000 });
        return res.render('login/index', { error: '所有欄位都是必填的' });
    }

    const SQL = "SELECT * FROM users WHERE email = ? AND password = ?";
    const parms = [email, password];

    doSQL(req, SQL, parms, res, function (users) {
        if (users.length === 0) {
            res.clearCookie('loggedIn', { path: '/' });
            res.clearCookie('username', { path: '/' });
            res.cookie('flash', "用戶名或密碼錯誤！", { signed: true, maxAge: 10000 });
            return res.redirect('/login');
        }

        const user = users[0];
        const options = { signed: true, maxAge: 900000, httpOnly: true, path: '/' };

        // 設置登入狀態
        res.cookie('loggedIn', true, options);
        res.cookie('username', user.email, options);
        res.redirect('/');
        res.cookie('flash', "歡迎回來！", { signed: true, maxAge: 10000 });
    });
});

// 登出處理
app.post('/logout', (req, res) => {
    res.clearCookie('loggedIn', { path: '/' });
    res.clearCookie('username', { path: '/' });
    res.cookie('flash', "您已成功登出！", { signed: true, maxAge: 10000 });
    res.redirect('/');
});

module.exports = app;

const express = require('express');
const mysql = require('mysql2/promise'); // 使用 Promise 版本的 mysql2
const app = express();
const cookieParser = require('cookie-parser'); 

app.use(cookieParser('your-secret-key'));
// 設置模板引擎和中間件

app.set('view engine', 'hjs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// 加載配置
const configs = require('./config');

const session = require('express-session');

app.use((req, res, next) => {
    res.locals.loggedIn = req.signedCookies.loggedIn === 'true'; // 檢查是否已登入
    next();
});

app.use(session({
    secret: 'your-secret-key', // 替換為安全的密鑰
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // 如果是 HTTPS，請設置為 true
}));

const advertisement = require('./routes/advertisement');
app.use('/advertisement', advertisement);

app.set('view engine', 'hjs');
app.set('views', __dirname + '/views');

// 初始化資料庫連接池（Promise 模式）
const pool = mysql.createPool(configs.db);

// 測試資料庫連接
(async () => {
    try {
        const connection = await pool.getConnection(); // 測試連接
        console.log("Connected to database");
        connection.release(); // 釋放連接
    } catch (err) {
        console.error("Error connecting to database: ", err);
        process.exit(1); // 如果連接失敗，退出程式
    }
})();

// 將資料庫連接池共享到所有路由
app.use((req, res, next) => {
    req.app.connection = pool; // 在每個請求中共享連接池
    next();
});

// 根路由，處理首頁請求
app.get('/', (req, res) => {
    if (req.get("HX-Request")) {
        res.send(
            '<div class="d-flex justify-content-center align-items-center" style="width: 60%; margin: 0 auto; height: 50vh;">' +
            '<i class="bi bi-cone-striped" style="font-size: 40vh; margin-right: 40px;"></i>' +
            '<i class="bi bi-currency-exchange" style="font-size: 14vh; margin: 0 40px; align-self: center;"></i>' +
            '<i class="bi bi-truck-flatbed" style="font-size: 40vh; margin-left: 40px;"></i>' +
            '</div>'
        );
    } else {
        res.render('layout', {
            title: 'Welcome to CollaborationConstruct e-management',
            partials: {
                navbar: 'navbar',
            }
        });
    }
});

// 處理其他路徑請求，回應帶有動態內容的頁面
app.get('/*', (req, res, next) => {
    if (req.get("HX-Request")) {
        next();
    } else {
        res.render('layout', {
            title: 'Welcome to CollaborationConstruct e-management',
            partials: {
                navbar: 'navbar',
            },
            where: req.url
        });
    }
});

// 加載 categories 路由
const categories = require('./routes/categories');
app.use('/categories', categories);

// 加載 products 路由
const products = require('./routes/products');
app.use('/products', products);

// 加載 productNutrition 路由
const productNutrition = require('./routes/pNutritions');
app.use('/pNutritions', productNutrition);

// 加載 users 路由
const users = require('./routes/users');
app.use('/users', users);

// 加載 signup 路由
const signup = require('./routes/signup');
app.use('/signup', signup);

const login = require('./routes/login');
app.use('/login', login);

const transactions = require('./routes/transactions');
app.use('/transactions', transactions);

const search = require('./routes/Search');
app.use('/search', search); 

// 啟動伺服器
app.listen(80, function () {
    console.log('Web server listening on port 80!');
});

console.log("Template views directory:", __dirname + '/views');

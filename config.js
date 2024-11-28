const config = {
    db: {
        host: process.env.DB_HOST || "172.17.0.2",
        user: process.env.DB_USER || "websiteDB",
        password: process.env.DB_PASSWORD || "websiteDBPassword",
        database: process.env.DB_NAME || "websiteDB",
        connectTimeout: process.env.DB_CONNECT_TIMEOUT || 60000,
        connectionLimit: 30
    }
};

module.exports = config;
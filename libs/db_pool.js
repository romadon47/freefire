const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    connectionLimit: 5,
    database: 'my_fitness'
});

module.exports = pool;
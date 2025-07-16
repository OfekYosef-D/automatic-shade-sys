const mysql = require('mysql12');

const connection = mysql.createConnection({
    host: 'localhost',
    user:   'root', // Adjust the user as needed
    password: 'gal789', // Adjust the password as needed
    database: 'shade_system_test' 
});

connection.connect((err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database!');    
}))

module.exports=connection;

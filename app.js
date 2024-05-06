const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const path = require('path');

const app = express(); // Initialize Express
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views')); // Set the views directory
app.set('view engine', 'hbs');

// MySQL connection configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Change this to your MySQL username
    password: '', // Change this to your MySQL password
    database: 'bpe' // Change this to your database name
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define routes

// Render the index.hbs template for the homepage
app.get('/', (req, res) => {
    res.render('index');
});

// Render the medorder.hbs template for the medicine order page
app.get('/views/medorder', (req, res) => {
    // Example query to fetch data from MySQL based on status
    db.query('SELECT * FROM medvendororder WHERE status IS NULL', (err, pendingOrders) => {
        if (err) {
            res.status(500).send('Error fetching pending orders from database');
            return;
        }

        db.query('SELECT * FROM medvendororder WHERE status = 1', (err, receivedOrders) => {
            if (err) {
                res.status(500).send('Error fetching received orders from database');
                return;
            }

            res.render('medorder', {
                pendingOrders: pendingOrders,
                receivedOrders: receivedOrders
            }); // Render the medorder.hbs template and pass fetched data
        });
    });
});

// Handle POST requests to submit a new order
app.post('/', (req, res) => {
    const { medname, quantity, vendorname } = req.body;

    // Insert new order into MySQL
    db.query(
        'INSERT INTO medvendororder (medname, quantity, vendorname, date) VALUES (?, ?, ?, NOW())',
        [medname, quantity, vendorname],
        (err, result) => {
            if (err) {
                console.error('Error executing MySQL query:', err);
                res.status(500).send('Error inserting data into database');
                return;
            }
            console.log('New order added successfully:', result); // Log successful insertion
            res.redirect('/views/medorder'); // Redirect to medorder page after successful submission
        }
    );
});
// Route to handle GET requests to the Customer Record Management page
app.get('/customer-record', (req, res) => {
    // Example query to fetch data from MySQL
    db.query('SELECT * FROM customers', (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).send('Error fetching data from database');
            return;
        }
        res.render('customerRecord', { customers: result }); // Pass fetched data to customerRecord.hbs template
    });
});

// Handle POST requests to update status
app.post('/update-status', (req, res) => {
    const { orderid } = req.body;

    // Update status and recdate in MySQL for the specific orderid
    db.query(
        'UPDATE medvendororder SET status = 1, recdate = NOW() WHERE orderid = ?',
        [orderid],
        (err, result) => {
            if (err) {
                console.error('Error updating status and recdate:', err);
                res.status(500).send('Error updating status and recdate in database');
                return;
            }
            console.log('Status and recdate updated successfully:', result);
            res.send('Status and recdate updated successfully'); // Send a response indicating success
        }
    );
});

// Handle POST requests for deleting a medication
// Handle POST requests for deleting a medication
app.post('/medications/delete/:id', (req, res) => {
    console.log('Delete request received'); // Debugging output
    const medicationId = req.params.id;
    console.log('Medication ID:', medicationId); // Debugging output
    db.query('DELETE FROM Medications WHERE medication_id = ?', [medicationId], (error, results) => {
        if (error) {
            console.error('Error deleting medication:', error);
            res.status(500).send('Internal Server Error');
            res.redirect('/medication');
        }
        return;
    });
});

//delete customer recode
app.post('/customer-record-delete', (req, res) => {
    const { customerid } = req.body;
    db.query('DELETE FROM customers WHERE customerid = ?', [customerid], (error, results) => {
        if (error) {
            console.error('Error deleting customer account:', error);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Deleted customer with ID:', customerid);
            res.status(200).json({ message: `Customer with ID ${customerid} has been deleted.` });
        }
    });
});

app.post('/add-medicine', (req, res) => {
    const { medicationId, quantity } = req.body;

    // Fetch medicine details from the database
    const sql = `SELECT * FROM medication WHERE medication_id = ?`;
    connection.query(sql, [medicationId], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            res.status(404).send('Medicine not found');
            return;
        }

        const medicine = results[0];
        const subtotal = medicine.price * quantity;

        // Add medicine to the billmed table
        const insertSql = `INSERT INTO billmed (medicineid, medicinename, quantity, subtotal) VALUES (?, ?, ?, ?)`;
        connection.query(insertSql, [medicine.medication_id, medicine.name, quantity, subtotal], (err, result) => {
            if (err) throw err;

            // Update total price in the bills table
            const updateSql = `UPDATE bills SET total = total + ? WHERE billid = ?`;
            connection.query(updateSql, [subtotal, req.session.billId], (err, result) => {
                if (err) throw err;

                // Update medication quantity
                const updateQuantitySql = `UPDATE medication SET quantity = quantity - ? WHERE medication_id = ?`;
                connection.query(updateQuantitySql, [quantity, medicationId], (err, result) => {
                    if (err) throw err;

                    // Fetch updated selected medicines and total price
                    const selectedMedicinesSql = `SELECT * FROM billmed WHERE billid = ?`;
                    connection.query(selectedMedicinesSql, [req.session.billId], (err, results) => {
                        if (err) throw err;

                        const totalPriceSql = `SELECT total FROM bills WHERE billid = ?`;
                        connection.query(totalPriceSql, [req.session.billId], (err, totalPriceResult) => {
                            if (err) throw err;

                            res.status(200).json({
                                selectedMedicines: results,
                                totalPrice: totalPriceResult[0].total
                            });
                        });
                    });
                });
            });
        });
    });
});




// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

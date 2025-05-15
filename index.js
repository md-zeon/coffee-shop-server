const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('My Coffee Shop Server is brewing Coffee!');
})

app.listen(port, () => {
    console.log(`My Coffee Shop Server is Running on Port: ${port}`);
})
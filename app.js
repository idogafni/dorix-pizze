const express = require('express');
const { restaurant } = require('./server');
const app = express();
app.use(express.json());

app.post('/order', async (req, res) => {
    const orderId = await restaurant.createOrder(req.body);
    res.json({ orderId });
});

app.get('/order/:id', (req, res) => {
    const status = restaurant.getOrderStatus(req.params.id);
    if (status) {
        res.json(status);
    } else {
        res.status(404).send('Order not found');
    }
});

app.listen(3000, () => console.log('Server listening on port 3000'));

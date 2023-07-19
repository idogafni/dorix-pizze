const Queue = require('bull');

class PizzaOrder {
    constructor(orderId, toppings) {
        this.orderId = orderId;
        this.toppings = toppings;
        this.processingTime = {
            dough: 0,
            toppings: 0,
            oven: 0,
        };
    }

    async prepareDough() {
        await new Promise(resolve => setTimeout(resolve, process.env.DOUGH_TIME));
        this.processingTime.dough = process.env.DOUGH_TIME;
    }

    async addToppings() {
        await new Promise(resolve => setTimeout(resolve, this.toppings * process.env.TOPPING_TIME));
        this.processingTime.toppings = this.toppings * process.env.TOPPING_TIME;
    }

    async cook() {
        await new Promise(resolve => setTimeout(resolve, process.env.OVEN_TIME));
        this.processingTime.oven = process.env.OVEN_TIME;
    }
}

class Chef {
    constructor(type, numberOfChefs) {
        this.queue = Queue(type, 'redis://127.0.0.1:6379');
        this.queue.process(numberOfChefs, async (job, done) => {
            await job.data.pizza[`prepare${type.charAt(0).toUpperCase() + type.slice(1)}`]();
            done();
        });
    }

    addToQueue(pizza) {
        return this.queue.add({ pizza }, { jobId: `pizza-${pizza.orderId}-${this.queue.name}` });
    }
}

class Restaurant {
    constructor() {
        this.doughChefs = new Chef('dough', process.env.DOUGH_CHEFS);
        this.toppingChefs = new Chef('toppings', process.env.TOPPING_CHEFS);
        this.oven = new Chef('oven', 1);
        this.orders = {};
    }

    async createOrder(order) {
        const pizzas = order.map((pizza, index) => new PizzaOrder(index, pizza.toppings_amount));
        const orderId = Math.floor(Math.random() * 10000);
        this.orders[orderId] = pizzas;

        for (const pizza of pizzas) {
            const doughJob = await this.doughChefs.addToQueue(pizza);

            doughJob.finished().then(async () => {
                const toppingsJob = await this.toppingChefs.addToQueue(pizza);

                toppingsJob.finished().then(async () => {
                    const ovenJob = await this.oven.addToQueue(pizza);

                    ovenJob.finished().then(() => {
                        console.log(`Pizza ${pizza.orderId} is ready! Status: ${JSON.stringify(pizza.status)}`);
                    });
                });
            });
        }

        return orderId;
    }

    getOrderStatus(orderId) {
        return this.orders[orderId]?.map(pizza => pizza.status);
    }
}


const restaurant = new Restaurant();
module.exports = { restaurant };

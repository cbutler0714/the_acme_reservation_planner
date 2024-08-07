const express = require("express");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
const {
  client,
  createTables,
  createCustomer,
  createRestaurant,
  createReservation,
  fetchCustomers,
  fetchRestaurants,
  fetchReservations,
  destroyReservation,
} = require("./db");

app.use(require("morgan")("dev"));

app.get("/api/customers", async (req, res, next) => {
  try {
    res.send(await fetchCustomers());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/restaurants", async (req, res, next) => {
  try {
    res.send(await fetchRestaurants());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/reservations", async (req, res, next) => {
  try {
    res.send(await fetchReservations());
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/customers/:id/reservations", async (req, res, next) => {
  try {
    console.log(req.params.id);
    res.status(201).send(
      await createReservation({
        restaurant_id: req.body.restaurant_id,
        customer_id: req.params.id,
        date: req.body.date,
        party_count: req.body.party_count,
      })
    );
  } catch (ex) {
    next(ex);
  }
});

app.delete(
  "/api/customers/:customer_id/reservations/:id",
  async (req, res, next) => {
    try {
      await destroyReservation({
        customer_id: req.params.customer_id,
        id: req.params.id,
      });
      res.sendStatus(204);
    } catch (ex) {
      next(ex);
    }
  }
);

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({ error: err.message || err });
});

const init = async () => {
  console.log("connecting to database");
  await client.connect();
  console.log("connected to database");
  await createTables();
  console.log("created tables");
  const [moe, lucy, larry, ethyl, terrain, pub, chelsea] = await Promise.all([
    createCustomer("moe"),
    createCustomer("lucy"),
    createCustomer("larry"),
    createCustomer("ethyl"),
    createRestaurant("terrain"),
    createRestaurant("pub"),
    createRestaurant("chelsea"),
  ]);
  console.log(await fetchCustomers());
  console.log(await fetchRestaurants());

  const [reservation1, reservation2] = await Promise.all([
    createReservation({
      restaurant_id: terrain.id,
      customer_id: moe.id,
      date: "08/14/2024",
      party_count: 4,
    }),
    createReservation({
      restaurant_id: chelsea.id,
      customer_id: moe.id,
      date: "08/28/2024",
      party_count: 2,
    }),
  ]);
  console.log(await fetchReservations());
  await destroyReservation({
    id: reservation1.id,
    customer_id: moe.id,
  });
  console.log(await fetchReservations());

  app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
    console.log("some curl commands to test");
    console.log(`curl localhost:${PORT}/api/customers`);
    console.log(`curl localhost:${PORT}/api/restaurants`);
    console.log(`curl localhost:${PORT}/api/reservations`);
    console.log(
      `curl -X DELETE localhost:${PORT}/api/users/${moe.id}/reservations/${reservation2.id}`
    );
  });
};

init();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

admin.initializeApp({
	credential: admin.credential.cert(require("./serviceAccount.json")),
});

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@devcluster.s7bmtla.mongodb.net/?retryWrites=true&w=majority&appName=DevCluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();

		const coffeeDb = client.db("coffeeDB");
		const coffeeCollection = coffeeDb.collection("coffees");

		// get all coffees
		app.get("/coffees", async (req, res) => {
			const cursor = coffeeCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});

		// get a single coffee
		app.get("/coffees/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await coffeeCollection.findOne(query);
			res.send(result);
		});

		// add a coffee
		app.post("/coffees", async (req, res) => {
			const newCoffee = req.body;
			console.log(newCoffee);
			const result = await coffeeCollection.insertOne(newCoffee);
			res.send(result);
		});

		// update a coffee
		app.put("/coffees/:id", async (req, res) => {
			const id = req.params.id;
			const updatedCoffee = req.body;
			const filter = { _id: new ObjectId(id) };
			const options = { upsert: true };
			const updatedDoc = {
				$set: {
					name: updatedCoffee.name,
					quantity: updatedCoffee.quantity,
					supplier: updatedCoffee.supplier,
					taste: updatedCoffee.taste,
					price: updatedCoffee.price,
					details: updatedCoffee.details,
					photo: updatedCoffee.photo,
				},
			};

			const result = await coffeeCollection.updateOne(filter, updatedDoc, options);
			res.send(result);
		});

		// delete a coffee
		app.delete("/coffees/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await coffeeCollection.deleteOne(query);
			res.send(result);
		});

		// user related API

		const userCollection = coffeeDb.collection("users");

		// get all users

		app.get("/users", async (req, res) => {
			const cursor = userCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});

		// add a user
		app.post("/users", async (req, res) => {
			const userProfile = req.body;
			console.log(userProfile);
			const result = await userCollection.insertOne(userProfile);
			res.send(result);
		});

		// update a single field in user
		app.patch("/users", async (req, res) => {
			const { email, lastSignInTime } = req.body;
			const filter = { email: email };
			const updatedDoc = {
				$set: {
					lastSignInTime: lastSignInTime,
				},
			};

			const result = await userCollection.updateOne(filter, updatedDoc);
			res.send(result);
		});

		// delete a user
		app.delete("/users/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const user = await userCollection.findOne(query);
			const uid = user.uid;
			const result = await userCollection.deleteOne(query);

			if (result.deletedCount && uid) {
				const firebaseDelete = await admin.auth().deleteUser(uid);
				console.log(firebaseDelete);
			}
			res.send(result);
		});

		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log("Pinged your deployment. You successfully connected to MongoDB!");
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("My Coffee Shop Server is brewing Coffee!");
});

app.listen(port, () => {
	console.log(`My Coffee Shop Server is Running on Port: ${port}`);
});

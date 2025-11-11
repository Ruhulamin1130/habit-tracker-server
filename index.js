const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// XFbDfDeF9bOk7z0S
// habitdb

const uri =
  "mongodb+srv://habitdb:XFbDfDeF9bOk7z0S@cluster0.pktbmxt.mongodb.net/?appName=Cluster0";

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

    const db = client.db("habitdb");
    const habitCollection = db.collection("habit");

    app.get("/habit", async (req, res) => {
      const result = await habitCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.send(result);
    });

    // Get habit by ID
    app.get("/habit/:id", async (req, res) => {
      const id = req.params.id;
      const result = await habitCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Add habit
    app.post("/habit", async (req, res) => {
      const habit = req.body;
      habit.createdAt = new Date(); // Add createdAt timestamp
      const result = await habitCollection.insertOne(habit);
      res.send({ success: true, habitId: result.insertedId });
    });
    // Update habit
    app.put("/habit/:id", async (req, res) => {
      const id = req.params.id;
      const updatedHabit = req.body;
      const result = await habitCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedHabit }
      );
      res.send({ success: result.modifiedCount > 0 });
    });
    // Delete habit
    app.delete("/habit/:id", async (req, res) => {
      const id = req.params.id;
      const result = await habitCollection.deleteOne({ _id: new ObjectId(id) });
      res.send({ success: result.deletedCount > 0 });
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://habitdb:XFbDfDeF9bOk7z0S@cluster0.pktbmxt.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("habitdb");
    const habitCollection = db.collection("habit");

    // 1️⃣ Get latest 6 habits (Featured Habits)
    app.get("/habit", async (req, res) => {
      try {
        const result = await habitCollection
          .find()
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch habits" });
      }
    });

    // 2️⃣ Get all habits of a user
    app.get("/my-habits/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const habits = await habitCollection
          .find({ userEmail: email })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(habits);
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch user's habits" });
      }
    });

    // 3️⃣ Get habit by ID
    app.get("/habit/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id))
        return res.status(400).send({ error: "Invalid habit ID" });
      try {
        const habit = await habitCollection.findOne({ _id: new ObjectId(id) });
        if (!habit) return res.status(404).send({ error: "Habit not found" });
        res.send(habit);
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch habit" });
      }
    });

    // 4️⃣ Add habit
    app.post("/habit", async (req, res) => {
      const habit = req.body;
      habit.createdAt = new Date();
      habit.completionHistory = habit.completionHistory || [];
      try {
        const result = await habitCollection.insertOne(habit);
        res.send({ success: true, habitId: result.insertedId });
      } catch (err) {
        res.status(500).send({ error: "Failed to add habit" });
      }
    });

    // 5️⃣ Update habit
    app.put("/habit/:id", async (req, res) => {
      const id = req.params.id;
      const updatedHabit = req.body;
      if (!ObjectId.isValid(id))
        return res.status(400).send({ error: "Invalid habit ID" });
      try {
        const result = await habitCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedHabit }
        );
        res.send({ success: result.modifiedCount > 0 });
      } catch (err) {
        res.status(500).send({ error: "Failed to update habit" });
      }
    });

    // 6️⃣ Mark habit as complete (update completionHistory)
    app.put("/habit/complete/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id))
        return res.status(400).send({ error: "Invalid habit ID" });
      try {
        const habit = await habitCollection.findOne({ _id: new ObjectId(id) });
        if (!habit) return res.status(404).send({ error: "Habit not found" });

        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const history = habit.completionHistory || [];

        if (history.includes(today)) {
          return res
            .status(400)
            .send({
              success: false,
              message: "Already marked complete today!",
            });
        }

        history.push(today);
        const result = await habitCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { completionHistory: history } }
        );

        res.send({ success: true, completionHistory: history });
      } catch (err) {
        res.status(500).send({ error: "Failed to mark complete" });
      }
    });

    // 7️⃣ Delete habit
    app.delete("/habit/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id))
        return res.status(400).send({ error: "Invalid habit ID" });
      try {
        const result = await habitCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send({ success: result.deletedCount > 0 });
      } catch (err) {
        res.status(500).send({ error: "Failed to delete habit" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB successfully!");
  } finally {
    // keep connection alive
  }
}

run().catch(console.dir);

app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => console.log(`Server running on port ${port}`));

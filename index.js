const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const port = process.env.PORT || 5000;
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.klmvqmu.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // specify the destination folder for your uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // generate a unique filename
  },
});

const upload = multer({ storage: storage });

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const card = client.db("SEO-page-one-task").collection("card");

    app.post("/upload/:clientId", upload.array("uploads"), async (req, res) => {
      try {
        const clientId = req.params.clientId;
        const uploads = req.files;

        // Save file information to the database (you may need to modify this part)
        // Example: Update the 'uploads' field in the 'card' collection
        await card.updateOne(
          { "incomplete.client_id": clientId },
          { $set: { "incomplete.$.uploads-file": uploads } }
        );

        // Remove uploaded files from the 'uploads' folder
        uploads.forEach((file) => {
          fs.unlinkSync(file.path);
        });

        res.status(200).send("Files uploaded successfully!");
      } catch (error) {
        console.log(error?.message);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/card/:cardType", async (req, res) => {
      try {
        const cardType = req?.params?.cardType;
        const cards = await card.find({ type: cardType }).toArray();
        res.send(cards);
      } catch (error) {
        console.log(error?.message);
      }
    });

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

app.get("/", async (req, res) => {
  res.send("SEO page 1 connected");
});

app.listen(port, () => {
  console.log("SEO page server is running");
});

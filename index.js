const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5300

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.MONGODB_UnAME}:${process.env.MONGODB_PASS}@cluster0.kx3y6hq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// varify jwt
const verifyJwt = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(400).send({ error: true, message: "authorization faild" })
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.JWT_Token, (err, decoded) => {
        if (err) {
            return res.status(400).send({ error: true, message: "jwt tocken arror" })
        }
        req.decoded = decoded;
        next();
    });


}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollections = client.db("carExpertDB").collection("services");
        const appoinmentCollections = client.db("appoinmentDB").collection("appoinments");

        app.get("/services", async (req, res) => {
            let services = await serviceCollections.find().toArray();
            res.send(services);
        })

        app.get("/services/:id", async (req, res) => {
            let id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { title: 1, img: 1 },
            }
            let service = await serviceCollections.findOne(query, options);
            res.send(service)
        })

        //appoinmentCollections
        app.post('/appoinments', async (req, res) => {
            const body = req.body;
            const result = await appoinmentCollections.insertOne(body);
            res.send(result)
        })

        app.get("/appoinments", verifyJwt, async (req, res) => {
            if (req.decoded.email !== req.query.email) {
                return res.status(400).send({
                    error: true,
                    message: "your email is not same that you login with!"
                })
            }
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            let appoinments = await appoinmentCollections.find(query).toArray();
            res.send(appoinments);
        })

        app.delete("/appoinments/:id", async (req, res) => {
            let id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const deleteResult = await appoinmentCollections.deleteOne(filter);
            res.send(deleteResult)
        })

        app.patch("/appoinments/:id", async (req, res) => {
            const updateQuery = { _id: new ObjectId(req.params.id) }
            const updatedData = { $set: { status: req.body.status } };
            const updateResult = await appoinmentCollections.updateOne(updateQuery, updatedData);
            res.send(updateResult)
        })


        //jwt
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const tocken = jwt.sign(user, process.env.JWT_Token, { expiresIn: "7d" });
            res.send({ tocken });
        })


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
    res.send("Cor exper server is running")
})

app.listen(port, () => {
    console.log(`Server started on ${port}`)
})
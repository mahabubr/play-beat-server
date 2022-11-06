const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000
require('dotenv').config()
require('colors')

// Middle Were
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
    res.send("Server Running On Port");
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vlhy1ml.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const musicCollection = client.db('Music').collection('Song')
        const subscriberCollection = client.db('Music').collection('Subscriber')

        // JWT
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            console.log(token);
            res.send({ token })
        })

        // Subscriber Server
        app.post('/subscriber', async (req, res) => {
            const sub = req.body
            const result = await subscriberCollection.insertOne(sub)
            res.send(result)
        })

        app.get('/subscriber', async (req, res) => {
            const query = {}
            const cursor = subscriberCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        // Music Server
        app.post('/musics', async (req, res) => {
            const music = req.body
            const result = await musicCollection.insertOne(music)
            res.send(result)
        })

        app.get('/musics', async (req, res) => {

            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)

            const query = {}
            const cursor = musicCollection.find(query)
            const music = await cursor.skip(page * size).limit(size).toArray()
            const count = await musicCollection.estimatedDocumentCount()
            res.send({ count, music })
        })

        app.get('/musics/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const music = await musicCollection.findOne(query)
            res.send(music)
        })

        app.patch('/musics/:id', async (req, res) => {
            const id = req.params.id
            const upImage = req.body.updateImage
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updateInfo = {
                $set: {
                    image: upImage
                }
            }
            const result = await musicCollection.updateOne(filter, updateInfo, options)
            res.send(result)
        })

        app.delete('/musics/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await musicCollection.deleteOne(filter)
            res.send(result)
        })

    }
    catch (error) {
        console.log(error);
    }
}

run()

app.listen(port, () => {
    console.log(`Server Running In PORT ${port}`.bgMagenta);
})
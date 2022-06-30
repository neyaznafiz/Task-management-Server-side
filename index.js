const express = require('express')
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000

// middlewar
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ptdjh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        const allToDoCollection = client.db("daily-todo-data-collection").collection("all-todo");


    }
    finally { }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hey! I am running')
})


app.listen(port, () => {
    console.log('Listning to port', port)
})
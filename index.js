const express = require('express')
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000

// middlewar
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ptdjh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// // jwt function 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorizd Access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded
        next()
    })
}

async function run() {
    try {
        await client.connect()
        const allToDoCollection = client.db("daily-todo-data-collection").collection("all-todo");
        const allUsersCollection = client.db("daily-todo-data-collection").collection("all-users");


        // user put api 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: user,
            }
            const result = await allUsersCollection.updateOne(filter, updatedDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20d' })
            res.send({ result, token })
        })

       
        //api for todo post
        app.post('/post-todo', async (req, res) => {
            const postToDo = await allToDoCollection.insertOne(req.body)
            res.send(postToDo)
        })

        // completed taks api for checkbox
        app.put('/tasks/completed/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const requester = req.decoded.email
            const requesterAc = await allToDoCollection.findOne({ email: requester })

            if (requesterAc) {
                const filter = { email: email }
                const updatedDoc = {
                    $set: { role: 'completed' },
                }
                const result = await allToDoCollection.updateOne(filter, updatedDoc)
                res.send(result)
            }
            else {
                res.status(403).send({ message: 'Forbidden' });
            }
        })


        // filter by email api all my todo
        app.get("/my-added-to-do", verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = allToDoCollection.find(query);
                const myToDo = await cursor.toArray();
                res.send(myToDo);
            } else {
                res.status(403).send({ message: "Access denied! Forbidden access" });
            }
        })
        
        // get completed todo api
        app.get('/completedtask/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const todo = await allToDoCollection.findOne({ email: email })
            const isCompleted = todo?.role === 'completed'
            res.send({ completed: isCompleted })
        })

        // token api send user database
        app.post("/login", async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "10d",
            });
            res.send({ accessToken });
        })


         // todo filterby id for update
         app.get('/todo-by-id/:id', async (req, res) => {
            const getSingleToDoById = await allToDoCollection.findOne({ _id: ObjectId(req.params.id) })
            res.send(getSingleToDoById)
        })

        // update to-do api
        app.put('/update-todo/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const updatedTodo = req.body
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                title: updatedTodo.title,
                content: updatedTodo.content
            }
            const result = await allToDoCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })


        // delete todo api
        app.delete("/delete-to-do/:id", async (req, res) => {
            const deleteToDo = await allToDoCollection.deleteOne({ _id: ObjectId(req.params.id) });
            res.send(deleteToDo);
        })

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
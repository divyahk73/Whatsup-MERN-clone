//importing
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors';

// app config
const app= express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: '1092488',
    key: '260641f22a3664c56fc8',
    secret: '42b7e4a84a021f505a59',
    cluster: 'eu',
    encrypted: true
  });
  


//middleware
app.use(express.json());
app.use(cors())

app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
})

//db congif

const connection_url="mongodb+srv://admin:a8YLgHvErGVdex9R@cluster0.a9n7m.mongodb.net/whatsappdb?retryWrites=true&w=majority"
mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
}).then(()=>console.log("db connected"))
.catch(err=>console.error(err))

const db= mongoose.connection;
db.once("open",()=>{
    console.log("DB CONNECTED");
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change",(change)=>{
        console.log("A change occured",change);

        if(change.operationType==='insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name:messageDetails.name,
                message:messageDetails.message,
                timestamp:messageDetails.timestamp,
                received:messageDetails.received
            }
        )
        }else{
            console.log('Error triggering Pusher')
        }
    })

})
//app routes

app.get('/',(req,res)=>res.status(200).send('hello world'))

app.get('/messages/sync',(req,res)=>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body
    Messages.create(dbMessage,(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})

//listen
app.listen(port,()=>console.log(`Listening on localhost:${port}`))
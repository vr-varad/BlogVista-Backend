const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const multer  = require('multer')
require('dotenv').config()
const { default: mongoose } = require('mongoose')
const cookieParser = require('cookie-parser')
const fs = require('fs')

const User = require('./models/User')
const Post = require('./models/Post')
const Subscriber = require('./models/Subscriber')

const sendEmail = require('./mailingService')

const app = express()
const saltRounds = 10;
const secret = "eefvqwrvqw"
const uploadMiddleware = multer({ dest: 'uploads/' })

app.use(cors({
    origin: 'https://myblogvista.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,FormData',
    exposedHeaders: 'Content-Disposition', 
  }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser())
app.use('/uploads',express.static(__dirname + '/uploads'))


const connectDB= async()=>{
    try {
        await mongoose.connect(process.env.mongoUrl,{
            dbName:'BlogVista',
            useNewUrlParser: true,
            useUnifiedTopology:true
        })
        console.log('MongoDB connected')
    } catch (error) {
        console.log('Error in connection')
    }
}

//registration
app.post('/register',async(req,res)=>{
    try {
        const {username,password,randNum} = req.body
    const userDoc = await User.create({username,password:bcrypt.hashSync(password,saltRounds),randNum})
    res.json({
        userDoc
    })
    } catch (error) {
        res.status(400).json(error)
    }
})

//login
app.post('/login',async(req,res)=>{
    const {username,password} = req.body
    const userDoc = await User.findOne({username})  
    const passOK = bcrypt.compareSync(password,userDoc.password)
    if(passOK){
        jwt.sign({username,id:userDoc._id},secret,{},(err,token)=>{
            if(err) throw err
            res.cookie('token',token).json({
                id:userDoc._id,
                username
            })
        })
    }else{
        return res.status(401).json({msg:"Invalid Password"})
    }
})


app.get('/profile',(req,res)=>{
   const {token} = req.cookies
   jwt.verify(token?token:'',secret,{},(err,info)=>{
    if(err){
        throw err
    }
    res.json(info)

   })
})

app.post('/logout',(req,res)=>{
    res.cookie('token','').json('ok')
})


app.post('/post',uploadMiddleware.single('file'),async(req,res)=>{
    console.log(req)
    const {originalname,path} = req.file
    const parts = originalname.split('.')
    const ext = parts[1]
    const newPath = path+'.'+ext
    fs.renameSync(path,newPath)
    const {title,summary,content} = req.body

    const {token} = req.cookies
   jwt.verify(token,secret,{},async(err,info)=>{
    if(err){
        throw err
    }
    const postDoc = await Post.create({
        title,
        summary,
        content,
        cover : newPath,
        author : info.id
    })
    const emails = await Subscriber.find()
    emails.forEach(email=>{
        sendEmail(email.email,'post',postDoc)
    })
    res.json({postDoc})

   })



    

})


app.get('/post',async(req,res)=>{
    res.json(await Post.find().populate('author',['username']).sort({'createdAt':-1}).limit(20))
})

app.get('/post/:id',async (req,res)=>{
    const article = await Post.findById(req.params.id).populate('author',['username'])
    return res.json({article})
})

app.put('/post/:id',uploadMiddleware.single('file'),(req,res)=>{
    let newPath = ''
    if(req.file){
        const {originalname,path} = req.file
        const parts = originalname.split('.')
        const ext = parts[1]
        newPath = path+'.'+ext
        fs.renameSync(path,newPath)
    }
    const {title,summary,content,id} = req.body
    const {token} = req.cookies
    jwt.verify(token,secret,{},async(err,info)=>{
    if(err){
        throw err
    }
    const postDoc = await Post.findById(id)
    if(postDoc.author != info.id){
        return res.status(401).json({msg:"Not Authorized"})        
    }
    await postDoc.updateOne({
        title,
        summary,
        content,
        cover: newPath? newPath: postDoc.cover
    })
    res.json({postDoc})

   })
}
)

app.post('/subscribe',async (req,res)=>{
    try {
        const email = req.body.reqEmail
        await Subscriber.create({email})
        await sendEmail(email,'new')        
        res.json({
            msg:'Success',
            email
    })
    } catch (error) {
        res.json({
            msg:'Failure',
            error
        })
    }
})


app.get('/posts',async(req,res)=>{
    res.json(await Post.find().populate('author',['username']))

})
app.get('/userProfile/:id',async(req,res)=>{
    const id = req.params.id
    const user = await User.findById(id)
    res.json({user})

})


const start = async()=>{
    try {
        await connectDB()
        app.listen(4000,()=>{
            console.log('Server Started at port 4000')
        })
    } catch (error) {
        console.log('Server Error')
    }
}

start()
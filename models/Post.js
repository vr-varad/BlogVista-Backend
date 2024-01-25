const mongoose = require('mongoose')
const {Schema,model} = mongoose

const postSchema = new Schema({
    title:{type:String , required:[true,'Please provide a Title for the Post']},
    summary: {type:String, required: [true,'Please Provide a Summary for the Post']},
    content:{type: String ,required:[true,"Post Content can't be Blank"]},
    cover: {type: String},
    author:{type: Schema.Types.ObjectId, ref:'User'}
},{timestamps: true})

const PostModel = model('Post',postSchema)

module.exports = PostModel
const mongoose =require('mongoose')

const SubjectSchema = new mongoose.Schema({
    
name:{
type:String,
required:true,
minlength:3,
trim:true
},
description:{
type:String,
},
createdBy:{


    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
},
createdAt:{
type:Date,
default:Date.now
}

});

module.exports=mongoose.model('Subject',SubjectSchema)
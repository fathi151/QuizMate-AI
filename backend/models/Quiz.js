

mongoose=require('mongoose');





const questionSchema = new mongoose.Schema({
question:{
type:String,
required:true,
},
options:[{
type:String,
required:true
}],
correctAnswer:{
type:Number,
required:true,
min:0,
max:3
}

    
});


const QuizSchema=new mongoose.Schema({
title:{
type:String,
required:true,
minlength:8
},
description:{
type:String,
required:true,
minlength:8
},
questions:[questionSchema],
subject:{
type:mongoose.Schema.Types.ObjectId,
ref:'Subject',
required:true,

},
duration:{
type:Number,
required:true,
min:1
},
createdBy:{
type:mongoose.Schema.Types.ObjectId,
ref:'User',
required:true,
},
createdAt:{
type:Date,
default:Date.now
}


});


module.exports=mongoose.model('Quiz',QuizSchema)
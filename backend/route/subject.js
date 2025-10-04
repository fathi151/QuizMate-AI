const express= require('express');
const mongoose=require('mongoose');
const Subject=require('../models/Subject');
const router=express.Router();


const requireAuth=(req,res,next)=>{
    if(!req.session.userId)
    {
return res.status(401).json({error:'Not authenticated'});
    }
    next();
};


const requireAdmin=(req,res,next)=>{
if(req.session.userRole!='admin')
return res.status(403).json({error:'Not authorized'});
next();
};

router.get('/Subjects',requireAuth,async(req,res)=>{

try{

// First, let's check if we can find subjects without population
const subjectsRaw = await Subject.find().sort({createdAt:-1});
console.log('Raw subjects (no population):', JSON.stringify(subjectsRaw, null, 2));

// Now try with population
const Subjects= await Subject.find()
.populate('createdBy','username email')
.sort({createdAt:-1});

// Debug: Log the populated subjects
console.log('Fetched subjects with populated createdBy:', JSON.stringify(Subjects, null, 2));

// Let's also check if users exist
const User = require('../models/User');
const users = await User.find({}, 'username email');
console.log('Available users:', JSON.stringify(users, null, 2));

return res.status(200).json(Subjects);


}catch(err){
console.log('Error in get subjects:', err);
return res.status(500).json({error:err.message});
}


});


router.get('/getbysubjectid/:id',requireAuth,async(req,res)=>{
try{
const subjectreturned= await Subject.findById().populate('createdBy','username')
.sort({createdAt:-1});
console.log('subject returned sucessfully');
res.status(201).res.json(subjectreturned);

}catch(error)
{
console.log(error);
return  res.status(401).json({message:'subject introuvable'});


}







});

router.post('/ajouterSubject',requireAuth,async(req,res)=>{
try{
const { name, description } = req.body;

// Debug: Log session info
console.log('Session userId:', req.session.userId);
console.log('Session userRole:', req.session.userRole);

const subject = new Subject({
name,
description,
createdBy: req.session.userId
});

await subject.save();
await subject.populate('createdBy', 'username email');

console.log('Created subject with populated createdBy:', subject);

res.status(201).json(subject);

}catch(err){

return res.status(500).json({error:err.message})

}

});






// Test route to debug population
router.get('/test-population', requireAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Test if we can find the user by ID
    const userId = '68da2ba3cb39d18812780b43'; // The ID from your MongoDB data
    const user = await User.findById(userId);
    console.log('User found by ID:', user);
    
    // Test population manually
    const subject = await Subject.findOne({ createdBy: userId });
    if (subject) {
      await subject.populate('createdBy', 'username email');
      console.log('Manually populated subject:', subject);
    }
    
    res.json({ user, subject });
  } catch (err) {
    console.log('Test population error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports=router;


const express= require('express')
const router= express.Router();
const User= require('../models/User');

const mongoose=require('mongoose');

const SessionList=mongoose.connection.collection('sessions');







router.post('/register', async (req,res)=>{
try {
    const {username,email,password,role}=req.body;
    const existingMail= await User.findOne({email:email});
    if (existingMail)
    {
return res.status(400).json({message:"Email already exists"});
    }

    const user=new User({
       username,
       email,
       password,
       role 
    });

    await user.save();
    req.session.userId = user._id;
    req.session.userRole = user.role;
    return res.status(201).json({
message:"User created successfully"
});
} catch (error) {
console.error('Registration error:', error);
return res.status(500).json({message:'Internal server error'});
}
});

router.post('/login',async(req,res)=>{
try {
const {email,password}=req.body;
const user = await User.findOne({email});

if(!user)
{
return res.status(401).json({message:'Utilisateur Introuvable'});
}
const IsMatch=await user.comparePassword(password);
if(!IsMatch)
{
return res.status(401).json({message:'Mot Passe Incorrect'});
}

// Set session data
req.session.userId = user._id;
req.session.userRole = user.role;

res.json({
message:'Login Successful',
user:{
   id: user._id,
   username: user.username,
   email: user.email,
   role: user.role
}
});
} catch (error) {
console.error('Login error:', error);
return res.status(500).json({message:'Internal server error'});
}
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports=router;

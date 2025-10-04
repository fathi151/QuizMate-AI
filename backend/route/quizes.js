const express=require('express');
const mongoose=require('mongoose');
const router=express.Router();

const Quiz = require('../models/Quiz');
const User = require('../models/User');



const requireAuth =(req,res,next)=>{
if(!req.session.userId){
return res.status(401).json('provide auth');
}
next();
};
const requireAdmin = (req, res, next) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};


router.get('/getQuizz',requireAuth,async(req,res)=>{
try{
const quizes=await Quiz.find()
.populate('subject','name')
.populate('createdBy','username')
.sort({createdAt:-1});

res.status(200).json(quizes);
}catch(err){

res.status(500).json({error:err.message})
}
});



router.get('/:id',requireAuth,async(req,res)=>{
try{

const quiz=await Quiz.findById(req.params.id)
.populate('subject','name')
.populate('createdBy','username');
if(!quiz)
{
return res.status(404).json({message:'Quiz Not Found'});
}
return res.status(201).json(quiz);



}catch(error)
{
console.log("error fetchng subjet",error);


}


});



router.get('/subject/:subjectId',requireAuth,async(req,res)=>{
    try{

const quizes=await Quiz.find({subject:req.params.subjectId})
.populate('subject','name')
.populate('createdBy','username')
.sort({createdAt:-1});
res.status(200).json(quizes);

}
    catch(err)
    {
return res.status(500).json({error:err.message})


    }
});




router.post('/createQuizz',requireAuth,async(req,res)=>{

    try{
const {title,description,questions,subject,duration}=req.body;

// Debug logging
console.log('Creating quiz with data:', {title, description, questions, subject, duration});
console.log('Session userId:', req.session.userId);

// Validation côté serveur
const validationErrors = [];

if (!title || title.trim().length < 8) {
  validationErrors.push('Le titre doit contenir au moins 8 caractères');
}

if (!description || description.trim().length < 8) {
  validationErrors.push('La description doit contenir au moins 8 caractères');
}

if (!subject) {
  validationErrors.push('Veuillez sélectionner un sujet');
}

if (!duration || duration < 1) {
  validationErrors.push('La durée doit être d\'au moins 1 minute');
}

if (!questions || questions.length === 0) {
  validationErrors.push('Au moins une question est requise');
} else {
  // Validation des questions
  questions.forEach((question, index) => {
    if (!question.question || question.question.trim().length === 0) {
      validationErrors.push(`La question ${index + 1} ne peut pas être vide`);
    }
    
    if (!question.options || question.options.length !== 4) {
      validationErrors.push(`La question ${index + 1} doit avoir exactement 4 options`);
    } else {
      question.options.forEach((option, optIndex) => {
        if (!option || option.trim().length === 0) {
          validationErrors.push(`L'option ${optIndex + 1} de la question ${index + 1} ne peut pas être vide`);
        }
      });
    }
    
    if (question.correctAnswer < 0 || question.correctAnswer > 3) {
      validationErrors.push(`La réponse correcte de la question ${index + 1} doit être entre 0 et 3`);
    }
  });
}

if (validationErrors.length > 0) {
  return res.status(400).json({
    error: 'Erreurs de validation',
    details: validationErrors
  });
}

const quiz=new Quiz({
title: title.trim(),
description: description.trim(),
questions,
subject,
duration,
createdBy: req.session.userId
});

await quiz.save();
await quiz.populate('subject','name');
await quiz.populate('createdBy','username');
res.status(201).json(quiz);

}catch(err) 
    {
console.log('Error creating quiz:', err);

// Gestion spécifique des erreurs MongoDB
if (err.name === 'ValidationError') {
  const validationErrors = [];
  
  for (let field in err.errors) {
    const error = err.errors[field];
    switch (field) {
      case 'title':
        if (error.kind === 'minlength') {
          validationErrors.push('Le titre doit contenir au moins 8 caractères');
        } else {
          validationErrors.push('Le titre est requis');
        }
        break;
      case 'description':
        if (error.kind === 'minlength') {
          validationErrors.push('La description doit contenir au moins 8 caractères');
        } else {
          validationErrors.push('La description est requise');
        }
        break;
      case 'subject':
        validationErrors.push('Veuillez sélectionner un sujet valide');
        break;
      case 'duration':
        if (error.kind === 'min') {
          validationErrors.push('La durée doit être d\'au moins 1 minute');
        } else {
          validationErrors.push('La durée est requise');
        }
        break;
      case 'questions':
        validationErrors.push('Au moins une question valide est requise');
        break;
      default:
        validationErrors.push(error.message);
    }
  }
  
  return res.status(400).json({
    error: 'Erreurs de validation',
    details: validationErrors
  });
}

return res.status(500).json({error: 'Erreur serveur: ' + err.message})
}});

router.put('/update/:id', requireAuth, async(req, res) => {
  try {
    const { title, description, subject, questions, duration } = req.body;
    
    // Validation
    const validationErrors = [];

    if (!title || title.trim().length < 8) {
      validationErrors.push('Le titre doit contenir au moins 8 caractères');
    }

    if (!description || description.trim().length < 8) {
      validationErrors.push('La description doit contenir au moins 8 caractères');
    }

    if (!subject) {
      validationErrors.push('Veuillez sélectionner un sujet');
    }

    if (!duration || duration < 1) {
      validationErrors.push('La durée doit être d\'au moins 1 minute');
    }

    if (!questions || questions.length === 0) {
      validationErrors.push('Au moins une question est requise');
    } else {
      // Validation des questions
      questions.forEach((question, index) => {
        if (!question.question || question.question.trim().length === 0) {
          validationErrors.push(`La question ${index + 1} ne peut pas être vide`);
        }
        
        if (!question.options || question.options.length !== 4) {
          validationErrors.push(`La question ${index + 1} doit avoir exactement 4 options`);
        } else {
          question.options.forEach((option, optIndex) => {
            if (!option || option.trim().length === 0) {
              validationErrors.push(`L'option ${optIndex + 1} de la question ${index + 1} ne peut pas être vide`);
            }
          });
        }
        
        if (question.correctAnswer < 0 || question.correctAnswer > 3) {
          validationErrors.push(`La réponse correcte de la question ${index + 1} doit être entre 0 et 3`);
        }
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Erreurs de validation',
        details: validationErrors
      });
    }

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        description: description.trim(),
        subject,
        questions,
        duration
      },
      { new: true }
    )
    .populate('subject', 'name')
    .populate('createdBy', 'username');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json(quiz);

  } catch (error) {
    console.log('Error updating quiz:', error);
    res.status(500).json({ message: "Error updating quiz", error: error.message });
  }
});

router.delete('/delete/:id', requireAuth, async(req, res) => {
  try {
    console.log('Deleting quiz with ID:', req.params.id);
    
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.status(200).json({ message: 'Quiz deleted successfully', quiz });
    
  } catch (error) {
    console.log('Error deleting quiz:', error);
    res.status(500).json({ message: "Error deleting quiz", error: error.message });
  }
});



module.exports=router;














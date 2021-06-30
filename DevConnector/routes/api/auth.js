const express=require('express')
const router=express.Router();
const auth=require('../../middleware/auth')
const User=require('../../models/User')
const {check,validationResult}=require('express-validator/check')
const config=require('config')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcryptjs');



//@Route Get api/auth
//@desc Test route
//@access public
router.get('/',auth,async (req,res)=>{
    try {
    const user=await User.findById(req.user.id).select('-password')
    res.json(user)
} catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
}})

//@Route Post api/auth
//@desc Test route
//@access public
router.post('/',[check('email','Please include a valid email').isEmail(),
check('password','Password is Required').exists()],async(req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({errors:errors.array()})
    }
    const{email,password}=req.body;
    try {
         //See if user exists
         let user =await User.findOne({email});
         if(!user)
         {
             return res.status(400).json({errors:[{msg:'Invalid credentials'}]})
         }

         const isMatch=await bcrypt.compare(password,user.password);
         if(!isMatch)
         {
            return res.status(400).json({errors:[{msg:'Invalid credentials'}]})

         }
    //Return JWT
     const payload={
        user:{
            id:user.id
        }
     }

     jwt.sign(payload,config.get('jwtSecret'),{expiresIn: 360000},(err,token)=>{
         if(err) throw err;
         res.json({token})
     })
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error')
    }
   })

module.exports=router;
const express=require('express')
const router=express.Router();
const auth=require('../../middleware/auth')
const {check,validationResult}=require('express-validator/check')
const Profile=require('../../models/Profiles')
const User=require('../../models/User')
const request=require('request')
const config=require('config');
const { response } = require('express');



//@Route Get api/profile/me
//@desc Get Current Users profile
//@access public
router.get('/me',auth,async (req,res)=>{
try {
    let profile=await Profile.findOne({user: req.user.id}).populate('user',['name','avatar']);
    if(!profile)
    {
        return res.status(400).json({msg:'There is no profile for the user'})
    }
    res.json(profile);
} catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error')
}
})

//@Route Post api/profile
//@desc Create or update user profile
//@access  Private
router.post('/',[auth,[check('status','Status is Required').not().isEmpty(),check('skills','skills is required').not().isEmpty()]],async (req,res)=>
    {
    const errors=validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({errors:errors.array()})
    }

    const{
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin}=req.body;
    
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername)
      profileFields.githubusername = githubusername;
    // Skills - Spilt into array
    if (skills) {
      profileFields.skills = skills.split(',').map(skill=>skill.trim());
    }

    //Build social objects

    profileFields.social={}
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (facebook) profileFields.social.facebook = facebook;

    try {
        let profile=await Profile.findOne({user: req.user.id})
        if(profile)
        {
            profile=await Profile.findOneAndUpdate({user :req.user.id},{$set: profileFields},{new:true})
            return res.json(profile);
        }
        //Create
        profile=new Profile(profileFields)
        await profile.save();
        res.json(profile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }

    })
//@Route Get api/profile
//@desc Get all profiles
//@access  Private

router.get('/',async (req,res)=>{
    try {
        const profiles=await Profile.find().populate('user',['name','avatar'])
        res.json(profiles);
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server Error')
    }
})
//@Route Get api/profile/user/:userid
//@desc Get profiles by userid
//@access  Public
router.get('/user/:user_id',async (req,res)=>{
    try {
        const profile=await Profile.findOne({user:req.params.user_id}).populate('user',['name','avatar'])
        if(!profile)
        {
            return res.status(400).json({msg:'Profile not found'})
        }
        res.json(profile);
    } catch (error) {
        console.log(error.message)
        if(error.kind=='ObjectId')
        {res.status(400).json({msg:'Profile not found'})}
        res.status(500).send('Server Error')
    }
})

//@Route Delete api/profile/user/:userid
//@desc Delete profiles by userid
//@access  Public
router.delete('/',auth, async (req,res)=>{
    try {
        //@to-do remove users posts

        //Remove Profile
        await Profile.findOneAndRemove({user:req.user.id})
        await User.findOneAndRemove({_id:req.user.id})
        res.json({msg:'USer Deleted'});
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server Error')
    }
})

//@Route Put api/profile/experience
//@desc Add profile experience
//@access  Public
router.put('/experience',[auth,[check('title','Title is required').not().isEmpty(),check('company','Company is required').not().isEmpty(),check('from','From Date is required').not().isEmpty()]], async (req,res)=>{
   const errors=validationResult(req);
   if(!errors.isEmpty())
   {
       return res.status(400).json({errors:erros.array()})
   }
   const{
    title,
    company,
    location,
    from,
    to,
    current,
    description
   }=req.body;

   const newExp={
       title,
       company,
       location,
       from,
       to,
       current,
       description
   }
   try {
       const profile=await Profile.findOne({user:req.user.id})
       profile.experience.unshift(newExp);
       await profile.save();
       res.json(profile)
   } catch (error) {
       console.log(error.message),
       res.status(500).send('Server Error')
   }
})

//@Route Delete api/profile/experience/:exp_id
//@desc Delete profile experience
//@access  Private

router.delete('/experience/:exp_id',auth, async(req,res)=>
{
try {
    const profile=await Profile.findOne({user:req.user.id})
    //Get remove Index
    const removeIndex=profile.experience.map(item=>item.id).indexOf(req.params.exp_id)
    profile.experience.splice(removeIndex,1)
    await profile.save();
    res.json(profile);
} catch (error) {
    console.log(error.message),
    res.status(500).send('Server Error')
}
})

//@Route Put api/profile/education
//@desc Add profile education
//@access  Public
router.put('/education',[auth,[check('school','School is required').not().isEmpty(),check('degree','Degree is required').not().isEmpty(),check('fieldofstudy','Field of study is required').not().isEmpty()]], async (req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({errors:erros.array()})
    }
    const{
     school,
     degree,
     fieldofstudy,
     from,
    to,
    current,
    description
    }=req.body;
 
    const newEdu={
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }
    try {
        const profile=await Profile.findOne({user:req.user.id})
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile)
    } catch (error) {
        console.log(error.message),
        res.status(500).send('Server Error')
    }
 })
 
 //@Route Delete api/profile/education/:edu_id
 //@desc Delete profile education
 //@access  Private
 
 router.delete('/education/:edu_id',auth, async(req,res)=>
 {
 try {
     const profile=await Profile.findOne({user:req.user.id})
     //Get remove Index
     const removeIndex=profile.education.map(item=>item.id).indexOf(req.params.edu_id)
     profile.education.splice(removeIndex,1)
     await profile.save();
     res.json(profile);
 } catch (error) {
     console.log(error.message),
     res.status(500).send('Server Error')
 }
 })

 //@route GET api/profile/github/:username
 //@desc Get user repos from github
 //@access Public

 router.get('/github/:username',(req,res)=>{
     try {
         const options={
            uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method:'GET',
            headers:{'user-agent':'node.js'}
         }
         request(options,(error,response,body)=>{
      if(error)console.log(error) 
      if(response.statusCode!=200){
          return res.status(404).json({msg:'No Github Profile found'})
      }
      res.json(JSON.parse(body))
         })
     } catch (error) {
          console.log(error.message),
     res.status(500).send('Server Error')
     }
 })

module.exports=router;
var env=process.env.NODE_ENV || 'development';
console.log('env *********',env);

if(env === 'development'){
  process.env.PORT=3000;
  process.env.MONGODB_URI='mongodb://localhost:27017/TodoApp';
}else if(env === 'test'){
  process.env.PORT=3000;
  process.env.MONGODB_URI='mongodb://localhost:27017/TodoAppTest';

}

const _=require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

//Object destructuring
var {mongoose}=require('./db/mongoose');
var {Todo}=require('./models/todo');
var {User}=require('./models/user');
var {authenticate} = require('./middleware/authenticate');
var app=express();
const port = process.env.PORT || 3000;

//set upt he bodyParser middleware

app.use(bodyParser.json());

//to create new todos
app.post('/todos',(req,res)=>{
 //console.log(req.body);
 var todo = new Todo({
   text:req.body.text
 });
 todo.save().then((doc)=>{
   res.send(doc);

 },(err)=>{
   res.status(400).send(err);
 });
});

//reetrun all the todos
app.get('/todos',(req,res)=>{
  Todo.find().then((todos)=>{
    //send as an object
    res.send({todos});
  },(e)=>{
    res.status(400).send(e);
  });
});

//retrun by id
app.get('/todos/:id',(req,res)=>{
  var id=req.params.id;
  if(!ObjectID.isValid(id)){
    return res.status(404).send();
  }
  Todo.findById({_id:id}).then((todo)=>{
    if(!todo){
      return res.status(404).send();
    }
    //send as object
    res.status(200).send({todo});
  }).catch((e)=>{
    res.status(404).send();
  });
});

app.delete('/todos/:id',(req,res)=>{
  var id=req.params.id;
  if(!ObjectID.isValid(id)){
    return res.status(404).send();
  }
  Todo.findByIdAndRemove(id).then((todo)=>{
    if(!todo){
      return res.status(404).send();
    }
    res.status(200).send({todo});
  }).catch((e)=>{
    res.status(400).send();
  });

});

//for updating todos
app.patch('/todos/:id',(req,res)=>{
  var id=req.params.id;
  //for validation purpose we use lodash
  //there are property we dont want user to updaate
  //ex: completed=true shouuld be done by the Server
  //to extract certain property {key;value} from 'req' parameter
  //we are using lodash to extract only desired property
  var body=_.pick(req.body,['text','completed']);

  if(_.isBoolean(body.completed) && body.completed){
    body.completedAt = new Date().getTime();
  }else{
    body.completed=false;
    //to delete a value simply make it null
    body.completedAt=null;
  }
  Todo.findByIdAndUpdate(id,{$set:body},{new:true}).then((todo)=>{
    if(!todo){
    return res.status(404).send();
    }
    res.status(200).send({todo});

  }).catch((err)=>{
    res.status(400).send();
  });
});


app.post('/users',(req,res)=>{
   var body= _.pick(req.body,['email','password']);
   var user= new User(body);



   user.save().then(()=>{
    //usser.generateAuthToken() returns apromise so we
    //can chain acustom then() call for custom logiic
     return user.generateAuthToken();
     //res.send(user);
   }).then((token)=>{
     //x-auth means custom header and not standard http header
     res.header('x-auth',token).send(user);
   }).catch((err)=>{
     res.status(400).send(err);
   });
});


//test authenticated route
app.get('/users/me',authenticate,(req,res)=>{
  //get the x-auth header from req object
  res.send(req.user);
});


//dedicated login route
//POST /user/login {email,password}
app.post('/users/login',(req,res)=>{
  var body=_.pick(req.body,['email','password']);
  User.findByCredentials(body.email,body.password).then((user)=>{
    user.generateAuthToken().then((token)=>{
      res.header('x-auth',token).send(user);
    });
  }).catch((e)=>{
    res.status(400).send();
  });
});

//dedicated logout route
app.delete('/users/me/token',authenticate,(req,res)=>{
  req.user.removeToken(req.token).then(()=>{
    res.status(200).send();
  },()=>{
    res.status(400).send();
  });
});

app.listen(port,()=>{
  console.log(`Server Started at ${port}`);
});

module.exports={app};

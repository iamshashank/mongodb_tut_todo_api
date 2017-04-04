const expect = require('expect');
const request = require('supertest');

//../ to go back a direectory
const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const todos=[
  {text:"test 1 todos"},
  {text:"test 2 todos"}
];

//insertMany() mongoose to insert many item in db

//empty database before every teest
beforeEach((done)=>{
  Todo.remove({}).then(()=>{
    return Todo.insertMany(todos); //this will return a promise
    done();
  }).then(()=>{done();});
});

describe('POST/todos',()=>{
  it('should create new todos',(done)=>{
    var text = 'Test todo test';

    request(app)
    .post('/todos')
    .send({text})
    .expect(200)
    .expect((res)=>{
      expect(res.body.text).toBe(text);
    })
    .end((err,res)=>{
      if(err){
        return done(err);
      }
      //model.find() fetches entirer collection
      Todo.find({text}).then((todos)=>{
        //console.log(todos);
        //we empty the database so length is 1 always
        expect(todos.length).toBe(1);
        expect(todos[0].text).toBe(text);
        done();
      }).catch((e)=>done(e));

    });
   });

   //test case for the bad request
// it('should not create a new todos',(done)=>{
//   request(app)
//   .post('/todos')
//   .send({})
//   .expect(400)
//   .expect((res)=>{
//     expect(res.body.message).toBe("Todo validation failed");
//   })
//   .end(done);

//test for bad request with database length check-0
it('should not create a new todos',(done)=>{
  request(app)
  .post('/todos')
  .send({})
  .expect(400)
  .expect((res)=>{
    expect(res.body.message).toBe("Todo validation failed");
  })
  .end((err,res)=>{
    if(err){
      return done(err);
    }
    Todo.find().then((todos)=>{
      expect(todos.length).toBe(2);
      done();
    }).catch((e)=>{
      done(e);
    });
  });
});
});


//test case for get/all todos
describe('GET/todos',()=>{
  it('should get all todos',(done)=>{
    request(app)
    .get('/todos')
    .expect(200)
    .expect((res)=>{
      expect(res.body.todos.length).toBe(2);
    })
    .end(done);
  });
});

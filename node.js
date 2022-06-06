const express = require( 'express' )
const bodyParser = require('body-parser')


const app = express()
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json());
const port = 3002

const successModel = require('./module/success')
const errorModel = require('./module/error')

const knex = require('./utils/knex')

// app.get('/',(req,res) => {
//     res.setHeader('Access-Control-Allow-Origin','*')
//     console.log('有人访问了');
//     res.send('ok')    
// })

app.use('*',function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*'); //这个表示任意域名都可以访问，这样写不能携带cookie了。
//   res.header('Access-Control-Allow-Origin', 'localhost:3001'); //这样写，只有www.baidu.com 可以访问。
	res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
	res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');//设置方法
	// if (req.method == 'OPTIONS') {
	//   res.send(200); 
	// }
	// else {
	//   next();
	// }
	next();
});

app.post('/register',(req,res) =>{
    let {username,password} = req.body
	knex('userdata').select().where({username}).andWhere({password}).then(response => {
        if(response.length){
            res.send(new errorModel({msg:'账号已注册'}))
        }else{
            knex('userdata').insert({username,password}).then(response => res.send(new successModel({msg:'添加成功'})))
        }
    })
})

app.post('/login',(req,res) =>{
    let {username,password} = req.body
    knex('userdata').select().where({username}).andWhere({password}).then(response => {
        if(response.length){
            res.send(new successModel({msg:'登录成功',data:response[0]}))
        }else{
            res.send(new errorModel({msg:'登录失败'}))
        }
    })
})

app.get('/chak',(req,res) =>{
    // let {username,password} = req.query
    // knex('userdata').select().where({username}).andWhere({password}).then(response => {
    //     if(response.length){
    //         res.send(new successModel({msg:'登录成功'}))
    //     }else{
    //         res.send(new errorModel({msg:'登录失败'}))
    //     }
    // })
    knex('userdata').select().where({}).then(response => res.send(new successModel({msg:'调用成功返回所有',data:response})))
})

app.get('queryText', (req,response) =>{
	knex('essay').select().where({isdel:0}).then(res =>{
		console.log(res)
		response.send(res)
	})	
})

app.post('/addText', (req,response) =>{
	let {title,content,userId} = req.body
 	knex('essay').insert({title,content,userId}).then(res =>{
		console.log(res)
		response.send(res)
	})	
})

app.post('/updataText',(req,response) =>{
	let {userId,content,img,textId} = req.body
	knex('essay').where({userId,textId}).update({content,img}).then(res =>{
		console.log(res)
		response.send(res)
	})
})


app.post('/delText', (req,response) =>{ 
	let {userId,textId,isadmin} = req.body
	if (isadmin) {
		knex('essay').where({userId,textId}).del().then(res =>{
			console.log(res)
			response.send(res)
		})
	}else{
		knex('essay').where({userId,textId}).update({isdel:1}).then(res =>{
			console.log(res)
			response.send(res)
		})
	}
})

app.get('/queryAllUser', (req,response) => {
	knex('userdata').select().where({}).then(res =>{
		console.log(res)
		response.send(res)
	})
})


app.post('/queryUser' ,(req,response) =>{
	let {userId} = req.body
	knex('userdata').select().where({userId}).then(res =>{
		console.log(res)
		response.send(res)
	})
})


app.listen(port,()=>console.log(`服务器已开启端口号为${port}`))
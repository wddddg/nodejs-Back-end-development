const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const upload = multer({ dest: 'uploads/' })


const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
const port = 3002

const successModel = require('./module/success')
const errorModel = require('./module/error')

const knex = require('./utils/knex')


app.get('/uploads', (req, res, next) => {
	if (req.query.img === 'undefined' || req.query.img === 'null' || req.query.img == '') return res.send(null)
	const filePath = path.resolve(__dirname, `./uploads/${req.query.img}`);
	fs.readFile(filePath, (err, data) => {
		if (!err) {
			var stream = fs.createReadStream(filePath);
			var responseData = [];//存储文件流
			if (stream) {//判断状态
				stream.on('data', function (chunk) {
					responseData.push(chunk);
				});
				stream.on('end', function () {
					var finalData = Buffer.concat(responseData);
					res.write(finalData);
					res.end();
				});
			}
		} else {
			return res.send(err)
		}
	})
})

app.use('*', function (req, res, next) {
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

app.post('/register', (req, res) => {
	let { username, password } = req.body
	knex('userdata').select().where({ username }).andWhere({ password }).then(response => {
		if (response.length) {
			res.send(new errorModel({ msg: '账号已注册' }))
		} else {
			knex('userdata').insert({ username, password }).then(response => res.send(new successModel({ msg: '添加成功' })))
		}
	}).catch(error => {
		res.send(error)
	})
})

app.post('/login', (req, res) => {
	let { username, password } = req.body
	knex('userdata').select().where({ username }).andWhere({ password }).then(response => {
		if (response.length) {
			res.send(new successModel({ msg: '登录成功', data: response[0] }))
		} else {
			res.send(new errorModel({ msg: '登录失败' }))
		}
	}).catch(error => {
		res.send(error)
	})
})

app.get('/chak', (req, res) => {
	knex('userdata').select().where({}).then(response => res.send(new successModel({ msg: '调用成功返回所有', data: response }))).catch(error => {
		res.send(error)
	})
})

app.get('/queryText', (req, response) => {
	let { userId } = req.query
	if (userId) {
		knex('essay').select().where({ isdel: 1 }).andWhere({ userId })
			.then(res => {
				response.send(res)
			}).catch(error => {
				response.send(error)
			})
	} else {
		knex('essay').select().where({ isdel: 1 })
			.then(res => {
				response.send(res)
			}).catch(error => {
				response.send(error)
			})
	}
})

app.post('/addText', upload.single('avatar'), (req, response) => {
	let { title, content, userId, username, contentHTML } = req.body
	knex('essay').insert({ title, content, userId, username, contentHTML, img: req.file.filename }).then(res => {
		if (res.length) {
			response.send(new successModel({ msg: '上传成功', data: res }))
		} else {
			response.send(new errorModel({ msg: '失败', data: res }))
		}
	}).catch(error => {
		response.send(error)
	})
})

app.post('/updataText', upload.single('avatar'), (req, response) => {
	let { userId, content, img, textId, contentHTML, title } = req.body
	knex('essay').where({ userId, id: textId }).update({ content, img: req.file.filename, contentHTML, title }).then(res => {
		if (res) {
			const filePath = path.resolve(__dirname, `./uploads/${img}`);
			fs.unlink(filePath, function (error) {
				if (error) {
					console.log(error);
					return false;
				}
			})
			response.send(new successModel({ msg: '修改成功', data: res }))
		} else {
			response.send(new errorModel({ msg: '失败修改', data: res }))
		}
	}).catch(error => {
		response.send(error)
	})
})


app.post('/delText', (req, response) => {
	let { userId, textId, isadmin, img } = req.body
	if (isadmin === '57') {
		knex('essay').where({ userId, id: textId }).del().then(res => {
			if (res) {
				response.send(new successModel({ msg: '删除成功', data: res }))
				const filePath = path.resolve(__dirname, `./uploads/${img}`);
				fs.unlink(filePath, function (error) {
					if (error) {
						console.log(error);
						return false;
					}
				})
			} else {
				response.send(new errorModel({ msg: '删除失败', data: res }))
			}
		}).catch(error => {
			response.send(error)
		})
	} else {
		knex('essay').where({ userId, id: textId }).update({ isdel: 0 }).then(res => {
			if (res) {
				response.send(new successModel({ msg: '删除成功', data: res }))
			} else {
				response.send(new errorModel({ msg: '删除失败', data: res }))
			}
		}).catch(error => {
			response.send(error)
		})
	}
})

app.get('/queryAllUser', (req, response) => {
	knex('userdata').select().where({}).then(async res => {
		for (let i = 0; i < res.length; i++) {
			await knex('essay').select().where({ isdel: 1 }).andWhere({ userId: res[i].id }).then(ress => res[i].essayLength = ress.length)
		}
		response.send(new successModel({ msg: '查询成功', data: res }))
	}).catch(error => {
		response.send(error)
	})
})

app.post('/delUser', (req, response) => {
	let { userId, isadmin } = req.body
	if (isadmin === '57') {
		knex('userdata').where({ id: userId }).del().then(res => {
			response.send(new successModel({ msg: '删除用户成功', data: res }))
		}).catch(error => {
			response.send(error)
		})
	} else {
		response.send(new errorModel({ msg: '您不是管理员,没权限' }))
	}
})

app.post('/setAdmin', (req, response) => {
	let { userId, isadmin } = req.body
	if (isadmin === '57') {
		knex('userdata').where({ id: userId }).update({ isadmin: '57' }).then(res => {
			response.send(new successModel({ msg: '修改用户成功', data: res }))
		}).catch(error => {
			response.send(error)
		})
	} else {
		response.send(new errorModel({ msg: '您不是管理员,没权限' }))
	}
})

app.post('/updataAdminPassword', (req, response) => {
	let { userId, newPassword, oldPassword } = req.body
	knex('userdata').where({ id: userId, password: oldPassword }).update({ password: newPassword }).then(res => {
		if (res) {
			response.send(new successModel({ msg: '修改密码成功', data: res }))
		} else {
			response.send(new errorModel({ msg: '修改密码失败,请查看密码是否输入正确' }))
		}
	}).catch(error => {
		response.send(error)
	})
})

app.post('/uploadsAvatar', upload.single('avatar'), (req, response) => {
	let { userId, icons } = req.body
	knex('userdata').where({ id: userId }).update({ icon: req.file.filename }).then(res => {
		const filePath = path.resolve(__dirname, `./uploads/${icons}`);
		fs.unlink(filePath, function (error) {
			if (error) {
				console.log(error);
				return false;
			}
		})
		return knex('userdata').where({ id: userId }).select()
	}).then(res => {
		response.send(new successModel({ msg: '修改用户成功', data: res }))
	}).catch(error => {
		response.send(error)
	})
})

app.post('/queryUser', (req, response) => {
	let { userId } = req.body
	knex('userdata').select().where({ userId }).then(res => {
		response.send(res)
	}).catch(error => {
		response.send(error)
	})
})

app.get('/queryAllLength', async (req, response) => {
	let allLength = {
		textNumber: 0,
		userNumber: 0,
		isadminNumber: 0,
		delTextNumber: 0
	}
	await knex('userdata').select().where({}).then(res => {
		allLength.userNumber = res.length
	}).catch(error => {
		response.send(error)
	})
	await knex('userdata').select().where({ isadmin: 57 }).then(res => {
		allLength.isadminNumber = res.length
	}).catch(error => {
		response.send(error)
	})
	await knex('essay').select().where({ isdel: 1 }).then(res => {
		allLength.textNumber = res.length
	}).catch(error => {
		response.send(error)
	})
	await knex('essay').select().where({ isdel: 0 }).then(res => {
		allLength.delTextNumber = res.length
	}).catch(error => {
		response.send(error)
	})
	response.send(allLength)
})


app.listen(port, () => console.log(`服务器已开启端口号为${port}`))
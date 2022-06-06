const knex = require('knex')({
    client:'mysql',
    connection:{
        host:'localhost',
        user:'root',
        password:'2600858',
        database:'test'
    }
})

module.exports = knex
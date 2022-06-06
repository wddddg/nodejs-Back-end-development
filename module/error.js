class errorModel{
    constructor({msg}){
        this.code = 400
        this.msg=msg
    }
}

module.exports = errorModel
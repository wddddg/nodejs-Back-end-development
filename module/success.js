class successModel{
    constructor({msg,data}){
        this.code = 200
        this.msg=msg
        if(data){
          this.data = data  
        }
    }
}
module.exports = successModel
export function message({status,message,data, error}:{status:number,message:string, data?:any,error?:any}){
    if(status == 200){
        return {
            status,    
            message:message,
            data
        }
    }

    return {
        message,
        status,
        data:{
            error,
        }
    }

    return 
}
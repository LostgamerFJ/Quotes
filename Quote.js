import { QuoteLine } from `./QuoteLine.js`;    

export class Quote {

    constructor(ID, LINES = []){
        const id = ID;
        const lines = LINES;
    }

    static fromJSON(obj){
        return new Quote(obj.id, obj.lines)
    }

}
export class Quote {

    constructor(ID, LINES = []){
        this.id = ID;
        this.lines = LINES;
    }

    static fromJSON(obj){
        return new Quote(obj.id, obj.lines)
    }

}
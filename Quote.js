export class Quote {

    constructor(ID, LINES = []){
        this.id = ID;
        this.lines = LINES;
    }

    getLines(){
        return this.lines;
    }

    static fromJSON(obj){
        return new Quote(obj.id, obj.lines)
    }

}
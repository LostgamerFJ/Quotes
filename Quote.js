import { QuoteLines } from "./app";

export class Quote {

    constructor(ID, LINEIDS = []){
        this.id = ID;
        this.lineIds = LINEIDS;
    }

    getLineIDs(){
        return this.lineIds;
    }

    getLines(){
        let Lines = []
        for (let lines of QuoteLines){
            for (let LineIds of this.lineIds){
                if (LineIds === lines.getID()){
                    Lines.push(lines);
                }
            }
        }
        return Lines;
    }

    static fromJSON(obj){
        return new Quote(obj.id, obj.lines)
    }

}
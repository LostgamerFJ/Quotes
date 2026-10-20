import { QuoteLines } from "./app.js";

export class Quote {

    constructor(ID, LINEIDS = [], HIDDEN = false){
        this.id = ID;
        this.lineIds = LINEIDS;
        this.hidden = HIDDEN;
    }

    getLineIDs(){
        return this.lineIds;
    }

    getLines(){
        let Lines = []
        for (let LineIds of this.lineIds){
            for (let lines of QuoteLines){
                if (LineIds === lines.getID()){
                    Lines.push(lines);
                }
            }
        }
        return Lines;
    }

    getID(){
        return this.id;
    }

    isHidden(){
        return this.hidden;
    }

    changeID(newID){
        this.id = newID;
    }

    changeLineIDs(newLineIDs){
        this.lineIds = newLineIDs;
    }

    static fromJSON(obj){
        return new Quote(obj.id, obj.lineIds, obj.hidden)
    }

}
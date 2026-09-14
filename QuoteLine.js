import { Persons } from "./app.js";

export class QuoteLine {

    constructor(ID, PID, QUOTE, NOTES = null, CONTEXT = null){
        this.id = ID;
        this.personId = PID;
        this.notes = NOTES;
        this.quote = QUOTE;
        this.context = CONTEXT;
    }

    static fromJSON(obj){
        return new QuoteLine(obj.id, obj.personId, obj.quote, obj.notes, obj.context)
    }

    getID() {
        return this.id;
    }

    getPID(){
        return this.personId;
    }

    getPerson(){
        for (let prsns of Persons){
            if (prsns.getID() == this.personId){
                return prsns;
            }
        }
    }

    assemble(){
        let QuoteString = "";
        if (this.notes != null){
            QuoteString += this.notes + " ";
        }
        
        QuoteString += this.quote;

        if (this.context != null){
            QuoteString += " " + this.context;
        }

        return QuoteString;
    }

    assembleMultiple(){
        let QuoteString = "";
        if (this.notes != null){
            QuoteString += this.notes + ": ";
        }
        
        QuoteString += this.quote;

        if (this.context != null){
            QuoteString += " " + this.context;
        }

        return QuoteString;
    }

}
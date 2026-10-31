import { Persons } from "./app.js";

export class QuoteLine {

    constructor(ID, PID, QUOTE, NOTES = null, AFTER = null){
        this.id = ID;
        this.personId = PID;
        this.before = NOTES;
        this.quote = QUOTE;
        this.after = AFTER;
    }

    static fromJSON(obj){
        return new QuoteLine(obj.id, obj.personId, obj.quote, obj.before, obj.after)
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

    changeID(newID){
        this.id = newID;
    }

    changePID(newPID){
        this.personId = newPID;
    }

    assemble(){
        let QuoteString = "";
        if (this.before != null){
            QuoteString += this.before + " ";
        }
        
        QuoteString += this.quote;

        if (this.after != null){
            QuoteString += " " + this.after;
        }

        return QuoteString;
    }

    assembleMultiple(){
        if (this.getPerson().isEinschub()){
            return this.after;
        }
        let QuoteString = "";
        if (this.before != null && this.quote != null){
            QuoteString += this.before + ": ";
        } else if (this.before != null && this.quote == null){
            QuoteString += this.before + " ";
        }
        
        QuoteString += this.quote;

        if (this.after != null){
            QuoteString += " " + this.after;
        }

        return QuoteString;
    }

}
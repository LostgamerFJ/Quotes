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

    getBefore(){
        return this.before.replace("(", "").replace(")", "").replace("*", "");
    }

    getQuote(){
        return this.quote.replace(`\"`, "")
    }

    getAfter(){
        return this.after.replace("(", "").replace(")", "").replace("*", "");
    }

    changeID(newID){
        this.id = newID;
    }

    changePID(newPID){
        this.personId = newPID;
    }

    assemble(){
        let QuoteString = "";
        if (this.before != ""){
            QuoteString += this.before + " ";
        }
        if (this.quote != ""){
            QuoteString += this.quote;
        }
        if (this.after != ""){
            QuoteString += " " + this.after;
        }

        return QuoteString;
    }

    assembleMultiple(preview = false){
        if (preview == false){
            if (this.getPerson().isEinschub()){
                return this.after;
            }
        }
        let QuoteString = "";
        if (this.before != "" && this.quote != ""){
            QuoteString += " " + this.before + ": ";
        } else if (this.before != "" && this.quote == ""){
            QuoteString += ": " +  this.before;
        } else if (this.before == "" && this.quote != ""){
            QuoteString += ": ";
        }
        
        if (this.quote != ""){
            QuoteString += this.quote;
        }

        if (this.after != ""){
            QuoteString += " " + this.after;
        }

        return QuoteString == "" ? null : QuoteString;
    }

}
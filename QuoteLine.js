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

}
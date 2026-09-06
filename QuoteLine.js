export class QuoteLine {

    constructor(ID, PERSON, NOTES = null, QUOTE, CONTEXT = null){
        this.id = ID;
        this.person = PERSON;
        this.notes = NOTES;
        this.quote = QUOTE;
        this.context = CONTEXT;
    }

    static fromJSON(obj){
        return new QuoteLine(obj.id, obj.person, obj.notes, obj.quote, obj.context)
    }

}
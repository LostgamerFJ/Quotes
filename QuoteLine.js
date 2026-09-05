export class QuoteLine {

    constructor(ID, PERSON, NOTES = null, QUOTE, CONTEXT = null){
        let id = ID;
        let person = PERSON;
        let notes = NOTES;
        let quote = QUOTE;
        let context = CONTEXT;
    }

    static fromJSON(obj){
        return new QuoteLine(obj.id, obj.person, obj.notes, obj.quote, obj.context)
    }

}
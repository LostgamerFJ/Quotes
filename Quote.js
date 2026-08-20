export class Quote {

    qID;
    type;
    by;
    quote;
    to;
    notes;

    constructor(ID, TYPE, BY, QUOTE, TO = null, NOTES= null){
        this.qID = ID;
        this.type = TYPe;
        this.by = BY;
        this.quote = ZITAT;
        this.to = TO;
        this.notes = NOTES;
    }

}
export class Person {

    constructor(ID, LASTNAME, TAG, PICURL = ".assets/Portrait_Placeholder.png", SALUTATION = null, FIRSTNAME = null){
        this.id = ID;
        this.salutation = SALUTATION;
        this.firstName = FIRSTNAME;
        this.lastName = LASTNAME;
        this.tag = TAG;
        this.picUrl = PICURL;
    }

    changePic(picPath) {
        this.picUrl = picPath;
    }

    static fromJSON(obj){
        return new Person(obj.id, obj.salutation, obj.firstName, obj.lastName, obj.tag, obj.picUrl)
    }

}
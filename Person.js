export class Person {

    constructor(ID, SALUTATION = null, FIRSTNAME = null, LASTNAME, TAG, PICURL = "./Portrait_Placeholder.png"){
        this.id = ID;
        this.salutation = SALUTATION;
        this.firstName = FIRSTNAME;
        this.lastName = LASTNAME;
        this.tag = TAG;
        this.picUrl = PICURL;
    }

    changePic(picPath) {
        picUrl = picPath;
    }

    static fromJSON(obj){
        return new Person(obj.id, obj.salutation, obj.firstName, obj.lastName, obj.tag, obj.picUrl)
    }

}
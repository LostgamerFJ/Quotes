export class Person {

    constructor(ID, SALUTATION = null, FIRSTNAME = null, LASTNAME, TAG, PICURL = "./Portrait_Placeholder.png"){
        let id = ID;
        let salutation = SALUTATION;
        let firstName = FIRSTNAME;
        let lastName = LASTNAME;
        let tag = TAG;
        let picUrl = PICURL;
    }

    changePic(picPath) {
        picUrl = picPath;
    }

    static fromJSON(obj){
        return new Person(obj.id, obj.salutation, obj.firstName, obj.lastName, obj.tag, obj.picUrl)
    }

}
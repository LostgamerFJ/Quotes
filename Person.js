export class Person {

    constructor(ID, LASTNAME, TAG, PICURL, SALUTATION = null, FIRSTNAME = null){
        this.id = ID;
        this.salutation = SALUTATION;
        this.firstName = FIRSTNAME;
        this.lastName = LASTNAME;
        this.tag = TAG;
        if (PICURL.equals("Default")){
            this.picUrl = ".assets/Portrait_Placeholder.png";
        } else {
            this.picUrl = PICURL;
        }
    }

    changePic(picPath) {
        this.picUrl = picPath;
    }

    getID(){
        return this.id
    }

    getSrc(){
        return this.picUrl;
    }

    getName(){
        return this.firstName ? this.firstName + ' ' + this.lastName : this.salutation + ' ' + this.lastName
    }

    static fromJSON(obj){
        return new Person(obj.id, obj.salutation, obj.firstName, obj.lastName, obj.tag, obj.picUrl)
    }

}
export class Person {

    constructor(ID, LASTNAME, TAG, PICURL, SALUTATION = null, FIRSTNAME = null){
        this.id = ID;
        this.salutation = SALUTATION;
        this.firstName = FIRSTNAME;
        this.lastName = LASTNAME;
        this.tag = TAG;
        if (PICURL === "Default"){
            this.picUrl = "./assets/Portrait_Placeholder.png";
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
        if (this.isEinschub){
            return "";
        } else {
            return this.firstName ? this.firstName + ' ' + this.lastName : this.salutation + ' ' + this.lastName
        }
    }

    isEinschub(){
        if (this.tag === "Einschub"){
            return true;
        } else {
            return false;
        }
    }

    getLastName(){
        return this.lastName;
    }

    getTag(){
        return this.tag;
    }

    changeID(newID){
        this.id = newID;
    }

    static fromJSON(obj){
        return new Person(obj.id, obj.lastName, obj.tag, obj.picUrl, obj.salutation, obj.firstName);
    }

}
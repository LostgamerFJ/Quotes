export class Person {

    pID;
    firstName;
    lastName;
    tag;
    pic;

    constructor(PID, FIRSTNAME, LASTNAME, TAG, PIC = null){
        this.pID = PID;
        this.firstName = FIRSTNAME;
        this.lastName = LASTNAME;
        this.tag = TAG;
        this.pic = PIC;
    }

    changePic(picPath) {
        this.pic = new Image();
        this.pic.src = picPath;
    }

}
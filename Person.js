export class Person {

    pID;
    firstName;
    lastName;
    tag;
    pic;

    constructor(PID, FIRSTNAME, LASTNAME, TAG, PIC = "./Portrait_Placeholder.png"){
        this.pID = PID;
        this.firstName = FIRSTNAME;
        this.lastName = LASTNAME;
        this.tag = TAG;
        this.pic.src = PIC;
    }

    changePic(picPath) {
        this.pic = new Image();
        this.pic.src = picPath;
    }

}
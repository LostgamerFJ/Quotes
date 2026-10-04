export class User {

    constructor(USERNAME, ROLE, TOKEN){
        this.username = USERNAME;
        this.role = ROLE;
        this.token = TOKEN;
    }

    getUsername(){
        return this.username;
    }

    getRole(){
        return this.role;
    }

    getToken(){
        return this.token;
    }
}
export const types = `
    type User{
        id : ID! 
        firstName : String! 
        lastName : String 
        profileImageUrl : String  
        email : String!
        tweets : [Tweet]
        followers : [User]
        following : [User]
        recommendedUser : [User]
        
    }

`
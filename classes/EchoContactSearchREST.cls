@RestResource(urlMapping='/EchoContactSearch/*')
global with sharing class EchoContactSearchREST {
    
    global class ContactSearchRequest{
        public string firstName {get; set;}
        public string lastName {get; set;}
    }
    
    global class ContactSearchResponse{
        public string firstName {get; set;}
        public string lastName {get; set;}
        public string mobilePhone {get; set;}
        public string email {get; set;}
        public string accountName {get; set;}
        public string street {get; set;}
        public string city {get; set;}
        public string state {get; set;}
        public string postal {get; set;}
    }
    
    @HttpGet
    global static ContactSearchResponse FindContact() {
        ContactSearchRequest csr = new ContactSearchRequest();
        csr.firstName=RestContext.request.params.get('firstName');
        csr.lastName=RestContext.request.params.get('lastName');
        
        String[] vowel_fname = csr.firstName.split('([aeiou])');
        System.debug(vowel_fname);
        
        System.debug('Searching for '+csr.firstName+' '+csr.lastName);
        
        Boolean bFound = false;
        
        List<Contact> contacts = [SELECT ID, FirstName, LastName, MobilePhone, Email from Contact WHERE FIRSTNAME =: csr.firstName and LASTNAME =: csr.lastName];
        if(contacts.size() > 0){
            //for now ignore dupes
            ContactSearchResponse response = new ContactSearchResponse();
            response.firstName = contacts[0].firstName;
            response.lastName = contacts[0].lastName;
            response.email = contacts[0].email;
            response.mobilePhone = contacts[0].mobilePhone;
            System.debug('Returning with '+response.firstName);
            return response;
        } 
        
        //try a "like" for near misses
        string short_fname = '%'+csr.firstName+'%';
        string short_lname = '%'+csr.lastName+'%';
        contacts = [SELECT ID, FirstName, LastName, MobilePhone, Email from Contact WHERE FIRSTNAME LIKE: short_fname and LASTNAME LIKE: short_lname];
        if(contacts.size() > 0){
            //for now ignore dupes
            ContactSearchResponse response = new ContactSearchResponse();
            response.firstName = contacts[0].firstName;
            response.lastName = contacts[0].lastName;
            response.email = contacts[0].email;
            response.mobilePhone = contacts[0].mobilePhone;
            System.debug('Returning with '+response.firstName);
            return response;
        }
        
        //try spellings with similar first letters
        short_fname = csr.firstName.substring(1,csr.firstName.length());
        short_fname = '%'+short_fname+'%';
        contacts = [SELECT ID, FirstName, LastName, MobilePhone, Email from Contact WHERE FIRSTNAME LIKE: short_fname and LASTNAME LIKE: short_lname];
        if(contacts.size() > 0){
            //for now ignore dupes
            ContactSearchResponse response = new ContactSearchResponse();
            response.firstName = contacts[0].firstName;
            response.lastName = contacts[0].lastName;
            response.email = contacts[0].email;
            response.mobilePhone = contacts[0].mobilePhone;
            System.debug('Returning with '+response.firstName);
            return response;
        }
        
        /*
        //see if the first name has an odd ending ('ey' or 'ie')
        String[] vowel_fname = csr.firstName.split('(?<=[aeiou])');
        short_fname = csr.firstName.split(vowel_fname[vowel_fname.size()])[0];
        contacts = [SELECT ID, FirstName, LastName, MobilePhone, Email from Contact WHERE FIRSTNAME LIKE: short_fname and LASTNAME LIKE: short_lname];
        if(contacts.size() > 0){
            //for now ignore dupes
            ContactSearchResponse response = new ContactSearchResponse();
            response.firstName = contacts[0].firstName;
            response.lastName = contacts[0].lastName;
            response.email = contacts[0].email;
            response.mobilePhone = contacts[0].mobilePhone;
            
            return response;
        }
        
        short_fname = csr.firstName.split(vowel_fname[vowel_fname.size()-1])[0];
        contacts = [SELECT ID, FirstName, LastName, MobilePhone, Email from Contact WHERE FIRSTNAME LIKE: short_fname and LASTNAME LIKE: short_lname];
        if(contacts.size() > 0){
            //for now ignore dupes
            ContactSearchResponse response = new ContactSearchResponse();
            response.firstName = contacts[0].firstName;
            response.lastName = contacts[0].lastName;
            response.email = contacts[0].email;
            response.mobilePhone = contacts[0].mobilePhone;
            
            return response;
        }
        */
        
        return null;
    }
    
    
    
}
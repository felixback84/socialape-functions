// helper functions to validate post data in signup/login route - (without any validation library) 
const isEmail = (email) => {
    const regExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regExp)) return true;
    else return false;
} 
const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
  };

  exports.validateSignupData = (data) => {
      // validate data with helpers
      let errors = {};
      // valid email
      if(isEmpty(data.email)){
          errors.email = 'Must not be empty';
      } else if(!isEmail(data.email)){
          errors.email = 'Must be a valid email address';
      }
      // valid password
      if(isEmpty(data.password)) {errors.password = 'Must not be empty'};
      if(data.password !== data.confirmPassword) {errors.confirmPassword = "Passwords must match"};
      // valid handle 
      if(isEmpty(data.handle)) {errors.handle = 'Must not be empty'};
      
      // check errors object for any problem and if so, stop the logic
      return {
          errors,
          valid: Object.keys(errors).lenght === 0 ? true : false // errors in function validation Object.keys(errors) don`t work
      }
  } 

  exports.validateLoginData = (data) => {
    
      let errors = {};

      if(isEmpty(data.email)) errors.email = 'Must not be empty';
      if(isEmpty(data.password)) errors.password = 'Must not be empty';

      // check errors object for any problem and if so, stop the logic
      return {
        errors,
        valid: Object.keys(errors).lenght === 0 ? true : false // errors in function validation Object.keys(errors) don`t work
    }
  }

  exports.reduceUserDetails = (data) => {
    let userDetails = {};
  
    if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if (!isEmpty(data.website.trim())) {
      // https://website.com
      if (data.website.trim().substring(0, 4) !== 'http') {
        userDetails.website = `http://${data.website.trim()}`;
      } else userDetails.website = data.website;
    }
    if (!isEmpty(data.location.trim())) userDetails.location = data.location;
  
    return userDetails;
  };
  
  
export function isValidEmail (address) {
  return /^([0-9a-zA-Z]([-_\\.]*[0-9a-zA-Z]+)*)@([0-9a-zA-Z]([-_\\.]*[0-9a-zA-Z]+)*)[\\.]([a-zA-Z]{2,9})$/i.test(address);
};

export function isValidFirstName (value) {
    return /^[a-zA-Z\.]{2,}[a-zA-Z ]{0,30}$/.test(value);
};

export function isValidPhoneNum (value) {
    return /^\+?[0-9\(\)\-\.\ ]{7,20}[0-9]{3}$/.test(value);
}

export function isValidSSN (value) {
    return /^[0-9]{3}\-?[0-9]{2}\-?[0-9]{4}$/.test(value);
}

export function isValidPasswd (value) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*\(\)\-\_\=\+\{\}\[\]\;\:\'\"\,\.\<\>\/\\\|\?])(?=.{8,})/.test(value);
}

export function isValidSlug(value) {
    return /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(value);
}

export function isValidPassportNum(value) {
    return /[a-zA-Z]{2}[0-9]{7}/.test(value);
}

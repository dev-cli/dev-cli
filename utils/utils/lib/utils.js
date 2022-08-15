'use strict';

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}
function isArray(o) {
  return Array.isArray(o)
}
module.exports = {
    isObject,
    isArray
};

// Object.assign PollyFill
if (typeof Object.assign !== 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target === null || target === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource !== null && nextSource !== undefined) {
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

// classExtend
Function.prototype.classExtend = function classExtend(supper, methods) {
  this.prototype = Object.assign(Object.create(supper.prototype), {
    constructor: this,
  }, methods || {});
};

function toNumber(val) {
  val = Number(val);
  return isNaN(val) ? 0 : val;
}

function isInstance(obj, cls) {
  return obj instanceof cls;
}

function define(obj, prop, descriptor) {
  Object.defineProperty(obj, prop, descriptor);
}

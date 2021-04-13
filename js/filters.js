
function BaseFilter(options) {
  this.prop = options.prop || null;
  this.validator = options.validator || function() {return false};
}

BaseFilter.prototype = {
  constructor: BaseFilter,

  validate: function(record) {
    if (this.validator instanceof Function) {
      return this.validator.call(this, record);
    }
    return false;
  },

  setValidator: function(validator) {
    if (validator && validator instanceof Function) {
      this.validator = validator
    }
  },
};

// 按值过滤
function ValueFilter(options) {
  BaseFilter.call(this, options);

  this.value = options.value;

  this.validator = function(record) {
    return record[this.prop] === this.value;
  };
}

// 按范围过滤
function RangeFilter(options) {
  BaseFilter.call(this, options);

  this.min = toNumber(options.min);
  this.max = toNumber(options.max);

  this.validator = function(record) {
    const value = toNumber(record[this.prop]);
    return value >= this.min && value <= this.max;
  };
}

// 按枚举值过滤
function EnumFilter(options) {
  BaseFilter.call(this, options);

  this.items = options.items || [];

  this.validator = function(record) {
    return this.items.indexOf(record[this.prop]) >= 0;
  };
}

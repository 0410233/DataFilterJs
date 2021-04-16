
function BaseValidator(prop) {
  // 属性
  Object.defineProperty(this, 'prop', {
    value: prop,
  })

  // 格式转换器
  this.caster = function(value) {return value};

  // 值获取器
  this.resolver = function(record) {return record[this._prop]};

  // 值验证器
  this.validator = function(value) {return false};
}

BaseValidator.prototype = {
  constructor: BaseValidator,

  setCaster: function(caster) {
    if (caster instanceof Function) {
      this.caster = caster.bind(this);
    }
    return this;
  },

  setResolver: function(resolver) {
    if (resolver instanceof Function) {
      this.resolver = resolver.bind(this);
    }
    return this;
  },

  setValidator: function(validator) {
    if (validator instanceof Function) {
      this.validator = validator.bind(this);
    }
    return this;
  },

  validate: function(record) {
    const args = Array.prototype.slice.call(arguments);
    args[0] = this.caster(this.valueResolver(record));
    return !!this.valueValidator.apply(this, args);
  },
};

// 值验证器，由指定的属性和值自动生成验证函数
function ValueValidator(prop, value) {
  BaseValidator.call(this, prop);

  Object.defineProperty(this, 'value', {
    value: this.caster(value),
  })

  this.setValidator(function(value) {
    return value === this._value;
  });
}
ValueValidator.classExtend(BaseValidator, {});

// 范围验证器，由指定的属性和范围自动生成验证函数
function RangeValidator(prop, min, max) {
  BaseValidator.call(this, prop);

  Object.defineProperty(this, 'min', {
    value: this.caster(min),
  })

  Object.defineProperty(this, 'max', {
    value: this.caster(max),
  })

  this.setValidator(function(value) {
    return value >= this.min && value <= this.max;
  });
}
RangeValidator.classExtend(BaseValidator, {});

// 枚举值验证器，由指定的属性和枚举值自动生成验证函数
function EnumValidator(prop, items) {
  BaseValidator.call(this, prop);

  Object.defineProperty(this, 'items', {
    value: items || [],
  })

  this.setValidator(function(value) {
    return this.items.indexOf(value) >= 0;
  });
}
EnumValidator.classExtend(BaseValidator, {});

// 包含验证器，由指定的属性和枚举值自动生成验证函数
function ContainsValidator(prop) {
  BaseValidator.call(this, prop);

  this.setValidator(function(value, keywords) {
    if (! this.options.caseSensitive) {
      value = value.toLowerCase();
      keywords = keywords.toLowerCase();
    }
    return value.indexOf(keywords) >= 0;
  });
}
ContainsValidator.classExtend(BaseValidator, {});

// BaseValidator 的包装对象
function Validator(validator, id, label, total) {
  if (!validator || !(validator instanceof BaseValidator)) {
    throw '请指定过滤器';
  }

  if (!id) {
    throw '请指定过滤器的 id';
  }

  if (!label) {
    throw '请指定过滤器的 label';
  }

  this._validator = validator;
  this._id = id;
  this._label = label;
  this._total = total || 0;
  this._active = true;
}

Validator.prototype = {
  constructor: Validator,

  validate: function() {
    return this._validator.validate.apply(this._validator, Array.prototype.slice.call(arguments));
  },

  deactive: function() {
    this._active = false;
    return this;
  },

  active: function() {
    this._active = true;
    return this;
  },

  isActive: function() {
    return this._active;
  },

  count: function(data) {
    const validator = this._validator;
    this._total = data.reduce(function(total, datum) {
      return total + validator.validate(datum);
    }, 0);
  },
};

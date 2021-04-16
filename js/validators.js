;(function(global) {

  let validatorIndex = 1;
  let groupIndex = 1;

  const define = Object.defineProperty;

  function BaseValidator(prop) {
    let _group = null;
    let _name = '';

    // 所属分组
    define(this, 'group', {
      set: function(newGroup) {
        if (newGroup && newGroup instanceof ValidatorGroup) {
          _group = newGroup;
          _name = _group.name + '_validator_' + validatorIndex++;
        }
      },
      get: function() {
        return _group;
      },
    });

    // name
    define(this, 'name', {
      get: function() {
        return _name;
      }
    });

    // 属性
    define(this, 'prop', {value: prop});

    this._active = true;
    this._total = 0;

    // 格式转换器
    this.caster = function(value) {return value};

    // 值获取器
    this.resolver = function(record) {return record[this.prop]};

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
      args[0] = this.caster(this.resolver(record));
      return !!this.validator.apply(this, args);
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
      return !!this._active;
    },

    count: function(data) {
      if (data) {
        const validator = this;
        return this._total = data.reduce(function(total, datum) {
          return total + validator.validate(datum);
        }, 0);
      }
      return this._total;
    },
  };

  global.BaseValidator = BaseValidator;


  // 值验证器，由指定的属性和值自动生成验证函数
  function ValueValidator(prop, value) {
    BaseValidator.call(this, prop);

    define(this, 'value', {value: this.caster(value)})

    this.setValidator(function(value) {
      return value === this._value;
    });
  }
  ValueValidator.classExtend(BaseValidator, {});

  // 范围验证器，由指定的属性和范围自动生成验证函数
  function RangeValidator(prop, min, max) {
    BaseValidator.call(this, prop);

    define(this, 'min', {value: this.caster(min)})

    define(this, 'max', {value: this.caster(max)})

    this.setValidator(function(value) {
      return value >= this.min && value <= this.max;
    });
  }
  RangeValidator.classExtend(BaseValidator, {});

  global.RangeValidator = RangeValidator;


  // 枚举值验证器，由指定的属性和枚举值自动生成验证函数
  function EnumValidator(prop, items) {
    BaseValidator.call(this, prop);

    define(this, 'items', {value: items || []})

    this.setValidator(function(value) {
      return this.items.indexOf(value) >= 0;
    });
  }
  EnumValidator.classExtend(BaseValidator, {});

  // 包含验证器，由指定的属性和枚举值自动生成验证函数
  function ContainsValidator(prop, caseSensitive) {
    BaseValidator.call(this, prop);

    define(this, 'caseSensitive', {value: !!caseSensitive})

    this.setValidator(function(value, keywords) {
      if (! this.caseSensitive) {
        value = value.toLowerCase();
        keywords = keywords.toLowerCase();
      }
      return value.indexOf(keywords) >= 0;
    });
  }
  ContainsValidator.classExtend(BaseValidator, {});

  global.ContainsValidator = ContainsValidator;


  function ValidatorGroup(multiple) {
    this.name = 'group_' + groupIndex++;
    this.multiple = multiple === undefined ? true : !!multiple;

    this._validators = [];
  }

  ValidatorGroup.prototype = {
    constructor: ValidatorGroup,

    // 添加一个过滤选项
    add: function(validator) {
      if (validator && validator instanceof BaseValidator) {
        validator.group = this;
        this._validators.push(validator);
      }
      return this;
    },

    // 获取验证器
    all: function(filter) {
      filter = filter && filter instanceof Function ? filter : null;
      if (!filter) {
        return this._validators.slice();
      }

      const validators = [];
      this._validators.forEach(function(validator) {
        if (filter.call(null, validator)) {
          validators.push(validator);
        }
      });
      return validators;
    },

    // 获取所有可用的验证器
    allActive: function() {
      const validators = [];
      this._validators.forEach(function(validator) {
        if (validator.isActive()) {
          validators.push(validator);
        }
      });
      return validators;
    },

    // 过滤数据
    filter: function(data) {
      return data.filter(this.validate);
    },

    validate: function(record) {
      const validators = this._validators;
      for (let i = 0; i < validators.length; i++) {
        const validator = validators[i];
        if (validator.isActive() && !validator.validate(record)) {
          return false;
        }
      }
      return true;
    },

    count: function(data) {
      this._validators.forEach(function(validator) {
        validator.count(data);
      });
      return this;
    },
  };

  // 快速批量创建值验证器
  ValidatorGroup.makeValueGroup = function(prop, data) {
    const group = new ValidatorGroup();

    for (const key in _.countBy(data, prop)) {
      group.add(new ValueValidator(prop, key))
    }

    return group;
  }

  // 快速批量创建检索验证器
  ValidatorGroup.makeContainsGroup = function() {
    let props = Array.prototype.slice.call(arguments);
    if (props.length == 1 && _.isArray(props[0])) {
      props = props[0];
    }

    const group = new ValidatorGroup();
    props.forEach(function(prop) {
      group.add(new ContainsValidator(prop));
    });

    return group;
  }

  global.ValidatorGroup = ValidatorGroup;

})(window);

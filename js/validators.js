;(function(global) {

  let validatorIndex = 1;
  let groupIndex = 1;

  const defineProp = Object.defineProperty;

  function realArgs(args) {
    args = Array.prototype.slice.call(args);
    if (args.length == 1 && Array.isArray(args[0])) {
      return args[0];
    }
    return args;
  }

  function countBy(data, prop) {
    return data.reduce(function(result, datum) {
      const value = datum[prop];
      if (value != null) {
        if (result[value]) {
          result[value]++;
        } else {
          result[value] = 1;
        }
      }
      return result;
    }, {});
  }

  function BaseValidator(prop) {
    // id
    defineProp(this, 'id', {value: 'validator_' + validatorIndex++});

    // 属性
    defineProp(this, 'prop', {value: prop});

    this.active = false;
    this.total = 0;

    // 格式转换器
    this.caster = function(value) {return value};

    // 值获取器
    this.resolver = function(record) {return record[this.prop]};

    // 值验证器
    this.validator = function(value) {return false};

    let _group = null;

    // 所属分组
    defineProp(this, 'group', {
      set: function(newGroup) {
        if (newGroup && newGroup instanceof ValidatorGroup) {
          _group = newGroup;
        } else {
          throw '分组无效';
        }
      },
      get: function() {
        return _group;
      },
    });
  }

  BaseValidator.prototype = {
    constructor: BaseValidator,

    setGroup: function(group) {
      this.group = group;
      return this;
    },

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

    deactivate: function() {
      this.active = false;
      return this;
    },

    activate: function() {
      this.active = true;
      return this;
    },

    isActive: function() {
      return !!this.active;
    },

    validate: function(record) {
      const args = Array.prototype.slice.call(arguments);
      args[0] = this.caster(this.resolver(record));
      return !!this.validator.apply(this, args);
    },

    count: function(data) {
      if (data) {
        const validator = this;
        return this.total = data.reduce(function(total, datum) {
          return total + validator.validate(datum);
        }, 0);
      }
      return this.total;
    },
  };

  global.BaseValidator = BaseValidator;


  // 值验证器，由指定的属性和值自动生成验证函数
  function ValueValidator(prop, value) {
    BaseValidator.call(this, prop);

    defineProp(this, 'value', {value: this.caster(value)});

    this.setValidator(function(value) {
      return value === this.value;
    });
  }
  ValueValidator.classExtend(BaseValidator, {});

  // 范围验证器，由指定的属性和范围自动生成验证函数
  function RangeValidator(prop, min, max) {
    BaseValidator.call(this, prop);

    defineProp(this, 'min', {value: this.caster(min)})

    defineProp(this, 'max', {value: this.caster(max)})

    this.setValidator(function(value) {
      return value >= this.min && value <= this.max;
    });
  }
  RangeValidator.classExtend(BaseValidator, {});

  global.RangeValidator = RangeValidator;


  // 枚举值验证器，由指定的属性和枚举值自动生成验证函数
  function EnumValidator(prop, items) {
    BaseValidator.call(this, prop);

    defineProp(this, 'items', {value: items || []});

    this.setValidator(function(value) {
      return this.items.indexOf(value) >= 0;
    });
  }
  EnumValidator.classExtend(BaseValidator, {});

  // 包含验证器，由指定的属性和枚举值自动生成验证函数
  function ContainsValidator(prop, caseSensitive) {
    BaseValidator.call(this, prop);

    defineProp(this, 'caseSensitive', {value: !!caseSensitive});

    this.setValidator(function(value, keywords) {
      keywords = keywords == null ? this.keywordsResolver() : keywords;
      if (!keywords.length) {
        return true;
      }
      if (! this.caseSensitive) {
        value = value.toLowerCase();
        keywords = keywords.toLowerCase();
      }
      return value.indexOf(keywords) >= 0;
    });

    this.setKeywordsResolver(function() {
      return '';
    });
  }
  ContainsValidator.classExtend(BaseValidator, {
    setKeywordsResolver: function(resolver) {
      if (resolver instanceof Function) {
        this.keywordsResolver = resolver.bind(this);
      }
      return this;
    },
  });

  global.ContainsValidator = ContainsValidator;


  function ValidatorGroup(multiple) {
    defineProp(this, 'id', {value: 'group_' + groupIndex++});

    defineProp(this, 'multiple', {value: multiple == null ? true : !!multiple});

    defineProp(this, 'actived', {
      get: function() {
        return this._validators.reduce(function(total, validator) {
          return total + validator.active;
        }, 0);
      },
    });

    defineProp(this, 'total', {
      get: function() {
        return this._validators.reduce(function(total, validator) {
          return total + validator.total;
        }, 0);
      },
    });

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
        if (validator.active) {
          validators.push(validator);
        }
      });
      return validators;
    },

    activate: function() {
      const ids = realArgs(arguments);
      const validators = this._validators;

      for (let i = 0; i < validators.length; i++) {
        const validator = validators[i];
        validator.active = ids.indexOf(validator.id) >= 0;
      }

      return this;
    },

    // 过滤数据
    filter: function(data) {
      return data.filter(this.validate);
    },

    validate: function(record) {
      const validators = this._validators;
      let actived = 0;
      for (let i = 0; i < validators.length; i++) {
        const validator = validators[i];
        if (validator.active && validator.validate(record)) {
          return true;
        }
        actived += validator.active;
      }
      return actived === 0;
    },

    count: function(data) {
      this._validators.forEach(function(validator) {
        validator.count(data);
      });
      return this;
    },
  };

  // 批量创建值验证器
  function makeValueValidatorsGroup(meta) {
    const group = new ValidatorGroup(meta.multiple);
    const prop = meta.prop;
    const data = Array.isArray(meta.data) ? meta.data : [];

    for (const key in countBy(data, prop)) {
      group.add(new ValueValidator(prop, key))
    }

    if (data.length) {
      group.count(data);
    }

    return group;
  }

  // 批量创建检索验证器
  function makeContainsValidatorsGroup(meta) {
    const group = new ValidatorGroup(meta.multiple);
    const props = Array.isArray(meta.prop) ? meta.prop : [meta.prop];

    props.forEach(function(prop) {
      group.add(new ContainsValidator(prop));
    });

    return group;
  }

  // 批量创建基础验证器
  function makeBaseValidatorsGroup(meta) {
    const group = new ValidatorGroup(meta.multiple);

    if (Array.isArray(meta.validators)) {
      meta.validators.forEach(function(validator) {
        group.add(validator);
      });
    }

    return group;
  }

  ValidatorGroup.make = function(meta) {
    switch (meta.type) {
      case 'value':
        return makeValueValidatorsGroup(meta);
      case 'search':
        return makeContainsValidatorsGroup(meta);
      default:
        return makeBaseValidatorsGroup(meta);
    }
  }

  global.ValidatorGroup = ValidatorGroup;

})(window);

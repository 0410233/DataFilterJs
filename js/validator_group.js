
function ValidatorGroup(name, multiple) {
  this.name = name;
  this.multiple = multiple || true;

  this._validators = [];
  this._index = 1;
}

ValidatorGroup.prototype = {
  constructor: ValidatorGroup,

  // 添加一个过滤选项
  add: function(validator, label) {
    try {
      const item = new Validator(validator, this.name+'_'+this._index++, label)
      this._validators.push(item);
    } catch (error) {
      console.error(error);
    }
  },

  // 获取验证器
  all: function(filter) {
    filter = filter && filter instanceof Function ? filter : null;
    const validators = [];
    this._validators.forEach(function(validator) {
      if (!filter || filter.call(null, validator)) {
        validators.push(validator);
      }
    });
    return validators;
  },

  // 获取所有可用的验证器
  allActive: function() {
    const validators = [];
    this._validators.forEach(function(validator) {
      if (validator.is_active) {
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
  },
};

ValidatorGroup.makeValueGroup = function(name, prop, data) {
  const group = new ValidatorGroup(name);
  if (_.isArray(prop)) {
    data = prop;
    prop = name;
  }

  for (const key in _.countBy(data, prop)) {
    group.add(new ValueValidator(prop, key), key)
  }

  return group;
}

ValidatorGroup.makeContainsGroup = function(name, props) {
  const group = new ValidatorGroup(name);
  if (_.isString(props)) {
    props = [props];
  }

  props.forEach(function(prop) {
    group.add(new ContainsValidator(prop), prop);
  });

  return group;
}

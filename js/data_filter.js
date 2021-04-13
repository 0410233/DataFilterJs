
function DataFilter(data) {
  this.data = data;
  this.filters = [];
}

DataFilter.prototype = {
  constructor: DataFilter,

  // 添加一个过滤选项
  addFilterItem: function(id, label, group, filter) {
    if (!id || !label) {
      console.error('请指定过滤器的 id 和 label');
      return;
    }

    if (group && (group instanceof BaseFilter)) {
      filter = group;
      group = null;
    }

    if (!filter || !(filter instanceof BaseFilter)) {
      console.error('请指定过滤器');
      return;
    }

    const filter = {
      filter: filter,
      id: id,
      label: label,
      group: group || 'default',
      total: 0,
      is_active: false,
    }

    filter.total = this.data.reduce(function(total, datum) {
      return total + filter.validate(datum);
    }, 0);

    this.filters.push(filter);
  },

  // 获取所有过滤选项
  getFilterItems: function() {
    const filters = {};
    this.filters.forEach(function(filter) {
      filters[filter.id] = filter;
    });

    return filters;
  },

  // 获取所有过滤选项，并分组
  getFilterItemsByGroup: function() {
    const groups = {};
    this.filters.forEach(function(filter) {
      const group = filter.group;
      if (groups[group] == null) {
        groups[group] = {};
      }
      groups[group][filter.id] = filter;
    });

    return groups;
  },

  // 过滤数据
  filter: function() {
    const filters = this.filters;
    return this.data.filter(function(datum) {
      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        if (filter.is_active && !filter.validate(datum)) {
          return false;
        }
      }
      return true;
    });
  },

  count: function(data) {
    data = data || this.data;
    this.filters.forEach(function(filter) {
      filter.total = data.reduce(function(total, datum) {
        return total + filter.validate(datum);
      }, 0);
    });
  },
};

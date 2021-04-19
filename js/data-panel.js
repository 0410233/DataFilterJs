;(function(global) {
  // 初始化布局组件
  function newLayout(options) {
    // 目标元素
    const el = options.el;
    if (! el) {
      throw '未指定目标元素';
    }

    // 初始化时，数据默认按那一列排序
    const initialSortBy = options.initialSortBy;

    // 排序指示器（图标）的选择器
    const sortingIndicatorSelector = options.sortingIndicatorSelector || '.sorting-indicator';

    // 升序时排序指示器添加的类
    const descendingClass = options.descendingClass || 'descending';

    // 降序时排序指示器添加的类
    const ascendingClass = options.ascendingClass || 'ascending';

    const columnRenders = options.render || {};

    const mixin = options.mixin || {};

    return new Vue({
      mixins: [mixin],

      el: el,

      data: function() {
        return {
          records: [],
          pagination: {
            perPage: 15,
            currentPage: 1,
          },
          sorting: {},
        };
      },

      computed: {
        // 当前页分展示的记录
        currentPageRecords: function() {
          const perpage = this.pagination.perPage;
          const page = this.pagination.currentPage;
          return this.records.slice((page-1)*perpage, page*perpage);
        },
      },

      methods: {
        // 初始化
        init: function(records) {
          this.resetSorting();
          if (initialSortBy) {
            records = _.sortBy(records, initialSortBy);
          }
          this.$set(this.$data, 'records', records.slice());
          this.pagination.currentPage = 1;
          this.sort.original = records.slice();
        },

        render: function(record, prop) {
          const value = record[prop];
          if (columnRenders[prop] && columnRenders[prop] instanceof Function) {
            return columnRenders[prop].call(this, value, record, prop);
          }
          return value;
        },

        // 排序
        sortBy: function(column, event) {

          const sorting = this.sorting;
          const target = event.currentTarget;
          const indicator = target.querySelector(sortingIndicatorSelector);
          const indicatorClass = indicator.classList;

          if (sorting.current !== column) {
            this.resetSorting();
          }
          sorting.current = column;
          sorting.indicator = indicator;

          // 如果未排序，则升序
          if (! sorting[column]) {
            sorting[column] = 'asc';
            this.$set(this.$data, 'records', _.sortBy(this.records, column));
            indicatorClass.remove(descendingClass);
            indicatorClass.add(ascendingClass);
          }

          // 如果升序，则降序
          else if (sorting[column] === 'asc') {
            sorting[column] = 'desc';
            this.records.reverse();
            indicatorClass.remove(ascendingClass);
            indicatorClass.add(descendingClass);
          }

          // 如果降序，则恢复未排序状态
          else if (sorting[column] === 'desc') {
            this.resetSorting();
            if (sorting.original) {
              this.$set(this.$data, 'records', sorting.original.slice());
            }
          }
        },

        // 清除排序标记
        resetSorting: function() {
          const sorting = this.sorting;

          if (sorting.indicator) {
            sorting.indicator.classList.remove(ascendingClass);
            sorting.indicator.classList.remove(descendingClass);
          }
          if (sorting.current) {
            sorting[sorting.current] = null;
            sorting.current = null;
          }
        },

        // 当前页改变
        handleCurrentPageChange: function(page) {
          this.pagination.currentPage = page;
        },
      },
    });
  }

  function getDefaultGroupValue(meta) {
    if (meta.default !== undefined) {
      return meta.default;
    }

    if (meta.type == 'search') {
      return '';
    }

    return meta.multiple === undefined || meta.multiple ? [] : '';
  }

  // 初始化过滤组件
  function newFilter(options) {
    // 目标元素
    const el = options.el;
    if (! el) {
      throw '未指定目标元素';
    }

    // 布局组件
    const layout = options.layout;
    if (! layout) {
      throw '未指定布局组件';
    }

    // 验证器组元数据
    const groupsMeta = options.groups;
    if (!groupsMeta || !Array.isArray(groupsMeta) || !groupsMeta.length) {
      throw '无法初始化验证器组';
    }

    const mixin = options.mixin || {};

    return new Vue({
      mixins: [mixin],

      el: el,

      data: function() {
        return {
          records: [],
          groups: {},
          values: {},
        };
      },

      created: function() {
        this.initGroups();

        this.$on('after-filter', function(data) {
          layout.init(data);
        });
      },

      methods: {
        // 初始化
        init: function(data) {
          this.records = data.slice();

          this.initGroups();

          this.$emit('after-filter', records);

          return this;
        },

        // 初始化筛选器
        initGroups: function() {
          const records = this.records;
          const filter = this;
          const groups = {};
          const values = {};

          // 根据构造信息生成验证器组
          groupsMeta.forEach(function(meta) {
            meta.data = records;
            const group = ValidatorGroup.make(meta);
            groups[meta.name] = group;
            values[meta.name] = getDefaultGroupValue(meta);

            // 如果是检索验证器组，则设置关键字获取器
            if (meta.type == 'search') {
              const prop = meta.name;
              group.all().forEach(function(validator) {
                // 设置关键字获取器
                validator.setKeywordsResolver(function() {
                  return filter.values && filter.values[prop] || '';
                });

                // 激活验证器
                validator.activate();
              });
            }
          });

          this.$set(this.$data, 'groups', groups);
          this.$set(this.$data, 'values', values);

          return this;
        },

        // 重置筛选器
        reset: function() {
          const groups = this.groups;
          const values = {};

          groupsMeta.forEach(function(meta) {
            values[meta.name] = getDefaultGroupValue(meta);
            if (meta.type != 'search') {
              groups[meta.name].all().forEach(function(validator) {
                // 停用验证器
                validator.deactivate();
              });
            }
          });

          this.$set(this.$data, 'values', values);

          return this;
        },

        // 可选的验证器改变时执行
        handleValidatorChange: function(groupName) {
          this.groups[groupName].activate(this.values[groupName]);

          this.handleFilterChange();
        },

        // 筛选条件改变时重新筛选数据
        handleFilterChange: function() {
          const groups = this.groups;

          const records = this.records.filter(function(record) {
            for (const key in groups) {
              if (!groups[key].validate(record)) return false;
            }
            return true;
          });

          this.$emit('after-filter', records);
        },
      },
    });
  }

  global.DataPanel = {
    newLayout: newLayout,
    newFilter: newFilter,
  };
})(window);

```javascript
// 基类
function FilterBase(prop) {
    this.prop = prop;
}

// 按值过滤
function ValueFilter(prop, value) {
    FilterBase.call(this, prop)
    this.value = value;
}

// 按范围过滤
function ScopeFilter(group, label, prop, min, max) {
    FilterBase.call(this, prop)
    this.min = min;
    this.max = max;
}

// 按枚举列表过滤
function EnumFilter(prop, items) {
    FilterBase.call(this, prop)
    this.items = items;
}

```


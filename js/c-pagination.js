
Vue.component('c-pagination', {
  props: {
    total: {
      type: Number,
      required: true,
    },
    perPage: {
      type: Number,
      default: 15,
    },
    pagerCount: { // 最多呈现多少个页码，包括第一个和最后一个
      type: Number,
      default: 5,
      validator: function(value) {
        return value===5 || value===7;
      },
    },
  },

  template: '' +
  '<div class="c-pagination">\n' +
  '  <button class="c-pagination__prev" @click="prevPage" :disabled="currentPage==1">\n' +
  '    <svg xmlns="http://www.w3.org/2000/svg" class="c-pagination__icon" viewBox="0 0 20 20" fill="currentColor">\n' +
  '      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />\n' +
  '    </svg>\n' +
  '  </button>\n' +
  '  <div class="c-pagination__pagers">\n' +
  '    <div class="c-pagination__pager" :class="{\'is-active\':currentPage===1}" @click="changePage(1)">1</div>\n' +
  '    <div v-if="showQuickprev" class="c-pagination__pager c-pagination__quickprev" @click="quickPrev()">\n' +
  '      <svg xmlns="http://www.w3.org/2000/svg" class="c-pagination__icon" viewBox="0 0 20 20" fill="currentColor">\n' +
  '        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />\n' +
  '      </svg>\n' +
  '    </div>\n' +
  '    <div v-for="pager in dynamicPagers" class="c-pagination__pager" :class="{\'is-active\':currentPage===pager}" @click="changePage(pager)">{{ pager }}</div>\n' +
  '    <div v-if="showQuicknext" class="c-pagination__pager c-pagination__quicknext" @click="quickNext()">\n' +
  '      <svg xmlns="http://www.w3.org/2000/svg" class="c-pagination__icon" viewBox="0 0 20 20" fill="currentColor">\n' +
  '        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />\n' +
  '      </svg>\n' +
  '    </div>\n' +
  '    <div v-if="pageCount > 1" class="c-pagination__pager" :class="{\'is-active\':currentPage===pageCount}" @click="changePage(pageCount)">{{pageCount}}</div>\n' +
  '  </div>\n' +
  '  <button class="c-pagination__next" @click="nextPage" :disabled="currentPage==pageCount">\n' +
  '    <svg xmlns="http://www.w3.org/2000/svg" class="c-pagination__icon" viewBox="0 0 20 20" fill="currentColor">\n' +
  '      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />\n' +
  '    </svg>\n' +
  '  </button>\n' +
  '</div>',

  data: function() {
    return {
      currentPage: 1,
      showQuickprev: false,
      showQuicknext: false,
    };
  },

  computed: {
    // 页数
    pageCount: function() {
      return Math.ceil(this.total/this.perPage);
    },

    // 动态页码
    dynamicPagers: function() {
      var left = 1;
      var right = this.pageCount;
      var length = this.pagerCount - 2;

      // 最左侧动态页码
      var start = this.currentPage - (length - 1)/2;

      // 最右侧动态页码
      var end = this.currentPage + (length - 1)/2;

      if (start <= left) {
        start = left+1;
        end = left+length;
      }

      else if (end >= right) {
        end = right-1;
        start = right-length;
      }

      var pagers = [];
      for (var i = start; i <= end; i++) {
        if (i > left && i < right) {
          pagers.push(i);
        }
      }

      this.showQuickprev = start > left+1;
      this.showQuicknext = end < right-1;

      return pagers;
    },
  },

  methods: {
    // 跳转到指定页
    changePage: function(page) {
      this.currentPage = Math.min(Math.max(page, 1), this.pageCount);

      this.$emit('current-change', this.currentPage);
    },

    reset: function() {
      this.changePage(1);
    },

    // 上一页
    prevPage: function() {
      this.changePage(this.currentPage - 1);
    },

    // 下一页
    nextPage: function() {
      this.changePage(this.currentPage + 1);
    },

    // 往前跳转 pagerCount-2 页
    quickPrev: function() {
      this.changePage(this.currentPage - (this.pagerCount - 2));
    },

    // 往后跳转 pagerCount-2 页
    quickNext: function() {
      this.changePage(this.currentPage + (this.pagerCount - 2));
    },
  },
});

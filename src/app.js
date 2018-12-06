Vue.component('facts', {
    template: `
        <div class="facts">
          <h1>Facts</h1>
        </div>
        `,
    data() {
        return {

        }
    },
    methods: {
    },
    computed: {
    }
})

Vue.component('rules', {
    template: `
        <div class="rules">
          <h1>Rules</h1>
        </div>
        `,
    data() {
        return {

        }
    },
    methods: {
    },
    computed: {
    }
})

Vue.component('results', {
    template: `
        <div class="results">
          <h1>Results</h1>
	  <ul id="example-1">
	    <li v-for="item in results">
	      <span v-bind:item="item">
		{{ item }}
	      </span>
	    </li>
	  </ul>
        </div>
        `,
    props: ['results'],
    methods: {
    },
    computed: {
    }
})

var app = new Vue({
    el: '#app',
    data: {
	results: [key, value] of Object.entries(eng.results),
	facts: eng.facts,
	rules: eng.rules
    }
});

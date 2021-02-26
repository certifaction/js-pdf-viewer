export default {
    methods: {
        _$t(key, ...values) {
            if (typeof this.$t === 'function') {
                return this.$t(key, ...values)
            }
            return key
        },
        _$tc(key, choice, ...values) {
            if (typeof this.$tc === 'function') {
                return this.$tc(key, choice, ...values)
            }
            return key
        },
        _$te(key, locale) {
            if (typeof this.$te === 'function') {
                return this.$te(key, locale)
            }
            return false
        },
        _$d(value, ...args) {
            if (typeof this.$d === 'function') {
                return this.$d(value, ...args)
            }
            return false
        },
        _$n(value, ...args) {
            if (typeof this.$n === 'function') {
                return this.$n(value, ...args)
            }
            return false
        }
    }
}

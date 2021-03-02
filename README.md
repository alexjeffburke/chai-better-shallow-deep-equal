# (Better) Chai Shallow Deep Equal plugin

This module provides a drop-in replacement `shallowDeepEqual`
assertion for [chai](https://www.chaijs.com) that uses strict
semantics and an intuitive output diff.

[![NPM version](https://img.shields.io/npm/v/chai-better-shallow-deep-equal.svg)](https://www.npmjs.com/package/chai-better-shallow-deep-equal)
[![Build Status](https://img.shields.io/github/workflow/status/alexjeffburke/chai-better-shallow-deep-equal/tests.svg)](https://github.com/alexjeffburke/chai-better-shallow-deep-equal/actions)
[![Coverage Status](https://img.shields.io/coveralls/alexjeffburke/chai-better-shallow-deep-equal/master.svg)](https://coveralls.io/r/alexjeffburke/chai-better-shallow-deep-equal?branch=master)

Under the hood the library wraps the [Unexpected](https://unexpected.js.org)
library, specifically making use of the structural
["to satisfy"](https://unexpected.js.org/assertions/any/to-satisfy/) assertion.

## Use

Once installed the plugin can be simply imported and used as a plugin:

```js
const chai = require("chai");
const expect = chai.expect;

chai.use(require("chai-better-shallow-deep-equal"));
```

An additional `.shallowDeepEqual()` assertion is then available for use and
on error an informative diff will be printed:


```js
expect({ foo: true, bar: 0 }).to.shallowDeepEqual({ foo: true, bar: 1 });
```

```output
expected { foo: true, bar: 0 } to satisfy { foo: true, bar: 1 }

{
  foo: true,
  bar: 0 // should equal 1
}
```

## Support for ES6 types

The plugin has support for structurally comparing both Map and Set objects:

```js
expect(
  new Map([
    ["foo", 1],
    ["bar", false]
  ])
).to.shallowDeepEqual(
  new Map([
    ["foo", 1],
    ["bar", true]
  ])
);
```

```output
expected Map([ ['foo', 1], ['bar', false] ])
to satisfy Map([ ['foo', 1], ['bar', true] ])

Map([
  ['foo', 1,]
  ['bar',
    false // should equal true
  ]
])
```

```js
expect(new Set(["foo", "baz"])).to.shallowDeepEqual(
  new Set(["foo", "bar"])
);
```

```output
expected Set([ 'foo', 'baz' ]) to satisfy Set([ 'foo', 'bar' ])

Set([
  'foo',
  'baz' // should be removed
  // missing 'bar'
])
```

## Customisation

### Adding types

Sometimes it can be beneficial to identify certain types within
the test suite - perhaps to customise their display or to treat
them otherwise differently. This can be achieved by using the
`addType()` API:

```js
const chaiBetterShallowDeepEqual = require("chai-better-shallow-deep-equal");

chaiBetterShallowDeepEqual.addType({
  name: "CustomDate",
  base: "date",
  identify: obj => obj && obj._isCustomDate
});
```

In the example above, we are trying to single out certain objects
that occur within a hypthetical test suite that use custom dates
by checking whether they have an "isCustomDate" property.

Given our definition of the `identify()` method above, when the
plugin encounters such objects it will think of them as `CustomDate`
and be aware that they extend the behavior of the builtin date type.

This API accepts the same options as the Unexpected
[addType()](https://unexpected.js.org/api/addType/) method.
Please consult the link for more detailed description.

### Custom Matching

With the availablity of custom types are in the picture, one common
desire is to allow customising the way those identified types are
matched.

By default only alike types are compared, but suppose that within
our tests we want to allow comparing any `CustomDate` object against
a, ISO time string.

Let's stick with the exmaple from our earlier hypothetical - we can
define allowing the comparison using the `addMatch()` API:

```js
chaiBetterShallowDeepEqual.addMatch({
  leftType: "CustomDate",
  rightType: "string",
  handler: (lhs, rhs) => [lhs.toISOString(), rhs]
});
```

What we've defined here is when we see a `CustomDate` being compared
to a string, to instead first convert it to an ISO string and then do
the comparison. In the test suite, the effect is to allow expecations
to be defined in a way that is much more easily read:

```js
const fooDate = new Date(1583947016326);

expect({ fooDate }).to.shallowDeepEqual({
  fooDate: "2020-03-11T17:16:56.326Z"
});
```

```output
expected { fooDate: new Date('Wed, 11 Mar 2020 17:16:56.326 GMT') }
to satisfy { fooDate: '2020-03-11T17:16:56.326Z' }

{
  fooDate: new Date('Wed, 11 Mar 2020 17:16:56.326 GMT') // should equal '2020-03-11T17:16:56.326Z'
}
```

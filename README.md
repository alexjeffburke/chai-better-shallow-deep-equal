# (Better) Chai Shallow Deep Equal plugin

This module provides a drop-in replacement `shallowDeepEqual`
assertion for [chai](https://www.chaijs.com) that uses strict
semantics and an intuitive output diff.

Under the hood the library wraps the [Unexpected](http://unexpected.js.org)
library, specifically making use of the structural
["to satify"](http://unexpected.js.org/assertions/any/to-satisfy/) assertion.

## Use

Once installed the plugin can simply be pulled in with require and used:

```js
const chai = require("chai");
const chaiExpect = chai.expect;

chai.use(require("chai-better-shallow-deep-equal"));

chaiExpect({ foo: true, bar: 1 }).to.shallowDeepEqual({ foo: true });
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
  base: "object",
  identify: obj => obj && obj._isCustomDate
});
```

In the example above, we are trying to single out something
in a test suite that is a custom date by `identify()`ing some
property of it (in this case a particular property). This API
accepts the same options as the Unexpected
[addType()](http://unexpected.js.org/api/addType/) method.

### Custom Matching

With custom types are in the picture, you may also want to allow
additional comparisons. By default only alike types are compared,
but one example of this might be to allow comparing dates (or only
our custom dates) to be compared to their ISO string representation.

Let's stick with the example of enabling this for dates - and we
can define this using the `addMatch()` API:

```js
chaiBetterShallowDeepEqual.addMatch({
  leftType: "date",
  rightType: "string",
  handler: (lhs, rhs) => [lhs.toISOString(), rhs]
});
```

What we've described here is that if a date is compared to a string,
to instead compare the ISO representation of the date against the
string. In the test suite, this would allow you to use string froms
of dates as your expectation:

```js
const fooDate = new Date(1583947016326);

chaiExpect({ fooDate }).to.shallowDeepEqual({
  fooDate: "2020-03-11T17:16:56.326Z"
});
```

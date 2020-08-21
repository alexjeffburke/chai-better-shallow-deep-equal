let expect = null;

// initialise local expect (with plugins)
_reset();

function chaiBetterShallowDeepEqual(chai, utils) {
  utils.addMethod(chai.Assertion.prototype, "shallowDeepEqual", function(obj) {
    expect(this._obj, "to satisfy", obj);
  });
}

function _reset() {
  expect = require("unexpected")
    .clone()
    .use(require("unexpected-map"))
    .use(require("unexpected-set"));
}

function addType(typeDefinition) {
  expect.addType(typeDefinition);
}

function addMatch(options) {
  const { leftType, rightType, handler } = options || {};

  const lines = [];
  if (typeof handler !== "function") {
    lines.push("  - no handler function was supplied");
  }
  if (!expect.getType(leftType)) {
    lines.push(`  - unable to find left type: ${leftType}`);
  }
  if (!expect.getType(rightType)) {
    lines.push(`  - unable to find right type: ${rightType}`);
  }
  if (lines.length > 0) {
    throw new Error(
      `Issues encountered while adding the match:\n${lines.join("\n")}`
    );
  }

  expect.addAssertion(
    `<${leftType}> to satisfy <${rightType}>`,
    (expect, subject, value) => {
      const alt = handler(subject, value);
      if (!(Array.isArray(alt) && alt.length === 2)) {
        throw new Error(
          `The handler for types "${leftType}, ${rightType}" did not return values.`
        );
      }
      const [lhs, rhs] = alt;

      expect.errorMode = "nested"; // provide context in the output diff for the custom comparison
      expect(lhs, "to satisfy", rhs);
    }
  );
}

module.exports = chaiBetterShallowDeepEqual;

// public exports
module.exports.addType = addType;
module.exports.addMatch = addMatch;

// test only exports
Object.defineProperty(module.exports, "_reset", {
  enumerable: false,
  get() {
    return _reset;
  }
});

let expect = null;

// initialise local expect (with plugins)
_reset();

function nonEmptyStringElseNull(obj) {
  return typeof obj === "string" && obj.length > 0 ? obj : null;
}

function chaiBetterShallowDeepEqual(chai, utils) {
  utils.addMethod(chai.Assertion.prototype, "shallowDeepEqual", function(obj) {
    const msg = nonEmptyStringElseNull(utils.flag(this, "message"));

    try {
      expect(this._obj, "to satisfy", obj);
    } catch (e) {
      let error = e;
      if (e.isUnexpected) {
        const errorMessage = msg !== null ? `${msg}:${e.message}` : e.message;

        error = new chai.AssertionError(errorMessage);

        const errorExpect = e.expect;
        Object.defineProperty(error, "expect", {
          enumerable: false,
          get() {
            return errorExpect;
          }
        });
        const errorGetErrorMessage = e.getErrorMessage.bind(e);
        Object.defineProperty(error, "getErrorMessage", {
          enumerable: false,
          get() {
            return errorGetErrorMessage;
          }
        });
      }
      throw error;
    }
  });

  chai.assert.shallowDeepEqual = function(val, obj) {
    new chai.Assertion(val).to.be.shallowDeepEqual(obj);
  };
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
Object.defineProperty(module.exports, "_expect", {
  enumerable: false,
  get() {
    return expect;
  }
});

Object.defineProperty(module.exports, "_reset", {
  enumerable: false,
  get() {
    return _reset;
  }
});

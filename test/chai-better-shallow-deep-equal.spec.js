const chai = require("chai");
const chaiExpect = chai.expect;
const expect = require("unexpected")
  .clone()
  .use(require("unexpected-snapshot"));

const chaiBetterShallowDeepEqual = require("../lib/chai-better-shallow-deep-equal");

chai.use(chaiBetterShallowDeepEqual);

const testTypeDefinition = {
  name: "FooType",
  base: "object",
  identify: v => v && typeof v.foo === "string" && v.foo,
  inspect(obj, depth, output) {
    output.text("--FOO--");
  }
};

describe("chai-better-shallow-deep-equal", () => {
  expect.addAssertion(
    "<function> to throw an error satisfying <assertion>",
    (expect, cb) =>
      expect(cb, "to throw").then(err => {
        expect.errorMode = "nested";
        return expect.shift(
          err.isUnexpected
            ? err.getErrorMessage("text").toString()
            : err.message
        );
      })
  );

  beforeEach(() => {
    chaiBetterShallowDeepEqual._reset();
  });

  it("should pass", () => {
    expect(() => {
      chaiExpect({ foo: "bar" }).to.shallowDeepEqual({ foo: "bar" });
    }, "not to throw");
  });

  it("should fail", () => {
    expect(
      () => {
        chaiExpect({ foo: "bar" }).to.shallowDeepEqual({ foo: "baz" });
      },
      "to throw an error satisfying",
      "to equal snapshot",
      expect.unindent`
        expected { foo: 'bar' } to satisfy { foo: 'baz' }

        {
          foo: 'bar' // should equal 'baz'
                     //
                     // -bar
                     // +baz
        }
      `
    );
  });

  it("should allow registering a type", () => {
    expect(() => {
      chaiBetterShallowDeepEqual.addType(testTypeDefinition);
    }, "not to throw");
  });

  describe("with an added type", () => {
    it("should fail and use the type in the diff", () => {
      chaiBetterShallowDeepEqual.addType(testTypeDefinition);

      expect(
        () => {
          chaiExpect({ foo: "bar" }).to.shallowDeepEqual({ foo: "baz" });
        },
        "to throw an error satisfying",
        "to equal snapshot",
        expect.unindent`
          expected --FOO-- to satisfy --FOO--

          {
            foo: 'bar' // should equal 'baz'
                       //
                       // -bar
                       // +baz
          }
        `
      );
    });
  });

  describe("addMatch()", () => {
    beforeEach(() => {
      chaiBetterShallowDeepEqual.addType(testTypeDefinition);
    });

    it("should allow adding a match", () => {
      expect(() => {
        chaiBetterShallowDeepEqual.addMatch({
          leftType: "FooType",
          rightType: "string",
          handler: () => {}
        });
      }, "not to throw");
    });

    it("should fail if the added handler does not return replacements", () => {
      chaiBetterShallowDeepEqual.addMatch({
        leftType: "FooType",
        rightType: "string",
        handler: () => {}
      });

      expect(
        () => {
          chaiExpect({ thing: { foo: "bar" } }).to.shallowDeepEqual({
            thing: "foobar"
          });
        },
        "to throw an error satisfying",
        "to equal snapshot",
        'The handler for types "FooType, string" did not return values.'
      );
    });

    it("should error if the left hand type does not exist", function() {
      expect(
        () => {
          chaiBetterShallowDeepEqual.addMatch({
            leftType: "BarType",
            rightType: "string",
            handler: () => {}
          });
        },
        "to throw an error satisfying",
        "to equal snapshot",
        expect.unindent`
          Issues encountered while adding the match:
            - unable to find left type: BarType
        `
      );
    });

    it("should error if the right hand type does not exist", function() {
      expect(
        () => {
          chaiBetterShallowDeepEqual.addMatch({
            leftType: "string",
            rightType: "BarType",
            handler: () => {}
          });
        },
        "to throw an error satisfying",
        "to equal snapshot",
        expect.unindent`
          Issues encountered while adding the match:
            - unable to find right type: BarType
        `
      );
    });

    it("should error if both types do not exist", function() {
      expect(
        () => {
          chaiBetterShallowDeepEqual.addMatch({
            leftType: "BarType",
            rightType: "BazType",
            handler: () => {}
          });
        },
        "to throw an error satisfying",
        "to equal snapshot",
        expect.unindent`
          Issues encountered while adding the match:
            - unable to find left type: BarType
            - unable to find right type: BazType
        `
      );
    });

    it("should error no options were supplied", function() {
      expect(
        () => {
          chaiBetterShallowDeepEqual.addMatch(null);
        },
        "to throw an error satisfying",
        "to equal snapshot",
        expect.unindent`
          Issues encountered while adding the match:
            - no handler function was supplied
        `
      );
    });

    describe("with an added match", () => {
      it("should fail and use the type in the diff", () => {
        chaiBetterShallowDeepEqual.addMatch({
          leftType: "FooType",
          rightType: "string",
          handler: (lhs, rhs) => [`foo${lhs.foo}`, rhs]
        });

        expect(() => {
          chaiExpect({ thing: { foo: "bar" } }).to.shallowDeepEqual({
            thing: "foobar"
          });
        }, "not to throw");
      });
    });
  });
});

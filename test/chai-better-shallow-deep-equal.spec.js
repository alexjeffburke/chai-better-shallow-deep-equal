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
          err.isUnexpected || err.getErrorMessage
            ? err.getErrorMessage("text").toString()
            : err.message
        );
      })
  );

  beforeEach(() => {
    chaiBetterShallowDeepEqual._reset();
    chaiBetterShallowDeepEqual._expect.output.preferredWidth = 100;
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

  it("should fail and include custom message", () => {
    expect(
      () => {
        chaiExpect({ foo: "bar" }, "boom").to.shallowDeepEqual({
          foo: "baz"
        });
      },
      "to throw",
      expect.it(err =>
        expect(String(err), "to start with", "AssertionError: boom:\n")
      )
    );
  });

  it("should allow registering a type", () => {
    expect(() => {
      chaiBetterShallowDeepEqual.addType(testTypeDefinition);
    }, "not to throw");
  });

  it("should allow using Map", () => {
    expect(
      () => {
        chaiExpect(
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
      },
      "to throw an error satisfying",
      "to equal snapshot",
      expect.unindent`
        expected new Map[ ['foo', 1], ['bar', false] ]) to satisfy new Map[ ['foo', 1], ['bar', true] ])

        new Map[
          ['foo', 1,]
          ['bar',
            false // should equal true
          ]
        ])
      `
    );
  });

  it("should allow using Set", () => {
    expect(
      () => {
        chaiExpect(new Set(["foo", "baz"])).to.shallowDeepEqual(
          new Set(["foo", "bar"])
        );
      },
      "to throw an error satisfying",
      "to equal snapshot",
      expect.unindent`
        expected new Set([ 'foo', 'baz' ]) to satisfy new Set([ 'foo', 'bar' ])

        new Set([
          'foo',
          'baz' // should be removed
          // missing 'bar'
        ])
      `
    );
  });

  describe("when using the expect api", () => {
    it("should not serialise the original stack trace", () => {
      expect(
        () => {
          chaiExpect({ foo: "baz" }).to.shallowDeepEqual({ foo: "bar" });
        },
        "to throw an error satisfying",
        "to equal snapshot",
        expect.unindent`
          expected { foo: 'baz' } to satisfy { foo: 'bar' }

          {
            foo: 'baz' // should equal 'bar'
                       //
                       // -baz
                       // +bar
          }
        `
      );
    });
  });

  describe("when using the should api", () => {
    it("should not serialise the original stack trace", () => {
      chai.should();

      expect(
        () => {
          ({ foo: "bar" }.should.shallowDeepEqual({ foo: "baz" }));
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
  });

  describe("when using the assert api", () => {
    it("should not serialise the original stack trace", () => {
      const assert = chai.assert;

      expect(
        () => {
          assert.shallowDeepEqual({ foo: "bar" }, { foo: "baz" });
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

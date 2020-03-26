class ForEach {
  constructor(checkItem) {
    this.checkItem = checkItem;
    this.keys = null;
  }
}

module.exports = function forEach(checkItem) {
  return new ForEach(checkItem);
};

module.exports.attachTo = function(expect) {
  const typeName = "better-ForEach";

  expect.addType({
    name: typeName,
    base: "object",
    identify: value => value instanceof ForEach,
    inspect: (value, depth, output, inspect) => {
      output
        .jsFunctionName("forEach")
        .text("(")
        .append(inspect(value.checkItem, depth))
        .text(")");
    }
  });

  expect.addAssertion(
    `<object> to satisfy <${typeName}>`,
    (expect, subject, value) => {
      if (!expect.subjectType.is("array-like")) {
        expect.fail({
          diff: (output, diff, inspect, equal) => {
            return output
              .append(inspect(subject))
              .sp()
              .jsComment("//")
              .sp()
              .error("the property being comapared is not an array");
          }
        });
      }

      expect(
        subject,
        "to have items satisfying",
        expect.it(item => {
          try {
            value.checkItem(item);
          } catch ({ message }) {
            expect.errorMode = "bubble";
            expect.fail({ message });
          }
        })
      );
    }
  );
};

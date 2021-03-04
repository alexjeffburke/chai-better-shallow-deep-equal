// Type definitions for chai-better-shallow-deep-equal
// TypeScript Version: 3.0

/// <reference types="chai" />

declare const chaiBetterShallowDeepEqual: Chai.ChaiPlugin;
export = chaiBetterShallowDeepEqual;

declare global {
    namespace Chai {
        interface Assertion {
            shallowDeepEqual(expected: any): void;
        }

        interface Assert {
            shallowDeepEqual(actual: any, expected: any): void;
        }
    }
}

import { reducerWithInitialValue, reducerWithoutInitialValue } from "../src/index";

describe("reducer builder", () => {
    it("should return a no-op reducer if no cases provided", () => {
        const reducer = reducerWithoutInitialValue();
        const state = { data: "hello" };
        expect(reducer(state, { type: "UNKNOWN" })).toBe(state);
    });

    it("should return an initial value if state is undefined", () => {
        const reducer = reducerWithInitialValue("hello");
        expect(reducer(undefined, { type: "UNKNOWN" })).toEqual("hello");
    });
});

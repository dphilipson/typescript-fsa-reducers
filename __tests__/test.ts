import actionCreatorFactory from "typescript-fsa";
import {
    reducerWithInitialState,
    reducerWithoutInitialState,
    upcastingReducer,
} from "../src/index";

const actionCreator = actionCreatorFactory();

interface State {
    data: string;
}

interface StateWithCount extends State {
    count: number;
}

const initialState: State = { data: "hello" };

const defaultHandlerResult: State = { ...initialState, data: "world" };

function defaultHandler(state: State): State {
    return {
        ...state,
        data: "world",
    };
}

const sliceData = actionCreator<number>("SLICE_DATA");
function sliceDataHandler(state: State, fromIndex: number): State {
    return { data: state.data.slice(fromIndex) };
}

const dataToUpperCase = actionCreator<void>("DATA_TO_UPPERCASE");
function dataToUpperCaseHandler(state: State): State {
    return { data: state.data.toUpperCase() };
}

const toBasicState = actionCreator<void>("TO_BASIC_STATE");
function toBasicStateHandler(state: StateWithCount): State {
    return { data: state.data };
}

describe("reducer builder", () => {
    it("should return a no-op reducer if no cases provided", () => {
        const reducer = reducerWithoutInitialState<State>();
        expect(reducer(initialState, { type: "UNKNOWN" })).toBe(initialState);
    });

    it("should execute the default handler if no cases provided", () => {
        const reducer = reducerWithoutInitialState<State>().default(
            defaultHandler,
        );
        expect(reducer(initialState, { type: "UNKNOWN" })).toEqual(
            defaultHandlerResult,
        );
    });

    it("should no-op on unknown actions if cases provided", () => {
        const reducer = reducerWithoutInitialState<State>()
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler);
        expect(reducer(initialState, { type: "UNKNOWN" })).toBe(initialState);
    });

    it("should execute the default handler on unknown actions if cases provided", () => {
        const reducer = reducerWithoutInitialState<State>()
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler)
            .default(defaultHandler);
        expect(reducer(initialState, { type: "UNKNOWN" })).toEqual(
            defaultHandlerResult,
        );
    });

    it("should return an initial value if state is undefined if no cases provided", () => {
        const reducer = reducerWithInitialState(initialState);
        expect(reducer(undefined, { type: "UNKNOWN" })).toBe(initialState);
    });

    it("should return default handler result if state is undefined if only default handler provided", () => {
        const reducer = reducerWithInitialState(initialState).default(
            defaultHandler,
        );
        expect(reducer(undefined, { type: "UNKNOWN" })).toEqual(
            defaultHandlerResult,
        );
    });

    it("should return an initial value if state is undefined if cases provided", () => {
        const reducer = reducerWithInitialState(initialState)
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler);
        expect(reducer(undefined, { type: "UNKNOWN" })).toBe(initialState);
    });

    it("should return default handler result if state is undefined if cases and default handler provided", () => {
        const reducer = reducerWithInitialState(initialState)
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler)
            .default(defaultHandler);
        expect(reducer(undefined, { type: "UNKNOWN" })).toEqual(
            defaultHandlerResult,
        );
    });

    it("should call handler on matching action with single handler", () => {
        const reducer = reducerWithoutInitialState<State>().case(
            sliceData,
            sliceDataHandler,
        );
        expect(reducer(initialState, sliceData(1))).toEqual({ data: "ello" });
    });

    it("should call handler on matching action with multiple handlers", () => {
        const reducer = reducerWithoutInitialState<State>()
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler);
        expect(reducer(initialState, dataToUpperCase)).toEqual({
            data: "HELLO",
        });
    });

    it("should call handler on matching action with multiple handlers and default handler", () => {
        const reducer = reducerWithoutInitialState<State>()
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler)
            .default(defaultHandler);
        expect(reducer(initialState, dataToUpperCase)).toEqual({
            data: "HELLO",
        });
    });

    it("should call full-action handler when using .caseWithAction()", () => {
        const reducer = reducerWithInitialState(initialState).caseWithAction(
            sliceData,
            (state, action) => ({
                ...state,
                data: state.data.slice(action.payload),
                meta: { author: action.meta && action.meta.author },
            }),
        );
        expect(reducer(undefined, sliceData(1, { author: "cbrontë" }))).toEqual(
            {
                data: "ello",
                meta: { author: "cbrontë" },
            },
        );
    });

    it("should call upcasting handler on matching action", () => {
        const reducer = upcastingReducer<StateWithCount, State>().case(
            toBasicState,
            toBasicStateHandler,
        );
        expect(reducer({ data: "hello", count: 2 }, toBasicState)).toEqual({
            data: "hello",
        });
    });

    it("should be able to call nested reducer when using default handler", () => {
        const nestedReducer = reducerWithoutInitialState<State>()
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler);

        const reducer = reducerWithoutInitialState<{ nested: State }>().default(
            (state, action) => ({
                nested: nestedReducer(state.nested, action),
            }),
        );
        expect(reducer({ nested: initialState }, dataToUpperCase)).toEqual({
            nested: { data: "HELLO" },
        });
    });

    (() => {
        // Scope for shared testing values for .cases() and .casesWithAction().

        interface PayloadA {
            data: string;
            x: number;
        }
        interface PayloadB {
            data: string;
            y: number;
        }
        interface PayloadC {
            data: string;
            z: number;
        }
        const actionA = actionCreator<PayloadA>("ACTION_A");
        const actionB = actionCreator<PayloadB>("ACTION_B");
        const actionC = actionCreator<PayloadC>("ACTION_C");

        it("should call handler on any matching action when using .cases()", () => {
            const reducer = reducerWithInitialState(initialState).cases(
                [actionA, actionB, actionC],
                (state, payload) => {
                    return { ...state, data: payload.data };
                },
            );
            expect(
                reducer(initialState, actionA({ data: "from A", x: 0 })),
            ).toEqual({
                data: "from A",
            });
            expect(
                reducer(initialState, actionB({ data: "from B", y: 1 })),
            ).toEqual({
                data: "from B",
            });
            expect(
                reducer(initialState, actionC({ data: "from C", z: 2 })),
            ).toEqual({
                data: "from C",
            });
        });

        it("should call handler on any matching action when using .casesWithAction()", () => {
            const reducer = reducerWithInitialState(
                initialState,
            ).casesWithAction([actionA, actionB, actionC], (state, action) => {
                return { ...state, data: action.payload.data };
            });
            expect(
                reducer(initialState, actionA({ data: "from A", x: 0 })),
            ).toEqual({
                data: "from A",
            });
            expect(
                reducer(initialState, actionB({ data: "from B", y: 1 })),
            ).toEqual({
                data: "from B",
            });
            expect(
                reducer(initialState, actionC({ data: "from C", z: 2 })),
            ).toEqual({
                data: "from C",
            });
        });
    })();

    it("should be mutated by .case()", () => {
        const reducer = reducerWithInitialState(initialState);
        reducer.case(sliceData, sliceDataHandler);
        reducer.case(dataToUpperCase, dataToUpperCaseHandler);
        expect(reducer(undefined, sliceData(1))).toEqual({
            data: "ello",
        });
    });

    describe(".build()", () => {
        const reducer = reducerWithInitialState(initialState)
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler)
            .build();

        it("should return a function with no extra keys", () => {
            expect(Object.keys(reducer)).toEqual([]);
        });

        it("should return a function which behaves like the reducer", () => {
            expect(reducer(undefined, sliceData(1))).toEqual({
                data: "ello",
            });
        });

        it("should return a function that does not mutate if parent builder mutates", () => {
            const builder = reducerWithInitialState(initialState);
            const reducer1 = builder.build();
            builder.case(sliceData, sliceDataHandler);
            const reducer2 = builder.build();
            expect(reducer1(undefined, sliceData(1))).toEqual({
                data: "hello",
            });
            expect(reducer2(undefined, sliceData(1))).toEqual({
                data: "ello",
            });
        });
    });
});

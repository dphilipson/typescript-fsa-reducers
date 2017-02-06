import actionCreatorFactory from "redux-typescript-actions";
import { reducerWithInitialState, reducerWithoutInitialState, upcastingReducer } from "../src/index";

const actionCreator = actionCreatorFactory();

interface State {
    data: string;
}

interface StateWithCount extends State {
    count: number;
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

const initialState: State = { data: "hello" };

describe("reducer builder", () => {
    it("should return a no-op reducer if no cases provided", () => {
        const reducer = reducerWithoutInitialState<State>();
        expect(reducer(initialState, { type: "UNKNOWN" })).toBe(initialState);
    });

    it("should no-op on unknown actions if cases provided", () => {
        const reducer = reducerWithoutInitialState<State>()
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler);
        expect(reducer(initialState, { type: "UNKNOWN" })).toBe(initialState);
    });

    it("should return an initial value if state is undefined if no cases provided", () => {
        const reducer = reducerWithInitialState(initialState);
        expect(reducer(undefined, { type: "UNKNOWN" })).toBe(initialState);
    });

    it("should return an initial value if state is undefined if cases provided", () => {
        const reducer = reducerWithInitialState(initialState)
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler);
        expect(reducer(undefined, { type: "UNKNOWN" })).toBe(initialState);
    });

    it("should call handler on matching action with single handler", () => {
        const reducer = reducerWithoutInitialState<State>()
            .case(sliceData, sliceDataHandler);
        expect(reducer(initialState, sliceData(1))).toEqual({ data: "ello" });
    });

    it("should call handler on matching action with multiple handlers", () => {
        const reducer = reducerWithoutInitialState<State>()
            .case(sliceData, sliceDataHandler)
            .case(dataToUpperCase, dataToUpperCaseHandler);
        expect(reducer(initialState, dataToUpperCase)).toEqual({ data: "HELLO" });
    });

    it("should call upcasting handler on matching action", () => {
        const reducer = upcastingReducer<StateWithCount, State>()
            .case(toBasicState, toBasicStateHandler);
        expect(reducer({ data: "hello", count: 2 }, toBasicState)).toEqual({ data: "hello" });
    });
});

import { Action } from "redux";
import { ActionCreator, isType } from "redux-typescript-actions";

export interface ReducerBuilder<S> {
    case<P>(actionCreator: ActionCreator<P>, handler: Handler<S, P>): ReducerBuilder<S>;
    (state: S | undefined, action: Action): S;
}

export interface Handler<S, P> {
    (state: S, payload: P): S;
}

export function reducerWithInitialState<S>(initialValue: S): ReducerBuilder<S> {
    return makeReducer([], initialValue);
}

export function reducerWithoutInitialState<S>(): ReducerBuilder<S> {
    return makeReducer<S>([]);
}

interface Case<S, P> {
    actionCreator: ActionCreator<P>;
    handler: Handler<S, P>;
}

function makeReducer<S>(cases: Array<Case<S, any>>, initialValue?: S): ReducerBuilder<S> {
    const reducer = ((state: S = initialValue as S, action: Action): S => {
        for (let i = 0, length = cases.length; i < length; i++) {
            const { actionCreator, handler } = cases[i];
            if (isType(action, actionCreator)) {
                return handler(state, action.payload);
            }
        }
        return state;
    }) as ReducerBuilder<S>;

    reducer.case = <P>(actionCreator: ActionCreator<P>, handler: Handler<S, P>): ReducerBuilder<S> => {
        return makeReducer([...cases, { actionCreator, handler }], initialValue);
    };

    return reducer;
}

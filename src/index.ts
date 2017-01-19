import { Action, Reducer } from "redux";
import { ActionCreator, isType } from "redux-typescript-actions";

export interface ReducerBuilder<S> {
    case<P>(actionCreator: ActionCreator<P>, handler: Handler<S, P>): ReducerBuilder<S>;
    (state: S | undefined, action: Action): S;
}

export interface Handler<S, P> {
    (state: S, payload: P): S;
}

export function reducerWithInitialValue<S>(initialValue: S): ReducerBuilder<S> {
    return makeReducer([], initialValue);
}

export function reducerWithoutInitialValue<S>(): ReducerBuilder<S> {
    return makeReducer<S>([]);
}

function makeReducer<S>(handlers: Array<Handler<S, any>>, initialValue?: S): ReducerBuilder<S> {
    const reducer = ((state: S = initialValue as S, action: Action): S => {
        return state;
    }) as ReducerBuilder<S>;

    reducer.case = <P>(actionCreator: ActionCreator<P>, handler: Handler<S, P>): ReducerBuilder<S> {
        throw new Error("Not yet implemented");
    };
    
    return reducer;
}

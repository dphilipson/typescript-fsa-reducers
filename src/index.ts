import { Action } from "redux";
import { ActionCreator, isType } from "redux-typescript-actions";

export interface ReducerBuilder<InS extends OutS, OutS> {
    case<P>(actionCreator: ActionCreator<P>, handler: Handler<InS, OutS, P>): ReducerBuilder<InS, OutS>;
    (state: InS, action: Action): OutS;
}

export interface Handler<InS extends OutS, OutS, P> {
    (state: InS, payload: P): OutS;
}

export function reducerWithInitialState<S>(initialValue: S): ReducerBuilder<S, S> {
    return makeReducer<S, S>([], initialValue);
}

export function reducerWithoutInitialState<S>(): ReducerBuilder<S, S> {
    return makeReducer<S, S>([]);
}

export function upcastingReducer<InS extends OutS, OutS>(): ReducerBuilder<InS, OutS> {
    return makeReducer<InS, OutS>([]);
}

interface Case<InS extends OutS, OutS, P> {
    actionCreator: ActionCreator<P>;
    handler: Handler<InS, OutS, P>;
}

function makeReducer<InS extends OutS, OutS>(
    cases: Array<Case<InS, OutS, any>>,
    initialValue?: InS,
): ReducerBuilder<InS, OutS> {
    const reducer = ((state: InS = initialValue as InS, action: Action): OutS => {
        for (let i = 0, length = cases.length; i < length; i++) {
            const { actionCreator, handler } = cases[i];
            if (isType(action, actionCreator)) {
                return handler(state, action.payload);
            }
        }
        return state;
    }) as ReducerBuilder<InS, OutS>;

    reducer.case = <P>(
        actionCreator: ActionCreator<P>,
        handler: Handler<InS, OutS, P>
    ): ReducerBuilder<InS, OutS> => {
        return makeReducer([...cases, { actionCreator, handler }], initialValue);
    };

    return reducer;
}

import { Action, ActionCreator, AnyAction, isType } from "typescript-fsa";

export interface ReducerBuilder<InS extends OutS, OutS> {
    case<P>(actionCreator: ActionCreator<P>, handler: Handler<InS, OutS, P>): ReducerBuilder<InS, OutS>;
    caseWithAction<P>(
        actionCreator: ActionCreator<P>,
        handler: Handler<InS, OutS, Action<P>>,
    ): ReducerBuilder<InS, OutS>;
    // Intentionally avoid AnyAction type so packages can export reducers created using .build()
    // without requiring a dependency on typescript-fsa.
    build(): (state: InS, action: { type: any }) => OutS;
    (state: InS, action: AnyAction): OutS;
}

export interface Handler<InS extends OutS, OutS, P> {
    (state: InS, payload: P): OutS;
}

export function reducerWithInitialState<S>(initialState: S): ReducerBuilder<S, S> {
    return makeReducer<S, S>(initialState);
}

export function reducerWithoutInitialState<S>(): ReducerBuilder<S, S> {
    return makeReducer<S, S>();
}

export function upcastingReducer<InS extends OutS, OutS>(): ReducerBuilder<InS, OutS> {
    return makeReducer<InS, OutS>();
}

interface Case<InS extends OutS, OutS, P> {
    actionCreator: ActionCreator<P>;
    handler: Handler<InS, OutS, Action<P>>;
}

type CaseList<InS extends OutS, OutS> = Array<Case<InS, OutS, any>>;

function makeReducer<InS extends OutS, OutS>(initialState?: InS): ReducerBuilder<InS, OutS> {
    const cases: CaseList<InS, OutS> = [];
    const reducer = getReducerFunction(initialState, cases) as ReducerBuilder<InS, OutS>;

    reducer.caseWithAction = <P>(
        actionCreator: ActionCreator<P>,
        handler: Handler<InS, OutS, Action<P>>,
    ) => {
        cases.push({ actionCreator, handler });
        return reducer;
    };

    reducer.case = <P>(actionCreator: ActionCreator<P>, handler: Handler<InS, OutS, P>) =>
        reducer.caseWithAction(actionCreator, (state, action) => handler(state, action.payload));

    reducer.build = () => getReducerFunction(initialState, cases.slice());

    return reducer;
}

function getReducerFunction<InS extends OutS, OutS>(
    initialState: InS | undefined,
    cases: CaseList<InS, OutS>,
) {
    return (state = initialState as InS, action: AnyAction) => {
        for (let i = 0, length = cases.length; i < length; i++) {
            const { actionCreator, handler } = cases[i];
            if (isType(action, actionCreator)) {
                return handler(state, action);
            }
        }
        return state;
    };
}

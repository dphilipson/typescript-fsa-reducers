# Redux TypeScript Reducers

Fluent syntax for defining typesafe reducers on top of [typescript-fsa](https://github.com/aikoven/typescript-fsa).

[![Build Status](https://travis-ci.org/dphilipson/redux-typescript-reducers.svg?branch=master)](https://travis-ci.org/dphilipson/redux-typescript-reducers)

## Installation

```
npm install --save redux-typescript-reducers typescript-fsa
```

## Usage

This library allows you to define reducers by chaining a series of handlers for different action
types and optionally providing an initial value. It builds on top of and assumes familiarity with
the excellent [typescript-fsa](https://github.com/aikoven/typescript-fsa).

Suppose we have the setup:
``` javascript
import actionCreatorFactory from "typescript-fsa";
const actionCreator = actionCreatorFactory();

interface State {
    name: string;
    balance: number;
    isFrozen: boolean;
}

const INITIAL_STATE: State = {
    name: "Untitled",
    balance: 0,
    isFrozen: false,
};

const setName = actionCreator<string>("SET_NAME");
function setNameHandler(state: State, name: string): State {
    return { ...state, name };
}

const addBalance = actionCreator<number>("ADD_BALANCE");
function addBalanceHandler(state: State, addedBalance: number): State {
    return { ...state, balance: state.balance + addedBalance };
}

const setIsFrozen = actionCreator<boolean>("SET_IS_FROZEN");
function setIsFrozenHandler(state: State, isFrozen: boolean): State {
    return { ...state, isFrozen };
}
```
Using vanilla `typescript-fsa`, you would most likely define a reducer as follows:
``` javascript
import { Action } from "redux";
import { isType } from "typescript-fsa";

function reducer(state = INITIAL_STATE, action: Action): State {
    if (isType(action, setName)) {
        return setNameHandler(state, action.payload);
    } else if (isType(action, addBalance)) {
        return addBalanceHandler(state, action.payload);
    } else if (isType(action, setIsFrozen)) {
        return setIsFrozenHandler(state, action.payload);
    } else {
        return state;
    }
}
```
With `redux-typescript-reducers`, this is exactly equivalent to the following code:
``` javascript
import { reducerWithInitialState } from "redux-typescript-reducer";

const reducer = reducerWithInitialState(INITIAL_STATE)
    .case(setName, setNameHandler)
    .case(addBalance, addBalanceHandler)
    .case(setIsFrozen, setIsFrozenHandler);
```
Everything is typesafe. If the types of the action payload and handler don't line up, then
TypeScript will complain.

The reducer builders are immutable. Each call to `.case()` returns a new reducer rather than
modifying the callee.

## API

### `reducerWithInitialState(initialState)`

Starts a reducer builder-chain which uses the provided initial state if passed `undefined` as its
state. For example usage, see the "Usage" section above.

### `reducerWithoutInitialState()`

Starts a reducer builder-chain without special logic for an initial state. `undefined` will be
treated like any other value for the state.

Redux seems to really want you to provide an initial state for your reducers. Its `createStore` API
encourages it and `combineReducers` function enforces it. For the Redux author's reasoning behind
this, see [this thread](https://github.com/reactjs/redux/issues/514). For this reason,
`reducerWithInitialState` will likely be the more common choice, but the option to not provide an
initial state is there in case you have some means of composing reducers for which intial state is
unnecessary.

Note that since the type of the state cannot be inferred from the initial state, it must be provided
as a type parameter:
``` javascript
const reducer = reducerWithoutInitialState<State>()
    .case(setName, setNameHandler)
    .case(addBalance, addBalanceHandler)
    .case(setIsFrozen, setIsFrozenHandler);
```

### `upcastingReducer()`

Starts a reducer builder-chain which produces a reducer whose return type is a supertype of the
input state. This is most useful for handling a state which may be in one of several "modes", each
of which responds differently to actions and can transition to the other modes. Many programs will
not have a use for this.

Example usage:
``` javascript
type State = StoppedState | RunningState;

interface StoppedState {
    type: "STOPPED";
}

interface StartedState {
    type: "STARTED";
    count: number;
}

const startWithCount = actionCreator<number>("START_WITH_COUNT");
const addToCount = actionCreator<number>("ADD_TO_COUNT");
const stop = actionCreator<void>("STOP");

function startWithCountHandler(state: StoppedState, count: number): State {
    return { type: "STARTED", count };
}

function addToCountHandler(state: StartedState, count: number): State {
    return { ...state, count: state.count + count };
}

function stopHandler(state: StartedState): State {
    return { type: "STOPPED" };
}

const stoppedReducer = upcastingReducer<StoppedState, State>()
    .case(startWithCount, startWithCountHandler);

const startedReducer = upcastingReducer<StartedState, State>()
    .case(addToCount, addToCountHandler)
    .case(stop, stopHandler);

function reducer(state: State, action: Redux.Action): State {
    if (state.type === "STOPPED") {
        return stoppedReducer(state, action);
    } else if (state.type === "STARTED") {
        return startedReducer(state, action);
    } else {
        throw new Error("Unknown state");
    }
}
```

Copyright © 2017 David Philipson

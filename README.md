# Redux TypeScript Reducers

Fluent syntax for defining typesafe reducers on top of [redux-typescript-actions](https://github.com/aikoven/redux-typescript-actions).

[![Build Status](https://travis-ci.org/dphilipson/redux-typescript-reducers.svg?branch=master)](https://travis-ci.org/dphilipson/redux-typescript-reducers)

## Installation

```
npm install --save redux-typescript-reducers
```

## Usage

This library allows you to define reducers by chaining a series of handlers for different action
types and optionally providing an initial value. It builds on top of and assumes familiarity with
the excellent [redux-typescript-actions](https://github.com/aikoven/redux-typescript-actions).

Suppose we have the setup:
``` javascript
import actionCreatorFactory from "redux-typescript-actions";
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
Using vanilla `redux-typescript-actions`, you would most likely define a reducer as follows:
``` javascript
import { Action } from "redux";
import { isType } from "redux-typescript-actions";

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

`redux-typescript-reducers` exports two functions: `reducerWithInitialState` and
`reducerWithoutInitialState`. Redux seems to really want you to provide an initial state for your
reducers (and enforces it at the root level and if you use `combineReducers`), so
`reducerWithInitialState` will likely be the more common choice, but the option to not provide an
initial state is there in case you use some other means of composing reducers.

Copyright © 2017 David Philipson

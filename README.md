# Redux TypeScript Reducers

Fluent syntax for defining typesafe reducers on top of [redux-typescript-actions](https://github.com/aikoven/redux-typescript-actions).

[![Build Status](https://travis-ci.org/dphilipson/redux-typescript-reducers.svg?branch=master)](https://travis-ci.org/dphilipson/redux-typescript-reducers)

## Installation

```
npm install --save redux-typescript-reducers
```

## Usage

This library allows you to define reducers by chaining a series of handlers for different action
types and optionally providing an initial value. It assumes familiarity with the excellent library
[redux-typescript-actions](https://github.com/aikoven/redux-typescript-actions).

Suppose we have the setup:
``` javascript
import actionCreatorFactory from "redux-typescript-actions";

const actionCreator = actionCreatorFactory();

const INITIAL_STATE = "Hello";

const sliceState = actionCreator<number>("SLICE_STATE");
function sliceStateHandler(state: string, payload: number): string {
    return state.slice(payload);
}

const toUpperCaseState = actionCreator<void>("TO_UPPER_CASE_STATE");
function toUpperCaseStateHandler(state: string): string {
    return state.toUpperCase();
}
```
Using vanilla `redux-typescript-actions`, you would most likely define a reducer as follows:
``` javascript
import { Action } from "redux";
import { isType } from "redux-typescript-actions";

function reducer(state = INITIAL_STATE, action: Action): State {
    if (isType(action, sliceState)) {
        return sliceStateHandler(state, action.payload);
    } else if (isType(action, toUpperCaseState)) {
        return toUpperCaseStateHandler(state, action.payload);
    } else {
        return state;
    }
}
```
With `redux-typescript-reducers`, this is exactly equivalent to the following code:
``` javascript
import { reducerWithInitialState } from "redux-typescript-reducer";

const reducer = reducerWithInitialState(INITIAL_STATE)
    .case(sliceState, sliceStateHandler)
    .case(toUpperCaseState, toUpperCaseStateHandler);
```
Everything is typesafe. If the handler is handling the wrong payload type for the given action
type, then TypeScript will complain.

The reducer builders are immutable. Each call to `.case()` returns a new reducer rather than
modifying the callee.

`redux-typescript-reducers` exports two functions: `reducerWithInitialState` and
`reducerWithoutInitialState`. Redux seems to really want you to provide an initial state for your
reducers (and enforces it at the root level and if you use `combineReducers`), so
`reducerWithInitialState` will likely be the more common choice.

Copyright © 2017 David Philipson

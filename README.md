# TypeScript FSA Reducers

Fluent syntax for defining typesafe Redux reducers on top of
[typescript-fsa](https://github.com/aikoven/typescript-fsa).

[![Build
Status](https://travis-ci.org/dphilipson/typescript-fsa-reducers.svg?branch=master)](https://travis-ci.org/dphilipson/typescript-fsa-reducers)

## Introduction

This library will allow you to write typesafe reducers that look like this:

```ts
const reducer = reducerWithInitialState(INITIAL_STATE)
    .case(setName, setNameHandler)
    .case(addBalance, addBalanceHandler)
    .case(setIsFrozen, setIsFrozenHandler);
```

It removes the boilerplate normally associated with writing reducers, including
if-else chains, the default case, and the need to pull the payload field off of
the action.

## Table of Contents

<!-- toc -->

- [Usage](#usage)
- [Installation](#installation)
- [API](#api)
  * [Starting a reducer chain](#starting-a-reducer-chain)
    + [`reducerWithInitialState(initialState)`](#reducerwithinitialstateinitialstate)
    + [`reducerWithoutInitialState()`](#reducerwithoutinitialstate)
    + [`upcastingReducer()`](#upcastingreducer)
  * [Reducer chain methods](#reducer-chain-methods)
    + [`.case(actionCreator, handler(state, payload) => newState)`](#caseactioncreator-handlerstate-payload--newstate)
    + [`.caseWithAction(actionCreator, handler(state, action) => newState)`](#casewithactionactioncreator-handlerstate-action--newstate)
    + [`.cases(actionCreators, handler(state, payload) => newState)`](#casesactioncreators-handlerstate-payload--newstate)
    + [`.casesWithAction(actionCreators, handler(state, action) => newState)`](#caseswithactionactioncreators-handlerstate-action--newstate)
    + [`.withHandling(updateBuilder(builder) => builder)`](#withhandlingupdatebuilderbuilder--builder)
    + [`.default(handler(state, action) => newState)`](#defaulthandlerstate-action--newstate)
    + [`.build()`](#build)

<!-- tocstop -->

## Usage

This library allows you to define reducers by chaining a series of handlers for
different action types and optionally providing an initial value. It builds on
top of and assumes familiarity with the excellent
[typescript-fsa](https://github.com/aikoven/typescript-fsa).

Suppose we have used [typescript-fsa](https://github.com/aikoven/typescript-fsa)
to define our state and some actions:

```ts
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
const addBalance = actionCreator<number>("ADD_BALANCE");
const setIsFrozen = actionCreator<boolean>("SET_IS_FROZEN");
```

Using vanilla `typescript-fsa`, we might define a reducer as follows:

```ts
import { Action } from "redux";
import { isType } from "typescript-fsa";

function reducer(state = INITIAL_STATE, action: Action): State {
    if (isType(action, setName)) {
        return { ...state, name: action.payload };
    } else if (isType(action, addBalance)) {
        return {
            ...state,
            balance: state.balance + action.payload,
        };
    } else if (isType(action, setIsFrozen)) {
        return { ...state, isFrozen: action.payload };
    } else {
        return state;
    }
}
```

Using this library, the above is exactly equivalent to the following code:

```ts
import { reducerWithInitialState } from "typescript-fsa-reducers";

const reducer = reducerWithInitialState(INITIAL_STATE)
    .case(setName, (state, name) => ({ ...state, name }))
    .case(addBalance, (state, amount) => ({
        ...state,
        balance: state.balance + amount,
    }))
    .case(setIsFrozen, (state, isFrozen) => ({ ...state, isFrozen }));
```

Note that unlike the vanilla case, there is no need to pull the payload off of
the action, as it is passed directly to the handler, nor is it necessary to
specify a default case which returns `state` unmodified.

Everything is typesafe. If the types of the action payload and handler don't
line up, then TypeScript will complain. If you find it easier to read, you can
of course pull out the handlers into separate functions, as shown in the
[Introduction](#introduction).

If the full action is needed rather than just the payload, `.caseWithAction()`
may be used in place of `.case()`. This may be useful if you intend to pass the
action unchanged to a different reducer, or if you need to read the `meta` field
of the action. For example:

```ts
import { Action } from "typescript-fsa";

const setText = actionCreator<string>("SET_TEXT");

const reducer = reducerWithInitialState({
    text: "",
    lastEditBy: "",
}).caseWithAction(incrementCount, (state, { payload, meta }) => ({
    text: payload,
    lastEditBy: meta.author,
}));

// Returns { text: "hello", lastEditBy: "cbrontë" }.
reducer(undefined, setText("hello", { author: "cbrontë" }));
```

Further, a single handler may be assigned to multiple action types at once using
`.cases()` or `.casesWithAction()`:

```ts
const reducer = reducerWithInitialState(initialState).cases(
    [setName, addBalance],
    (state, payload) => {
        // Payload has type SetNamePayload | AddBalancePayload.
        // ...

        // Make sure to return the updated state, or TypeScript will give you a
        // rather unhelpful error message.
        return state;
    },
);
```

The reducer builder chains are mutable. Each call to `.case()` modifies the
callee to respond to the specified action type. If this is undesirable, see the
[`.build()`](#build) method below.

## Installation

For this library to be useful, you will also need
[typescript-fsa](https://github.com/aikoven/typescript-fsa) to define your
actions.

With Yarn:

```
yarn add typescript-fsa-reducers typescript-fsa
```

Or with NPM:

```
npm install --save typescript-fsa-reducers typescript-fsa
```

## API

### Starting a reducer chain

#### `reducerWithInitialState(initialState)`

Starts a reducer builder-chain which uses the provided initial state if passed
`undefined` as its state. For example usage, see the [Usage](#usage) section
above.

#### `reducerWithoutInitialState()`

Starts a reducer builder-chain without special logic for an initial state.
`undefined` will be treated like any other value for the state.

Redux seems to really want you to provide an initial state for your reducers.
Its `createStore` API encourages it and `combineReducers` function enforces it.
For the Redux author's reasoning behind this, see [this
thread](https://github.com/reactjs/redux/issues/514). For this reason,
`reducerWithInitialState` will likely be the more common choice, but the option
to not provide an initial state is there in case you have some means of
composing reducers for which initial state is unnecessary.

Note that since the type of the state cannot be inferred from the initial state,
it must be provided as a type parameter:

```ts
const reducer = reducerWithoutInitialState<State>()
    .case(setName, setNameHandler)
    .case(addBalance, addBalanceHandler)
    .case(setIsFrozen, setIsFrozenHandler);
```

#### `upcastingReducer()`

Starts a builder-chain which produces a "reducer" whose return type is a
supertype of the input state. This is most useful for handling a state which may
be in one of several "modes", each of which responds differently to actions and
can transition to the other modes. Many applications will not have a use for
this.

Note that the function produced is technically not a reducer because the initial
and updated states are different types.

Example usage:

```javascript
type State = StoppedState | RunningState;

interface StoppedState {
    type: "STOPPED";
}

interface StartedState {
    type: "STARTED";
    count: number;
}

const INITIAL_STATE: State = { type: "STOPPED" };

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

function reducer(state = INITIAL_STATE, action: Redux.Action): State {
    if (state.type === "STOPPED") {
        return stoppedReducer(state, action);
    } else if (state.type === "STARTED") {
        return startedReducer(state, action);
    } else {
        throw new Error("Unknown state");
    }
}
```

### Reducer chain methods

#### `.case(actionCreator, handler(state, payload) => newState)`

Mutates the reducer such that it applies `handler` when passed actions matching
the type of `actionCreator`. For examples, see [Usage](#usage).

#### `.caseWithAction(actionCreator, handler(state, action) => newState)`

Like `.case()`, except that `handler` receives the entire action as its second
argument rather than just the payload. This is useful if you want to read other
properties of the action, such as `meta` or `error`, or if you want to pass the
entire action unmodified to some other function. For an example, see
[Usage](#usage).

#### `.cases(actionCreators, handler(state, payload) => newState)`

Like `.case()`, except that multiple action creators may be provided and the
same handler is applied to all of them. That is,

```javascript
reducerWithInitialState(initialState).cases(
    [setName, addBalance, setIsFrozen],
    handler,
);
```

is equivalent to

```javascript
reducerWithInitialState(initialState)
    .case(setName, handler)
    .case(addBalance, handler)
    .case(setIsFrozen, handler);
```

Note that the payload passed to the handler may be of the type of any of the
listed action types' payloads. In TypeScript terms, this means it has type `P1 | P2 | ...`, where `P1, P2, ...` are the payload types of the listed action
creators.

The payload type is inferred automatically for up to four action types. After
that, it must be supplied as a type annotation, for example:

```javascript
reducerWithInitialState(initialState).cases <
    { documentId: number } >
    ([
        selectDocument,
        editDocument,
        deleteDocument,
        sendDocument,
        archiveDocument,
    ],
    handler);
```

#### `.casesWithAction(actionCreators, handler(state, action) => newState)`

Like `.cases()`, except that the handler receives the entire action as its
second argument rather than just the payload.

#### `.withHandling(updateBuilder(builder) => builder)`

Convenience method which applies the provided function to the current builder
and returns the result. Useful if you have a sequence of builder updates (calls
to `.case()`, etc.) which you want to reuse across several reducers.

#### `.default(handler(state, action) => newState)`

Produces a reducer which applies `handler` when no previously added `.case()`,
`.caseWithAction()`, etc. matched. The handler is similar to the one in
`.caseWithAction()`. Note that `.default()` ends the chain and internally does
the same as [`.build()`](#build), because it is not intended that the chain be
mutated after calling `.default()`.

This is useful if you have a "delegate" reducer that should be called on any
action after handling a few specific actions in the parent.

```ts
const NESTED_STATE = {
    someProp: "hello",
};

const nestedReducer = reducerWithInitialState(NESTED_STATE)
    .case(...);

const INITIAL_STATE = {
    someOtherProp: "world"
    nested: NESTED_STATE
};

const reducer = reducerWithInitialState(INITIAL_STATE)
    .case(...)
    .default((state, action) => ({
        ...state,
        nested: nestedReducer(state.nested, action),
    }));
```

#### `.build()`

Returns a plain reducer function whose behavior matches the current state of the
reducer chain. Further updates to the chain (through calls to `.case()`) will
have no effect on this function.

There are two reasons you may want to do this:

1.  **You want to ensure that the reducer is not modified further**

    Calling `.build()` is an example of defensive coding. It prevents someone
    from causing confusing behavior by importing your reducer in an unrelated
    file and adding cases to it.

2.  **You want your package to export a reducer, but not have its types depend
    on `typescript-fsa-reducers`**

    If the code that defines a reducer and the code that uses it reside in
    separate NPM packages, you may run into type errors since the exported
    reducer has type `ReducerBuilder`, which the consuming package does not
    recognize unless it also depends on `typescript-fsa-reducers`. This is
    avoided by calling `.build()`, whose return type is a plain function
    instead.

Example usage:

```javascript
const reducer = reducerWithInitialState(INITIAL_STATE)
    .case(setName, setNameHandler)
    .case(addBalance, addBalanceHandler)
    .case(setIsFrozen, setIsFrozenHandler)
    .build();
```

Copyright © 2017 David Philipson

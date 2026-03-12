"use client";
import React from "react";

// FydelysApp.jsx n'a pas de déclaration TypeScript — on passe par require
// eslint-disable-next-line @typescript-eslint/no-require-imports
const App = require("./FydelysApp").default as React.ComponentType<any>;

export default App;